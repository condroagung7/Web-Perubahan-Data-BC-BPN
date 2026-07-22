import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN } from "@/lib/security/rate-limit";
import { sanitizeString } from "@/lib/security/sanitize";

/**
 * GET /api/admin/telegram-admins
 * Ambil semua daftar admin Telegram
 */
export const GET = secureHandler(
  async (_request: NextRequest) => {
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
    }

    const adminError = assertAdmin(user);
    if (adminError) return adminError;

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("telegram_admins")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Gagal mengambil daftar telegram admin:", error);
      return NextResponse.json(
        { error: "Gagal mengambil data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data ?? [] });
  },
  { rateLimit: RATE_LIMIT_ADMIN, csrf: false }
);

/**
 * POST /api/admin/telegram-admins
 * Tambah admin Telegram baru
 */
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
    const name = body.name ? sanitizeString(String(body.name)).trim() : "";
    const chat_id = body.chat_id
      ? sanitizeString(String(body.chat_id)).trim()
      : "";

    if (!name) {
      return NextResponse.json(
        { error: "Nama admin wajib diisi" },
        { status: 400 }
      );
    }

    if (!chat_id) {
      return NextResponse.json(
        { error: "Chat ID wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi chat_id hanya berisi angka atau diawali minus (group chat)
    if (!/^-?\d+$/.test(chat_id)) {
      return NextResponse.json(
        { error: "Chat ID tidak valid. Harus berupa angka (contoh: 123456789 atau -1001234567890)" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("telegram_admins")
      .insert({ name, chat_id, is_active: true })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Chat ID sudah terdaftar" },
          { status: 409 }
        );
      }
      console.error("Gagal menambah telegram admin:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan data" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  },
  { rateLimit: RATE_LIMIT_ADMIN, csrf: true }
);