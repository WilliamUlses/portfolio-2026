import type { Metadata } from "next";
import { defaultLocale, type Locale, locales } from "@/i18n/config";
import { href, type Page } from "@/i18n/routes";

// Generates localized metadata for storefront pages including alternates, canonical and Open Graph
const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_US" };

export type PageMetadataInput = {
  page: Page;
  locale: Locale;
  slug?: string;
  title: string | null;
  siteName: string;
  description?: string;
};

export function alternatesFor(
  page: Page,
  slug?: string,
): { languages: Record<string, string> } {
  const params = slug ? { slug } : undefined;
  return {
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, href(page, l, params)])),
      "x-default": href(page, defaultLocale, params),
    },
  };
}

export function pageMetadata(input: PageMetadataInput): Metadata {
  const { page, locale, slug, title, siteName, description } = input;
  const url = href(page, locale, slug ? { slug } : undefined);
  const fullTitle = title ? `${title} — ${siteName}` : siteName;

  // Global static Open Graph sharing image: fluted cobalt glass + white W. monogram.
  // Generated once to public/og-default.png by scripts/generate-og.ts.
  const ogImageUrl = "/og-default.png";
  const ogImage = [
    { url: ogImageUrl, width: 2400, height: 1260, alt: fullTitle },
  ];

  return {
    ...(title ? { title } : { title: { absolute: siteName } }),
    description,
    alternates: { canonical: url, ...alternatesFor(page, slug) },
    openGraph: {
      type: page === "project" ? "article" : "website",
      url,
      siteName,
      title: fullTitle,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImage,
    },
  };
}
