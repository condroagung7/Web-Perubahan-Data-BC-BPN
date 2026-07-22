import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN } from "@/lib/security/rate-limit";
import { sanitizeUUID } from "@/lib/security/sanitize";
import { kirimPesanKeChatId } from "@/lib/telegram/telegram";

/**
 * Extract and validate the UUID `id` segment from the URL path.
 * Path format: /api/admin/telegram-admins/<id>
 */
function getIdFromPath(request: NextRequest): string | null {
  const segments = request.nextUrl.pathname.split("/");
  const raw = segments[segments.length - 1] ?? "";
  return sanitizeUUID(raw);
}

/**
 * PATCH /api/admin/telegram-admins/[id]
 * Toggle is_active atau kirim test notifikasi
 */
export const PATCH = secureHandler(async (request: NextRequest) => {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const adminError = assertAdmin(user);
  if (adminError) return adminError;

  const id = getIdFromPath(request);
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const body = await request.json();
  const supabase = createServiceRoleClient();

  // Handle test notification
  if (body.action === "test") {
    const { data: admin, error: fetchError } = await supabase
      .from("telegram_admins")
      .select("chat_id, name")
      .eq("id", id)
      .single();

    if (fetchError || !admin) {
      return NextResponse.json(
        { error: "Admin tidak ditemukan" },
        { status: 404 }
      );
    }

    const success = await kirimPesanKeChatId(
      admin.chat_id,
      `✅ <b>Test Notifikasi</b>\n\nHalo <b>${admin.name}</b>! Konfigurasi Telegram Anda berhasil. Anda akan menerima notifikasi permohonan baru melalui chat ini.`
    );

    if (!success) {
      return NextResponse.json(
        {
          error:
            "Gagal mengirim pesan test. Pastikan Chat ID benar dan bot sudah di-start.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Pesan test berhasil dikirim" });
  }

  // Handle toggle is_active
  if (typeof body.is_active === "boolean") {
    const { data, error } = await supabase
      .from("telegram_admins")
      .update({ is_active: body.is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Gagal update telegram admin:", error);
      return NextResponse.json(
        { error: "Gagal memperbarui data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
}, { rateLimit: RATE_LIMIT_ADMIN, csrf: true });

/**
 * DELETE /api/admin/telegram-admins/[id]
 * Hapus admin Telegram
 */
export const DELETE = secureHandler(async (request: NextRequest) => {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const adminError = assertAdmin(user);
  if (adminError) return adminError;

  const id = getIdFromPath(request);
  if (!id) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("telegram_admins")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Gagal hapus telegram admin:", error);
    return NextResponse.json(
      { error: "Gagal menghapus data" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Admin berhasil dihapus" });
}, { rateLimit: RATE_LIMIT_ADMIN, csrf: true });