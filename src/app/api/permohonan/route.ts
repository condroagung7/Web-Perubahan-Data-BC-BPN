import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { permohonanSchema } from "@/lib/validations/permohonan";
import { kirimNotifikasiPermohonanBaru } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = permohonanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Data tidak valid", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("permohonan")
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Gagal menyimpan permohonan" },
        { status: 500 }
      );
    }

    // Kirim notifikasi email ke instansi — kegagalan email tidak membatalkan
    // permohonan yang sudah tersimpan, hanya dicatat di log.
    try {
      await kirimNotifikasiPermohonanBaru(data);
    } catch (emailError) {
      console.error("Gagal kirim email notifikasi:", emailError);
    }

    return NextResponse.json(
      {
        message: "Permohonan berhasil diajukan",
        kode_tracking: data.kode_tracking,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}

// GET ?kode=xxxxx -> cek status permohonan oleh publik (tanpa expose data sensitif penuh)
export async function GET(request: NextRequest) {
  const kode = request.nextUrl.searchParams.get("kode");

  if (!kode) {
    return NextResponse.json(
      { error: "Kode tracking wajib diisi" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("permohonan")
    .select(
      "kode_tracking, nama_perusahaan, jenis_perubahan_data, status, created_at, catatan_admin"
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
}