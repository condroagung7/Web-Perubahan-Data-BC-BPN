import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const BUCKET_NAME = "dokumen-permohonan";
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

function getSafeExtension(filename: string) {
  const extension = filename.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension ? `.${extension}` : "";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File wajib diunggah" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB` },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const path = `permohonan/${crypto.randomUUID()}${getSafeExtension(file.name)}`;

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return NextResponse.json({ error: "Gagal mengunggah dokumen" }, { status: 500 });
    }

    return NextResponse.json({ path }, { status: 201 });
  } catch (error) {
    console.error("Unexpected document upload error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server" }, { status: 500 });
  }
}
