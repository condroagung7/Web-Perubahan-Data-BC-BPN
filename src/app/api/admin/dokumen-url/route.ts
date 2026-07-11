import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { DokumenPendukung } from "@/types/database";
import { assertAdmin } from "@/lib/auth/admin";

const BUCKET_NAME = "dokumen-permohonan";
const SIGNED_URL_TTL_SECONDS = 60 * 10;

export async function POST(request: NextRequest) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const adminError = assertAdmin(user);
if (adminError) return adminError;

  const { permohonanId, path } = (await request.json()) as {
    permohonanId?: string;
    path?: string;
  };

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
    return NextResponse.json({ error: "Permohonan tidak ditemukan" }, { status: 404 });
  }

  const isDokumenPermohonan = (permohonan.dokumen_pendukung ?? []).some(
    (dokumen) => dokumen.url === path
  );

  if (!isDokumenPermohonan) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("Gagal membuat signed URL dokumen:", error);
    return NextResponse.json({ error: "Gagal membuka dokumen" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
