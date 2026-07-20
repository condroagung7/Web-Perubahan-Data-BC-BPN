import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN, getClientIp } from "@/lib/security/rate-limit";
import { logAdminAction } from "@/lib/security/audit-log";
import { sanitizeUUID } from "@/lib/security/sanitize";

const BUCKET_NAME = "surat-persetujuan";

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
      .select("kode_tracking, surat_persetujuan_url")
      .eq("id", id)
      .single<{
        kode_tracking: string;
        surat_persetujuan_url: string | null;
      }>();

    if (fetchError || !permohonan) {
      return NextResponse.json(
        { error: "Permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!permohonan.surat_persetujuan_url) {
      return NextResponse.json(
        { error: "Surat persetujuan belum tersedia" },
        { status: 404 }
      );
    }

    const filePath = `${permohonan.kode_tracking}/Surat-Persetujuan-${permohonan.kode_tracking}.docx`;
    const { error: removeError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (removeError) {
      console.error("Gagal menghapus surat persetujuan:", removeError);
      return NextResponse.json(
        { error: "Gagal menghapus file surat persetujuan" },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabase
      .from("permohonan")
      .update({ surat_persetujuan_url: null })
      .eq("id", id);

    if (updateError) {
      console.error("Gagal mengosongkan URL surat persetujuan:", updateError);
      return NextResponse.json(
        { error: "File terhapus, tetapi data surat gagal diperbarui" },
        { status: 500 }
      );
    }

    logAdminAction("delete_surat_persetujuan", user.email ?? "unknown", {
      targetId: id,
      details: { kode_tracking: permohonan.kode_tracking },
      ip: getClientIp(request),
    });

    return NextResponse.json({
      message: "Surat persetujuan berhasil dihapus",
    });
  },
  {
    rateLimit: RATE_LIMIT_ADMIN,
    csrf: true,
  }
);