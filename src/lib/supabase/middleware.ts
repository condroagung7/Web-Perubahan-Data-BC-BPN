import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email?: string | null) {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return false;
  return Boolean(email && adminEmails.includes(email.toLowerCase()));
}

/**
 * Add security headers to responses
 */
function addSecurityHeaders(
  response: NextResponse,
  pathname?: string
): NextResponse {
  const isPdfPreviewRoute = pathname === "/api/admin/dokumen-file";

  // Prevent clickjacking, except for same-origin PDF preview route
  if (!isPdfPreviewRoute) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Referrer policy - don't leak URLs to third parties
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy - disable unnecessary browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // X-XSS-Protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Prevent caching of sensitive pages
  const url = response.headers.get("x-middleware-rewrite") || "";
  if (url.includes("/admin") || url.includes("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname.startsWith("/admin/login");
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  // Protect admin page routes
  if (isAdminRoute && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return addSecurityHeaders(NextResponse.redirect(url), pathname);
  }

  if (isAdminRoute && !isLoginRoute && user && !isAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "unauthorized");
    return addSecurityHeaders(NextResponse.redirect(url), pathname);
  }

  if (isLoginRoute && user && isAdminEmail(user.email)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    return addSecurityHeaders(NextResponse.redirect(url), pathname);
  }

  // Protect admin API routes at middleware level
  if (isAdminApiRoute) {
    if (!user) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 }),
        pathname
      );
    }
    if (!isAdminEmail(user.email)) {
      return addSecurityHeaders(
        NextResponse.json({ error: "Akses ditolak" }, { status: 403 }),
        pathname
      );
    }
  }

  return addSecurityHeaders(supabaseResponse, pathname);
}