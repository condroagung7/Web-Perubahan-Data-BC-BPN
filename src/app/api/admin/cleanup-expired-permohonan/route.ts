import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DokumenPendukung } from "@/types/database";
import { logSecurityEvent } from "@/lib/security/audit-log";
import { getClientIp } from "@/lib/security/rate-limit";

const DOKUMEN_BUCKET = "dokumen-permohonan";
const SURAT_BUCKET = "surat-persetujuan";
const RETENTION_DAYS = 30;

type ExpiredPermohonan = {
  id: string;
  kode_tracking: string;
  dokumen_pendukung: DokumenPendukung[] | null;
  surat_persetujuan_url: string | null;
};

function getCutoffDate() {
  const date = new Date();
  date.setDate(date.getDate() - RETENTION_DAYS);
  return date.toISOString();
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  // Constant-time comparison to prevent timing attacks
  if (!authHeader) return false;
  const expected = `Bearer ${secret}`;
  if (authHeader.length !== expected.length) return false;

  let mismatch = 0;
  for (let i = 0; i < authHeader.length; i++) {
    mismatch |= authHeader.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

async function deletePermohonanFiles(permohonan: ExpiredPermohonan) {
  const supabase = createServiceRoleClient();
  const dokumenPaths = (permohonan.dokumen_pendukung ?? [])
    .map((dokumen) => dokumen.url)
    .filter(Boolean);

  if (dokumenPaths.length > 0) {
    const { error } = await supabase.storage
      .from(DOKUMEN_BUCKET)
      .remove(dokumenPaths);
    if (error) throw error;
  }

  if (permohonan.surat_persetujuan_url) {
    const suratPath = `${permohonan.kode_tracking}/Surat-Persetujuan-${permohonan.kode_tracking}.docx`;
    const { error } = await supabase.storage
      .from(SURAT_BUCKET)
      .remove([suratPath]);
    if (error) throw error;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    logSecurityEvent("unauthorized_cron_access", {
      ip: getClientIp(request),
      path: request.nextUrl.pathname,
    });
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  try {
    const supabase = createServiceRoleClient();
    const cutoffDate = getCutoffDate();

    const { data: riwayatList, error: riwayatError } = await supabase
      .from("riwayat_status")
      .select("permohonan_id, created_at")
      .eq("status_sesudah", "disetujui")
      .lte("created_at", cutoffDate);

    if (riwayatError) {
      console.error("Gagal membaca riwayat expired:", riwayatError);
      return NextResponse.json(
        { error: "Gagal membaca riwayat status" },
        { status: 500 }
      );
    }

    const expiredIds = Array.from(
      new Set(
        (riwayatList ?? [])
          .map((item) => item.permohonan_id)
          .filter(Boolean)
      )
    );

    if (expiredIds.length === 0) {
      return NextResponse.json({
        message:
          "Tidak ada permohonan diterima lengkap yang melewati 30 hari",
        deleted: 0,
      });
    }

    const { data: permohonanList, error: permohonanError } = await supabase
      .from("permohonan")
      .select("id, kode_tracking, dokumen_pendukung, surat_persetujuan_url")
      .eq("status", "disetujui")
      .in("id", expiredIds)
      .returns<ExpiredPermohonan[]>();

    if (permohonanError) {
      console.error("Gagal membaca permohonan expired:", permohonanError);
      return NextResponse.json(
        { error: "Gagal membaca data permohonan" },
        { status: 500 }
      );
    }

    const deletedIds: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const permohonan of permohonanList ?? []) {
      try {
        await deletePermohonanFiles(permohonan);

        const { error: deleteError } = await supabase
          .from("permohonan")
          .delete()
          .eq("id", permohonan.id);

        if (deleteError) throw deleteError;
        deletedIds.push(permohonan.id);
      } catch (error) {
        console.error(
          `Gagal menghapus permohonan expired ${permohonan.id}:`,
          error
        );
        failed.push({
          id: permohonan.id,
          error:
            error instanceof Error
              ? error.message
              : "Gagal menghapus permohonan",
        });
      }
    }

    return NextResponse.json({
      message: "Cleanup permohonan diterima lengkap selesai",
      cutoffDate,
      deleted: deletedIds.length,
      failed,
    });
  } catch (error) {
    console.error("[CRON_ERROR] cleanup-expired:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}