import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";

const BUCKET_NAME = "surat-persetujuan";

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const adminError = assertAdmin(user);
  if (adminError) return adminError;

  const { id } = (await request.json()) as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "ID permohonan wajib diisi" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: permohonan, error: fetchError } = await supabase
    .from("permohonan")
    .select("kode_tracking, surat_persetujuan_url")
    .eq("id", id)
    .single<{ kode_tracking: string; surat_persetujuan_url: string | null }>();

  if (fetchError || !permohonan) {
    return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });
  }

  if (!permohonan.surat_persetujuan_url) {
    return NextResponse.json({ error: "Surat persetujuan belum tersedia" }, { status: 404 });
  }

  const filePath = `${permohonan.kode_tracking}/Surat-Persetujuan-${permohonan.kode_tracking}.docx`;
  const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (removeError) {
    console.error("Gagal menghapus surat persetujuan:", removeError);
    return NextResponse.json({ error: "Gagal menghapus file surat persetujuan" }, { status: 500 });
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

  return NextResponse.json({ message: "Surat persetujuan berhasil dihapus" });
}
