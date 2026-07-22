import { NextRequest, NextResponse } from "next/server";
import { secureHandler } from "@/lib/security/api-handler";
import { RATE_LIMIT_LOGIN } from "@/lib/security/rate-limit";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type TurnstileVerificationResult = {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
};

async function verifyTurnstileToken(
  token: string,
  request: NextRequest
): Promise<{ valid: boolean; error?: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY is not configured");
    return { valid: false, error: "Verifikasi keamanan belum dikonfigurasi" };
  }

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", token);

  const clientIp = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  if (clientIp) {
    formData.set("remoteip", clientIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body: formData,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Turnstile verification request failed:",
        response.status
      );
      return {
        valid: false,
        error: "Verifikasi keamanan tidak dapat diproses",
      };
    }

    const result = (await response.json()) as TurnstileVerificationResult;

    if (!result.success) {
      console.warn("Turnstile token rejected:", result["error-codes"]);
      return {
        valid: false,
        error: "Verifikasi keamanan tidak valid atau kedaluwarsa",
      };
    }

    if (result.hostname && result.hostname !== request.nextUrl.hostname) {
      console.warn("Turnstile hostname mismatch:", {
        expected: request.nextUrl.hostname,
        received: result.hostname,
      });
      return { valid: false, error: "Verifikasi keamanan tidak valid" };
    }

    return { valid: true };
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return {
      valid: false,
      error: "Verifikasi keamanan tidak dapat diproses",
    };
  }
}

/**
 * POST /api/auth/verify-captcha
 *
 * Verifies a Cloudflare Turnstile token server-side before allowing a login
 * attempt. This endpoint is intentionally kept separate from the Supabase
 * auth call so that the standard cookie-based session flow is preserved.
 *
 * Rate limited to 5 requests per 5 minutes per IP to prevent abuse.
 */
export const POST = secureHandler(
  async (request: NextRequest) => {
    const body = await request.json();
    const { turnstileToken } = body ?? {};

    if (typeof turnstileToken !== "string" || !turnstileToken) {
      return NextResponse.json(
        { error: "Token verifikasi keamanan tidak ada" },
        { status: 400 }
      );
    }

    const result = await verifyTurnstileToken(turnstileToken, request);

    if (!result.valid) {
      return NextResponse.json(
        { error: result.error ?? "Verifikasi keamanan gagal" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true });
  },
  {
    rateLimit: RATE_LIMIT_LOGIN,
  }
);