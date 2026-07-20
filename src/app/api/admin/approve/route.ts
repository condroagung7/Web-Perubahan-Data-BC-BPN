import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateSuratPersetujuan } from "@/lib/docx/generate-surat";
import { kirimDokumenPendukungDiterimaLengkap } from "@/lib/email/resend";
import { assertAdmin } from "@/lib/auth/admin";
import type { DokumenPendukung } from "@/types/database";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN } from "@/lib/security/rate-limit";
import { logAdminAction } from "@/lib/security/audit-log";
import { sanitizeString, sanitizeUUID } from "@/lib/security/sanitize";
import { getClientIp } from "@/lib/security/rate-limit";

const DOKUMEN_BUCKET = "dokumen-permohonan";

function sanitizeFilename(filename: string, fallback: string) {
  const cleaned = filename.replace(/[\\/:*?"<>|]/g, "-").trim();
  return cleaned || fallback;
}

function isSuratPernyataan(dokumen: DokumenPendukung) {
  return `${dokumen.nama} ${dokumen.nama_file}`
    .toLowerCase()
    .includes("surat pernyataan");
}

function getContentType(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";

  return "application/octet-stream";
}

async function getDokumenPendukungAttachments(
  supabase: ReturnType<typeof createServiceRoleClient>,
  dokumenPendukung: DokumenPendukung[] | null
) {
  const documents = dokumenPendukung ?? [];

  const attachments = await Promise.all(
    documents.map(async (dokumen, index) => {
      const { data, error } = await supabase.storage
        .from(DOKUMEN_BUCKET)
        .download(dokumen.url);

      if (error || !data) {
        throw new Error(
          `Gagal mengambil dokumen pendukung: ${dokumen.nama_file}`
        );
      }

      return {
        filename: sanitizeFilename(
          dokumen.nama_file,
          `Dokumen-Pendukung-${index + 1}`
        ),
        content: Buffer.from(await data.arrayBuffer()),
        contentType: getContentType(dokumen.nama_file),
      };
    })
  );

  return attachments;
}

export const POST = secureHandler(
  async (request: NextRequest) => {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const adminError = assertAdmin(user);
    if (adminError) return adminError;

    const body = await request.json();
    const id = body.id ? sanitizeUUID(String(body.id)) : null;
    const pic = body.pic ? sanitizeString(String(body.pic)) : null;

    if (!id) {
      return NextResponse.json(
        { error: "ID permohonan wajib diisi" },
        { status: 400 }
      );
    }

    if (!pic?.trim()) {
      return NextResponse.json(
        { error: "Nama PIC wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: permohonan, error: fetchError } = await supabase
      .from("permohonan")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !permohonan) {
      return NextResponse.json(
        { error: "Permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    const dokumenPendukung = permohonan.dokumen_pendukung ?? [];
    const hasSuratPernyataan = dokumenPendukung.some(isSuratPernyataan);

    if (!hasSuratPernyataan) {
      return NextResponse.json(
        { error: "Surat Pernyataan belum ada di dokumen pendukung" },
        { status: 400 }
      );
    }

    const docxBuffer = await generateSuratPersetujuan(permohonan);
    const filePath = `${permohonan.kode_tracking}/Surat-Persetujuan-${permohonan.kode_tracking}.docx`;

    const { error: uploadError } = await supabase.storage
      .from("surat-persetujuan")
      .upload(filePath, docxBuffer, {
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        upsert: true,
      });

    if (uploadError) {
      console.error("Gagal upload surat:", uploadError);
      return NextResponse.json(
        { error: "Gagal menyimpan surat" },
        { status: 500 }
      );
    }

    const { data: signedUrlData } = await supabase.storage
      .from("surat-persetujuan")
      .createSignedUrl(filePath, 60 * 60 * 24 * 30);

    const { error: updateError } = await supabase
      .from("permohonan")
      .update({
        status: "disetujui",
        pic: pic.trim(),
        surat_persetujuan_url: signedUrlData?.signedUrl ?? null,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Gagal update status:", updateError);
      return NextResponse.json(
        { error: "Gagal memperbarui status" },
        { status: 500 }
      );
    }

    await supabase.from("riwayat_status").insert({
      permohonan_id: id,
      status_sebelum: permohonan.status,
      status_sesudah: "disetujui",
      catatan:
        "Dokumen diterima lengkap dan surat persetujuan diterbitkan otomatis",
      diubah_oleh: user.email ?? null,
    });

    // Audit log
    logAdminAction("approve_permohonan", user.email ?? "unknown", {
      targetId: id,
      details: { pic, kode_tracking: permohonan.kode_tracking },
      ip: getClientIp(request),
    });

    try {
      const attachments = await getDokumenPendukungAttachments(
        supabase,
        dokumenPendukung
      );

      if (attachments.length === 0) {
        console.warn(
          "Tidak ada dokumen pendukung untuk dikirim:",
          permohonan.id
        );
      } else {
        await kirimDokumenPendukungDiterimaLengkap(permohonan, attachments);
      }
    } catch (emailError) {
      console.error("Gagal kirim email dokumen pendukung:", emailError);
    }

    return NextResponse.json({
      message: "Dokumen diterima lengkap",
      url: signedUrlData?.signedUrl,
    });
  },
  {
    rateLimit: RATE_LIMIT_ADMIN,
    csrf: true,
  }
);