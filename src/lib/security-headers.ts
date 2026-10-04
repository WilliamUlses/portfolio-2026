// Security headers applied across all routes via next.config.ts.
// Uses static CSP to enable static page caching on edge CDN.

export type SecurityHeadersOptions = {
  /** Development mode: allows eval for React error overlays. */
  dev: boolean;
  /** Vercel preview: allows vercel.live toolbar. */
  preview: boolean;
  /** HTTPS enabled: applies HSTS and upgrade-insecure-requests. */
  https: boolean;
  /** Report-only CSP mode for non-blocking policy testing. */
  reportOnly: boolean;
};

const BLOB = "https://*.public.blob.vercel-storage.com";
const VERCEL_LIVE = "https://vercel.live";

export function buildCsp(
  o: Omit<SecurityHeadersOptions, "reportOnly">,
): string {
  const live = o.preview ? ` ${VERCEL_LIVE}` : "";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${o.dev ? " 'unsafe-eval'" : ""}${live}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${BLOB}${live}`,
    `media-src 'self' blob: ${BLOB}`,
    "font-src 'self'",
    `connect-src 'self' ${BLOB} https://vercel.com/api/blob/${live}`,
    `frame-src https://player.vimeo.com https://www.youtube-nocookie.com https://www.figma.com${live}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(o.https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function securityHeaders(
  o: SecurityHeadersOptions,
): { key: string; value: string }[] {
  return [
    {
      key: o.reportOnly
        ? "Content-Security-Policy-Report-Only"
        : "Content-Security-Policy",
      value: buildCsp(o),
    },
    ...(o.https
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ]
      : []),
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
  ];
}
