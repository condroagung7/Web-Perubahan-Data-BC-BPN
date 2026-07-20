/**
 * Secure API handler wrapper that applies rate limiting, CSRF protection,
 * body size validation, and error handling to API routes.
 */

import { NextRequest, NextResponse } from "next/server";
import { rateLimit, type RateLimitConfig, getClientIp } from "./rate-limit";
import { validateCsrf } from "./csrf";
import { logSecurityEvent } from "./audit-log";

interface SecureHandlerOptions {
  /** Rate limit configuration */
  rateLimit?: RateLimitConfig;
  /** Maximum request body size in bytes (default: 1MB) */
  maxBodySize?: number;
  /** Whether to check CSRF (default: true for POST/PUT/PATCH/DELETE) */
  csrf?: boolean;
}

/**
 * Wraps an API route handler with security middleware:
 * - Rate limiting
 * - CSRF validation
 * - Body size validation
 * - Secure error handling (no internal details leaked)
 */
export function secureHandler(
  handler: (request: NextRequest) => Promise<NextResponse | Response>,
  options: SecureHandlerOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse | Response> => {
    const ip = getClientIp(request);

    // 1. Rate limiting
    if (options.rateLimit) {
      const rateLimitResponse = rateLimit(request, options.rateLimit);
      if (rateLimitResponse) {
        logSecurityEvent("rate_limit_exceeded", {
          ip,
          path: request.nextUrl.pathname,
          identifier: options.rateLimit.identifier,
        });
        return rateLimitResponse;
      }
    }

    // 2. CSRF validation (default: enabled for state-changing methods)
    if (options.csrf !== false) {
      const csrfResponse = validateCsrf(request);
      if (csrfResponse) {
        logSecurityEvent("csrf_violation", {
          ip,
          path: request.nextUrl.pathname,
          method: request.method,
          origin: request.headers.get("origin"),
        });
        return csrfResponse;
      }
    }

    // 3. Body size check for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(request.method.toUpperCase())) {
      const contentLength = request.headers.get("content-length");
      const maxSize = options.maxBodySize ?? 1_048_576; // 1MB default
      if (contentLength && parseInt(contentLength, 10) > maxSize) {
        logSecurityEvent("body_too_large", {
          ip,
          path: request.nextUrl.pathname,
          contentLength,
          maxSize,
        });
        return NextResponse.json(
          { error: "Ukuran permintaan terlalu besar" },
          { status: 413 }
        );
      }
    }

    // 4. Execute handler with secure error boundary
    try {
      return await handler(request);
    } catch (error) {
      console.error(
        `[API_ERROR] ${request.method} ${request.nextUrl.pathname}:`,
        error
      );
      return NextResponse.json(
        { error: "Terjadi kesalahan pada server" },
        { status: 500 }
      );
    }
  };
}