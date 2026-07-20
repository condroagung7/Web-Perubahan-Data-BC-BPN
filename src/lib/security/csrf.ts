/**
 * CSRF protection using Origin/Referer header validation.
 * This is suitable for APIs that use JSON payloads (not form-urlencoded).
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Get allowed origins from environment or derive from request.
 */
function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Add configured app URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (appUrl) {
    const normalized = appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
    origins.push(new URL(normalized).origin);
  }

  // Always allow localhost in development
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000");
    origins.push("http://127.0.0.1:3000");
  }

  return origins;
}

/**
 * Validate the Origin or Referer header against allowed origins.
 * Returns null if valid, or a NextResponse if invalid.
 *
 * Only applies to state-changing methods (POST, PUT, PATCH, DELETE).
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const method = request.method.toUpperCase();

  // Only check state-changing methods
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // At least one must be present
  if (!origin && !referer) {
    return NextResponse.json(
      { error: "Permintaan tidak valid" },
      { status: 403 }
    );
  }

  const allowedOrigins = getAllowedOrigins();

  // If we can't determine allowed origins, skip check (first deploy scenario)
  if (allowedOrigins.length === 0) {
    return null;
  }

  // Check origin header first
  if (origin) {
    if (allowedOrigins.includes(origin)) {
      return null;
    }
    return NextResponse.json(
      { error: "Permintaan dari sumber tidak dikenal" },
      { status: 403 }
    );
  }

  // Fallback to referer
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (allowedOrigins.includes(refererOrigin)) {
        return null;
      }
    } catch {
      // Invalid referer URL
    }
    return NextResponse.json(
      { error: "Permintaan dari sumber tidak dikenal" },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: "Permintaan tidak valid" },
    { status: 403 }
  );
}