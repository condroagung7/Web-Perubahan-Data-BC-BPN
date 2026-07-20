import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { kirimNotifikasiPenolakan } from "@/lib/email/resend";
import { assertAdmin } from "@/lib/auth/admin";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN, getClientIp } from "@/lib/security/rate-limit";
import { logAdminAction } from "@/lib/security/audit-log";
import { sanitizeString, sanitizeUUID } from "@/lib/security/sanitize";

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
    const catatan = body.catatan ? sanitizeString(String(body.catatan)) : null;

    if (!id || !catatan) {
      return NextResponse.json(
        { error: "ID permohonan dan catatan kekurangan dokumen wajib diisi" },
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

    const { error: updateError } = await supabase
      .from("permohonan")
      .update({ status: "ditolak", catatan_admin: catatan })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Gagal memperbarui status" },
        { status: 500 }
      );
    }

    await supabase.from("riwayat_status").insert({
      permohonan_id: id,
      status_sebelum: permohonan.status,
      status_sesudah: "ditolak",
      catatan,
      diubah_oleh: user.email ?? null,
    });

    // Audit log
    logAdminAction("reject_permohonan", user.email ?? "unknown", {
      targetId: id,
      details: { catatan, kode_tracking: permohonan.kode_tracking },
      ip: getClientIp(request),
    });

    try {
      await kirimNotifikasiPenolakan(permohonan, catatan);
    } catch (emailError) {
      console.error("Gagal kirim email kekurangan dokumen:", emailError);
    }

    return NextResponse.json({
      message: "Permohonan ditandai kekurangan dokumen",
    });
  },
  {
    rateLimit: RATE_LIMIT_ADMIN,
    csrf: true,
  }
);