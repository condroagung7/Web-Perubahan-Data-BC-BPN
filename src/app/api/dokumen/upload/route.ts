import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_UPLOAD } from "@/lib/security/rate-limit";

const BUCKET_NAME = "dokumen-permohonan";
const MAX_FILE_SIZE_MB = 1;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

// Allowed MIME types for document upload
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png", "webp"]);

function getSafeExtension(filename: string): string {
  const extension = filename
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return extension ? `.${extension}` : "";
}

function getExtensionWithoutDot(filename: string): string {
  return (
    filename
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") ?? ""
  );
}

export const POST = secureHandler(
  async (request: NextRequest) => {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File wajib diunggah" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file maksimal ${MAX_FILE_SIZE_MB} MB` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "File tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Validate MIME type
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error:
            "Tipe file tidak diizinkan. Hanya PDF, JPG, PNG, dan WEBP yang diperbolehkan.",
        },
        { status: 400 }
      );
    }

    // Validate file extension
    const extension = getExtensionWithoutDot(file.name);
    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          error:
            "Ekstensi file tidak diizinkan. Hanya .pdf, .jpg, .jpeg, .png, dan .webp yang diperbolehkan.",
        },
        { status: 400 }
      );
    }

    // Validate file name doesn't contain path traversal
    if (
      file.name.includes("..") ||
      file.name.includes("/") ||
      file.name.includes("\\")
    ) {
      return NextResponse.json(
        { error: "Nama file tidak valid" },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();
    const path = `permohonan/${crypto.randomUUID()}${getSafeExtension(file.name)}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: "3600",
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return NextResponse.json(
        { error: "Gagal mengunggah dokumen" },
        { status: 500 }
      );
    }

    return NextResponse.json({ path }, { status: 201 });
  },
  {
    rateLimit: RATE_LIMIT_UPLOAD,
    csrf: false, // Public upload, no CSRF needed (form submission from public page)
  }
);