import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null) {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return false;
  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}

export function assertAdmin(user: User | null) {
  if (!user) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Akses admin ditolak" }, { status: 403 });
  }

  return null;
}
