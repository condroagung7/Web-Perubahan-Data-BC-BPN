/**
 * Security audit logging for admin actions.
 * Logs to console in structured format. In production, integrate with
 * external logging service (e.g., Datadog, LogTail, Sentry).
 */

export interface AuditLogEntry {
  action: string;
  adminEmail: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  timestamp: string;
}

/**
 * Log an admin action for security auditing.
 */
export function logAdminAction(
  action: string,
  adminEmail: string,
  options?: {
    targetId?: string;
    details?: Record<string, unknown>;
    ip?: string;
  }
) {
  const entry: AuditLogEntry = {
    action,
    adminEmail,
    targetId: options?.targetId,
    details: options?.details,
    ip: options?.ip,
    timestamp: new Date().toISOString(),
  };

  // Structured log output
  console.log(`[AUDIT] ${JSON.stringify(entry)}`);
}

/**
 * Log a security event (failed auth, rate limit, CSRF violation, etc.).
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>
) {
  console.warn(
    `[SECURITY] ${JSON.stringify({
      event,
      ...details,
      timestamp: new Date().toISOString(),
    })}`
  );
}