import { isLocale, type Locale, preferredLocale } from "./config";
import { resolveLocalizedPath } from "./routes";

// Pure routing logic evaluated by proxy.ts for public storefront requests.
export type Decision =
  | { type: "next" }
  | { type: "redirect"; to: string; status: 307 | 308 }
  | { type: "rewrite"; to: string; status?: 404 };

export type RequestInfo = {
  pathname: string;
  cookieLocale?: string;
  acceptLanguage: string | null;
  /** Whether public storefront is opened. If false, redirects to coming-soon. */
  siteOpen: boolean;
};

export const COMING_SOON_SEGMENT = "bientot";
export const NOT_FOUND_SEGMENT = "introuvable";

// Valid internal route structure matching
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function isKnownRoute(segments: string[]): boolean {
  const [page, slug, ...extra] = segments;
  if (extra.length) return false;
  if (page === undefined) return true; // home
  if (page === "projects" || page === "journal")
    return slug === undefined || SLUG_RE.test(slug);
  if (slug !== undefined) return false;
  return (
    page === "about" ||
    page === "services" ||
    page === "lab" ||
    page === "contact" ||
    page === COMING_SOON_SEGMENT
  );
}

export function decide({
  pathname,
  cookieLocale,
  acceptLanguage,
  siteOpen,
}: RequestInfo): Decision {
  const parts = pathname.split("/").filter(Boolean);
  const [first, ...rest] = parts;

  // Missing locale prefix: redirect to preferred locale
  if (!isLocale(first)) {
    const locale = preferredLocale(cookieLocale, acceptLanguage);
    return {
      type: "redirect",
      to: `/${locale}${pathname === "/" ? "" : pathname}`,
      status: 307,
    };
  }
  const locale: Locale = first;

  // When site is closed, rewrite to coming soon while preserving current URL
  if (!siteOpen) {
    return rest[0] === COMING_SOON_SEGMENT && rest.length === 1
      ? { type: "next" }
      : { type: "rewrite", to: `/${locale}/${COMING_SOON_SEGMENT}` };
  }

  const r = resolveLocalizedPath(locale, rest);
  if (r.kind === "redirect") return { type: "redirect", to: r.to, status: 308 };
  if (!isKnownRoute(r.internal.split("/").filter(Boolean).slice(1))) {
    return {
      type: "rewrite",
      to: `/${locale}/${NOT_FOUND_SEGMENT}`,
      status: 404,
    };
  }
  const publicPath = `/${parts.join("/")}`;
  return r.internal === publicPath
    ? { type: "next" }
    : { type: "rewrite", to: r.internal };
}
