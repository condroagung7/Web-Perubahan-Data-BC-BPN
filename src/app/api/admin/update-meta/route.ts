import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";
import type { StatusPermohonan, StatusSeksi } from "@/types/database";

const STATUS_PERMOHONAN_VALUES: StatusPermohonan[] = [
  "pending",
  "diproses",
  "disetujui",
  "ditolak",
];

const STATUS_SEKSI_VALUES: StatusSeksi[] = [
  "konfirmasi_seksi_terkait",
  "proses",
  "persetujuan",
];

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  const adminError = assertAdmin(user);
  if (adminError) return adminError;

  const body = (await request.json()) as {
    id?: string;
    id_nadine?: string | null;
    pic?: string | null;
    status?: StatusPermohonan;
    status_seksi?: StatusSeksi | null;
  };

  if (!body.id) {
    return NextResponse.json({ error: "ID permohonan wajib diisi" }, { status: 400 });
  }

  if (
    body.status_seksi &&
    !STATUS_SEKSI_VALUES.includes(body.status_seksi)
  ) {
    return NextResponse.json({ error: "Status seksi tidak valid" }, { status: 400 });
  }

  if (body.status && !STATUS_PERMOHONAN_VALUES.includes(body.status)) {
    return NextResponse.json({ error: "Status permohonan tidak valid" }, { status: 400 });
  }

  const updateData: {
    id_nadine?: string | null;
    pic?: string | null;
    status?: StatusPermohonan;
    status_seksi?: StatusSeksi | null;
  } = {};

  if ("id_nadine" in body) updateData.id_nadine = body.id_nadine?.trim() || null;
  if ("pic" in body) updateData.pic = body.pic?.trim() || null;
  if ("status" in body && body.status) updateData.status = body.status;
  if ("status_seksi" in body) updateData.status_seksi = body.status_seksi ?? null;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diperbarui" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("permohonan")
    .update(updateData)
    .eq("id", body.id);

  if (error) {
    console.error("Gagal menyimpan data admin:", error);
    return NextResponse.json({ error: "Gagal menyimpan data admin" }, { status: 500 });
  }

  return NextResponse.json({ message: "Data admin berhasil disimpan" });
}
