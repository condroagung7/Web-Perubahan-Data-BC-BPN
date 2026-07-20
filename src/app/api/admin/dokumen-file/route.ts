import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { DokumenPendukung } from "@/types/database";
import { assertAdmin } from "@/lib/auth/admin";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_ADMIN } from "@/lib/security/rate-limit";
import { sanitizeUUID, sanitizeString } from "@/lib/security/sanitize";

const BUCKET_NAME = "dokumen-permohonan";

export const GET = secureHandler(
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

    const rawPermohonanId = request.nextUrl.searchParams.get("permohonanId");
    const rawPath = request.nextUrl.searchParams.get("path");

    const permohonanId = rawPermohonanId
      ? sanitizeUUID(String(rawPermohonanId))
      : null;
    const path = rawPath ? sanitizeString(String(rawPath)) : null;

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
      return NextResponse.json(
        { error: "Permohonan tidak ditemukan" },
        { status: 404 }
      );
    }

    const dokumen = (permohonan.dokumen_pendukung ?? []).find(
      (item) => item.url === path
    );

    if (!dokumen) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);

    if (error || !data) {
      console.error("Gagal mengunduh dokumen untuk preview:", error);
      return NextResponse.json(
        { error: "Gagal memuat dokumen" },
        { status: 500 }
      );
    }

    const arrayBuffer = await data.arrayBuffer();
    const contentType = data.type || "application/pdf";
    const fileName = dokumen.nama_file || "dokumen.pdf";

return new NextResponse(arrayBuffer, {
  status: 200,
  headers: {
    "Content-Type": contentType,
    "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
    "Cache-Control": "private, no-store, max-age=0",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "ALLOWALL",
    "Content-Security-Policy": "frame-ancestors *;",
  },
});
  },
  {
    rateLimit: RATE_LIMIT_ADMIN,
    csrf: false,
  }
);