/**
 * Input sanitization utilities to prevent XSS and injection attacks.
 */

/**
 * Strip HTML tags from a string to prevent XSS.
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a string by stripping HTML tags and trimming whitespace.
 */
export function sanitizeString(input: string): string {
  return stripHtml(input).trim();
}

/**
 * Sanitize all string values in an object (shallow, one level deep).
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeString(value);
    }
  }
  return sanitized;
}

/**
 * Sanitize all string values deeply (recursive).
 */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeString(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeDeep) as T;
  }
  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeDeep(v);
    }
    return sanitized as T;
  }
  return value;
}

/**
 * Validate that a URL string is a safe URL (no javascript:, data:, etc.).
 * Only allows http:, https:, and relative URLs.
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("blob:")
  ) {
    return false;
  }

  // Allow relative URLs and http(s) URLs
  if (trimmed.startsWith("/") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return true;
  }

  // Allow non-protocol strings (relative paths like "folder/file.pdf")
  if (!trimmed.includes(":")) {
    return true;
  }

  return false;
}

/**
 * Validate request body size. Returns true if within limits.
 * @param body - The request body string or object
 * @param maxSizeBytes - Maximum size in bytes (default: 1MB)
 */
export function isWithinSizeLimit(body: string | object, maxSizeBytes: number = 1_048_576): boolean {
  const str = typeof body === "string" ? body : JSON.stringify(body);
  const sizeInBytes = new TextEncoder().encode(str).length;
  return sizeInBytes <= maxSizeBytes;
}

/**
 * Sanitize a kode_tracking input - only allow alphanumeric and hyphens.
 */
export function sanitizeTrackingCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9\-]/g, "").substring(0, 50);
}

/**
 * Sanitize UUID input - only allow valid UUID characters.
 */
export function sanitizeUUID(id: string): string {
  return id.replace(/[^a-fA-F0-9\-]/g, "").substring(0, 36);
}