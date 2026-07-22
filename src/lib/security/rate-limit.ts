/**
 * In-memory rate limiter for API routes.
 * Uses a sliding window approach with automatic cleanup.
 *
 * For production at scale, consider replacing with Redis-based solution (e.g. Upstash).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
    // Prevent memory leak: if store gets too large, clear it
    if (rateLimitStore.size > 10000) {
      rateLimitStore.clear();
    }
  }, 60_000);
  // Allow Node.js to exit even if the interval is still running
  if (cleanupInterval && typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

startCleanup();

export interface RateLimitConfig {
  /** Unique identifier prefix for this limiter */
  identifier: string;
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Take the first IP (client IP) from comma-separated list
    return xForwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  // Standard
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  return "unknown";
}

/**
 * Check rate limit for a given key.
 */
export function checkRateLimit(config: RateLimitConfig, key: string): RateLimitResult {
  const storeKey = `${config.identifier}:${key}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const existing = rateLimitStore.get(storeKey);

  if (!existing || now > existing.resetAt) {
    // New window
    const resetAt = now + windowMs;
    rateLimitStore.set(storeKey, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  if (existing.count >= config.maxRequests) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return {
    success: true,
    remaining: config.maxRequests - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Apply rate limiting to a request. Returns null if allowed, or a Response if rate limited.
 */
export function rateLimit(
  request: Request,
  config: RateLimitConfig
): Response | null {
  const ip = getClientIp(request);
  const result = checkRateLimit(config, ip);

  if (!result.success) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        error: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

// ── Pre-configured rate limiters ──

/** Public form submission: 5 requests per 60 seconds per IP */
export const RATE_LIMIT_PERMOHONAN: RateLimitConfig = {
  identifier: "permohonan",
  maxRequests: 5,
  windowSeconds: 60,
};

/** Status tracking lookup: 20 requests per 60 seconds per IP */
export const RATE_LIMIT_STATUS: RateLimitConfig = {
  identifier: "status",
  maxRequests: 20,
  windowSeconds: 60,
};

/** Chat AI: 10 requests per 60 seconds per IP */
export const RATE_LIMIT_CHAT: RateLimitConfig = {
  identifier: "chat",
  maxRequests: 10,
  windowSeconds: 60,
};

/** Admin actions: 30 requests per 60 seconds per IP */
export const RATE_LIMIT_ADMIN: RateLimitConfig = {
  identifier: "admin",
  maxRequests: 30,
  windowSeconds: 60,
};

/** File upload: 10 requests per 60 seconds per IP */
export const RATE_LIMIT_UPLOAD: RateLimitConfig = {
  identifier: "upload",
  maxRequests: 10,
  windowSeconds: 60,
};

/** Login CAPTCHA verification: 5 attempts per 5 minutes per IP */
export const RATE_LIMIT_LOGIN: RateLimitConfig = {
  identifier: "login",
  maxRequests: 5,
  windowSeconds: 300,
};
