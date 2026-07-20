import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { DokumenPendukung } from "@/types/database";
import { assertAdmin } from "@/lib/auth/admin";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN, getClientIp } from "@/lib/security/rate-limit";
import { logAdminAction } from "@/lib/security/audit-log";
import { sanitizeUUID, sanitizeString } from "@/lib/security/sanitize";

const BUCKET_NAME = "dokumen-permohonan";

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
    const permohonanId = body.permohonanId
      ? sanitizeUUID(String(body.permohonanId))
      : null;
    const path = body.path ? sanitizeString(String(body.path)) : null;

    if (!permohonanId || !path) {
      return NextResponse.json(
        { error: "ID permohonan dan path dokumen wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data: permohonan, error: fetchError } = await supabase
      .from("permohonan")
      .select("dokumen_pendukung")
      .eq("id", permohonanId)
      .single<{ dokumen_pendukung: DokumenPendukung[] | null }>();

    if (fetchError || !permohonan) {
      return NextResponse.json(
        { error: "Permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    const currentDokumen = permohonan.dokumen_pendukung ?? [];
    const dokumenAda = currentDokumen.some((dokumen) => dokumen.url === path);

    if (!dokumenAda) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (removeError) {
      console.error("Gagal menghapus dokumen pendukung:", removeError);
      return NextResponse.json(
        { error: "Gagal menghapus file dokumen" },
        { status: 500 }
      );
    }

    const nextDokumen = currentDokumen.filter(
      (dokumen) => dokumen.url !== path
    );
    const { error: updateError } = await supabase
      .from("permohonan")
      .update({ dokumen_pendukung: nextDokumen })
      .eq("id", permohonanId);

    if (updateError) {
      console.error("Gagal memperbarui daftar dokumen:", updateError);
      return NextResponse.json(
        { error: "File terhapus, tetapi daftar dokumen gagal diperbarui" },
        { status: 500 }
      );
    }

    logAdminAction("delete_dokumen", user.email ?? "unknown", {
      targetId: permohonanId,
      details: { path },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      message: "Dokumen pendukung berhasil dihapus",
    });
  },
  {
    rateLimit: RATE_LIMIT_ADMIN,
    csrf: true,
  }
);