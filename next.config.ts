import type { NextConfig } from "next";

const baseSecurityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const appSecurityHeaders = [
  ...baseSecurityHeaders,
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.groq.com https://api.resend.com",
      "frame-ancestors *",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const pdfPreviewHeaders = [
  ...baseSecurityHeaders,
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "frame-ancestors *",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/api/admin/dokumen-file",
      headers: pdfPreviewHeaders,
    },
    {
      source: "/(.*)",
      headers: appSecurityHeaders,
    },
  ],
};

export default nextConfig;