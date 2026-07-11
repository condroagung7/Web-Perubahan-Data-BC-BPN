import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/auth/admin";

const BUCKET_NAME = "dokumen-permohonan";
const DEFAULT_STORAGE_LIMIT_MB = 1024;
const PAGE_SIZE = 1000;

type StorageItem = {
  name: string;
  id: string | null;
  metadata?: {
    size?: number;
  } | null;
};

async function getFolderUsageBytes(folder = ""): Promise<number> {
  const supabase = createServiceRoleClient();
  let offset = 0;
  let totalBytes = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list(folder, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw error;
    }

    const items = (data ?? []) as StorageItem[];
    for (const item of items) {
      const itemPath = folder ? `${folder}/${item.name}` : item.name;
      const isFolder = !item.id && !item.metadata?.size;

      if (isFolder) {
        totalBytes += await getFolderUsageBytes(itemPath);
      } else {
        totalBytes += item.metadata?.size ?? 0;
      }
    }

    if (items.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return totalBytes;
}

function bytesToMb(bytes: number) {
  return bytes / 1024 / 1024;
}

export async function GET() {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();

  const adminError = assertAdmin(user);
  if (adminError) return adminError;

  const storageLimitMb = Number(
    process.env.SUPABASE_STORAGE_LIMIT_MB ?? DEFAULT_STORAGE_LIMIT_MB
  );

  try {
    const usedBytes = await getFolderUsageBytes();
    const usedMb = bytesToMb(usedBytes);
    const remainingMb = Math.max(storageLimitMb - usedMb, 0);
    const usedPercent =
      storageLimitMb > 0 ? Math.min((usedMb / storageLimitMb) * 100, 100) : 0;

    return NextResponse.json({
      bucket: BUCKET_NAME,
      limitMb: Number(storageLimitMb.toFixed(2)),
      usedMb: Number(usedMb.toFixed(2)),
      remainingMb: Number(remainingMb.toFixed(2)),
      usedPercent: Number(usedPercent.toFixed(1)),
      remainingPercent: Number(Math.max(100 - usedPercent, 0).toFixed(1)),
    });
  } catch (error) {
    console.error("Gagal membaca kapasitas storage:", error);
    return NextResponse.json(
      { error: "Gagal membaca kapasitas Supabase Storage" },
      { status: 500 }
    );
  }
}
