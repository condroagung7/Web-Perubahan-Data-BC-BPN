import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { generateSuratPersetujuan } from "@/lib/docx/generate-surat";
import { kirimSuratPersetujuan } from "@/lib/email/resend";
import { assertAdmin } from "@/lib/auth/admin";

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

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID permohonan wajib diisi" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: permohonan, error: fetchError } = await supabase
    .from("permohonan")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !permohonan) {
    return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });
  }

  const docxBuffer = await generateSuratPersetujuan(permohonan);
  const filePath = `${permohonan.kode_tracking}/Surat-Persetujuan-${permohonan.kode_tracking}.docx`;

  const { error: uploadError } = await supabase.storage
    .from("surat-persetujuan")
    .upload(filePath, docxBuffer, {
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });

  if (uploadError) {
    console.error("Gagal upload surat:", uploadError);
    return NextResponse.json({ error: "Gagal menyimpan surat" }, { status: 500 });
  }

  const { data: signedUrlData } = await supabase.storage
    .from("surat-persetujuan")
    .createSignedUrl(filePath, 60 * 60 * 24 * 30);

  const { error: updateError } = await supabase
    .from("permohonan")
    .update({
      status: "disetujui",
      surat_persetujuan_url: signedUrlData?.signedUrl ?? null,
    })
    .eq("id", id);

  if (updateError) {
    console.error("Gagal update status:", updateError);
    return NextResponse.json({ error: "Gagal memperbarui status" }, { status: 500 });
  }

  await supabase.from("riwayat_status").insert({
    permohonan_id: id,
    status_sebelum: permohonan.status,
    status_sesudah: "disetujui",
    catatan: "Dokumen diterima lengkap dan surat persetujuan diterbitkan otomatis",
    diubah_oleh: user.email ?? null,
  });

  try {
    await kirimSuratPersetujuan(permohonan, docxBuffer);
  } catch (emailError) {
    console.error("Gagal kirim email surat:", emailError);
  }

  return NextResponse.json({
    message: "Dokumen diterima lengkap",
    url: signedUrlData?.signedUrl,
  });
}
