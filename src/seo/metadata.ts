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
  /** Journal posts: Open Graph article fields + keywords */
  article?: {
    publishedTime: Date;
    modifiedTime: Date;
    authorName: string;
    authorUrl: string;
    section?: string | null;
    tags?: string[];
  };
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
  const { page, locale, slug, title, siteName, description, article } = input;
  const url = href(page, locale, slug ? { slug } : undefined);
  const fullTitle = title ? `${title} — ${siteName}` : siteName;

  // Global static Open Graph sharing image: fluted cobalt glass + white W. monogram.
  // Generated once to public/og-default.png by scripts/generate-og.ts.
  const ogImageUrl = "/og-default.png";
  // Pages with their own opengraph-image file (journal posts) override this default.
  const ogImage = [
    {
      url: ogImageUrl,
      secureUrl: ogImageUrl,
      type: "image/png",
      width: 2400,
      height: 1260,
      alt: fullTitle,
    },
  ];

  const tags = article?.tags?.filter(Boolean) ?? [];
  return {
    ...(title ? { title } : { title: { absolute: siteName } }),
    description,
    alternates: { canonical: url, ...alternatesFor(page, slug) },
    ...(article
      ? {
          authors: [{ name: article.authorName, url: article.authorUrl }],
          creator: article.authorName,
          publisher: siteName,
          ...(tags.length ? { keywords: tags } : {}),
        }
      : {}),
    openGraph: {
      ...(article
        ? {
            type: "article" as const,
            publishedTime: article.publishedTime.toISOString(),
            modifiedTime: article.modifiedTime.toISOString(),
            authors: [article.authorUrl],
            ...(article.section ? { section: article.section } : {}),
            ...(tags.length ? { tags } : {}),
          }
        : {
            type:
              page === "project" ? ("article" as const) : ("website" as const),
          }),
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

/** <link rel="alternate" type="application/rss+xml"> for both journal feeds */
export function rssAlternates(): Record<
  string,
  { url: string; title: string }[]
> {
  return {
    "application/rss+xml": locales.map((l) => ({
      url: `${href("journal", l)}/rss.xml`,
      title:
        l === "fr"
          ? "Journal — William Ulses (FR)"
          : "Journal — William Ulses (EN)",
    })),
  };
}
