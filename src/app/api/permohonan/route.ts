import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { permohonanSchema } from "@/lib/validations/permohonan";
import { kirimNotifikasiPermohonanBaru } from "@/lib/email/resend";
import { kirimNotifikasiTelegram } from "@/lib/telegram/telegram";
import { secureHandler } from "@/lib/security/api-handler";
import {
  RATE_LIMIT_PERMOHONAN,
  RATE_LIMIT_STATUS,
} from "@/lib/security/rate-limit";
import { sanitizeDeep, sanitizeTrackingCode } from "@/lib/security/sanitize";

const EMPTY_MANIFEST_VALUE = "-";

/**
 * Validasi Cloudflare Turnstile token
 */
async function validateTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      }
    );

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("Turnstile validation error:", error);
    return false;
  }
}

export const POST = secureHandler(
  async (request: NextRequest) => {
    const body = await request.json();

    // Validasi Turnstile token
    const turnstileToken = body.turnstileToken;
    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Token verifikasi tidak ditemukan" },
        { status: 400 }
      );
    }

    const isValid = await validateTurnstileToken(turnstileToken);
    if (!isValid) {
      return NextResponse.json(
        { error: "Verifikasi gagal. Coba lagi." },
        { status: 400 }
      );
    }

    // Hapus token dari body sebelum validasi schema
    const { turnstileToken: _, ...dataWithoutToken } = body;

    // Sanitize all string inputs before validation
    const sanitizedBody = sanitizeDeep(dataWithoutToken);

    const parsed = permohonanSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const isSaranaPengangkut =
      parsed.data.alasan_perubahan === "Sarana Pengangkut";
    const supabase = createServiceRoleClient();
    const insertData = {
      ...parsed.data,
      nomor_pos: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.nomor_pos,
      nama_sarana_pengangkut: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.nama_sarana_pengangkut,
      nomor_bl_awb: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.nomor_bl_awb,
      tanggal_bl_awb: isSaranaPengangkut
        ? "1970-01-01"
        : parsed.data.tanggal_bl_awb,
      jumlah_kemasan: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.jumlah_kemasan,
      berat_kotor: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.berat_kotor,
      uraian_barang: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.uraian_barang,
      nama_shipper: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.nama_shipper,
      nama_consignee: isSaranaPengangkut
        ? EMPTY_MANIFEST_VALUE
        : parsed.data.nama_consignee,
      nama_penandatangan: "-",
      jabatan_penandatangan: "Kepala Kantor",
    };

    const { data, error } = await supabase
      .from("permohonan")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan permohonan" },
        { status: 500 }
      );
    }

    try {
      await kirimNotifikasiPermohonanBaru(data);
    } catch (emailError) {
      console.error("Gagal kirim email notifikasi:", emailError);
    }

    // Kirim notifikasi Telegram (jika konfigurasi tersedia)
    try {
      await kirimNotifikasiTelegram(data);
    } catch (telegramError) {
      console.error("Gagal kirim notifikasi Telegram:", telegramError);
    }

    return NextResponse.json(
      {
        message: "Permohonan berhasil diajukan",
        kode_tracking: data.kode_tracking,
      },
      { status: 201 }
    );
  },
  {
    rateLimit: RATE_LIMIT_PERMOHONAN,
    csrf: true,
    maxBodySize: 512_000, // 500KB max for form submission
  }
);

export const GET = secureHandler(
  async (request: NextRequest) => {
    const rawKode = request.nextUrl.searchParams.get("kode");

    if (!rawKode) {
      return NextResponse.json(
        { error: "Kode tracking wajib diisi" },
        { status: 400 }
      );
    }

    // Sanitize tracking code input
    const kode = sanitizeTrackingCode(rawKode);
    if (!kode) {
      return NextResponse.json(
        { error: "Kode tracking tidak valid" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("permohonan")
      .select(
        "kode_tracking, nama_perusahaan, email_perusahaan, jenis_perubahan_data, status, status_seksi, created_at, catatan_admin"
      )
      .eq("kode_tracking", kode)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  },
  {
    rateLimit: RATE_LIMIT_STATUS,
    csrf: false, // GET requests don't need CSRF
  }
);