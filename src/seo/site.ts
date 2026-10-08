// Canonical URL and search engine indexing controls.
type Env = Record<string, string | undefined>;

export const PRODUCTION_URL = "https://williamulses.fr";

/** Returns absolute base site URL without trailing slash */
export function siteUrl(env: Env = process.env): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;
  if (env.VERCEL_ENV === "production") return PRODUCTION_URL;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Search engine indexing is enabled only in production when SITE_OPEN=true.
 */
export function isIndexable(env: Env = process.env): boolean {
  return env.VERCEL_ENV === "production" && env.SITE_OPEN === "true";
}
