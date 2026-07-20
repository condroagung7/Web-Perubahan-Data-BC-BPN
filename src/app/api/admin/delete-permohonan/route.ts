import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";
import type { DokumenPendukung } from "@/types/database";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN, getClientIp } from "@/lib/security/rate-limit";
import { logAdminAction } from "@/lib/security/audit-log";
import { sanitizeUUID } from "@/lib/security/sanitize";

const DOKUMEN_BUCKET = "dokumen-permohonan";
const SURAT_BUCKET = "surat-persetujuan";

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

    if (!id) {
      return NextResponse.json(
        { error: "ID permohonan wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: permohonan, error: fetchError } = await supabase
      .from("permohonan")
      .select("kode_tracking, dokumen_pendukung, surat_persetujuan_url")
      .eq("id", id)
      .single<{
        kode_tracking: string;
        dokumen_pendukung: DokumenPendukung[] | null;
        surat_persetujuan_url: string | null;
      }>();

    if (fetchError || !permohonan) {
      return NextResponse.json(
        { error: "Permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    const dokumenPaths = (permohonan.dokumen_pendukung ?? [])
      .map((dokumen) => dokumen.url)
      .filter(Boolean);

    if (dokumenPaths.length > 0) {
      const { error: removeDokumenError } = await supabase.storage
        .from(DOKUMEN_BUCKET)
        .remove(dokumenPaths);

      if (removeDokumenError) {
        console.error(
          "Gagal menghapus dokumen pendukung:",
          removeDokumenError
        );
        return NextResponse.json(
          { error: "Gagal menghapus dokumen pendukung" },
          { status: 500 }
        );
      }
    }

    if (permohonan.surat_persetujuan_url) {
      const suratPath = `${permohonan.kode_tracking}/Surat-Persetujuan-${permohonan.kode_tracking}.docx`;
      const { error: removeSuratError } = await supabase.storage
        .from(SURAT_BUCKET)
        .remove([suratPath]);

      if (removeSuratError) {
        console.error("Gagal menghapus surat persetujuan:", removeSuratError);
        return NextResponse.json(
          { error: "Gagal menghapus surat persetujuan" },
          { status: 500 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from("permohonan")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Gagal menghapus data permohonan:", deleteError);
      return NextResponse.json(
        { error: "Gagal menghapus data permohonan" },
        { status: 500 }
      );
    }

    // Audit log
    logAdminAction("delete_permohonan", user.email ?? "unknown", {
      targetId: id,
      details: { kode_tracking: permohonan.kode_tracking },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      message: "Permohonan berhasil dihapus dari dashboard",
    });
  },
  {
    rateLimit: RATE_LIMIT_ADMIN,
    csrf: true,
  }
);