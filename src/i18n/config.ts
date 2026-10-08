export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (locales as readonly string[]).includes(value)
  );
}

/** Resolves locale priority: manual cookie > Accept-Language header > default locale */
export function preferredLocale(
  cookie: string | undefined,
  acceptLanguage: string | null,
): Locale {
  if (isLocale(cookie)) return cookie;
  const ranked = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .filter((x) => x.lang && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  return (
    (ranked.find((x) => isLocale(x.lang))?.lang as Locale | undefined) ??
    defaultLocale
  );
}
