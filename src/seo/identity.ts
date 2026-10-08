import type { SiteSettings } from "@/content/settings";
import { type Locale, locales } from "@/i18n/config";
import { personJsonLd, websiteJsonLd } from "./jsonld";
import { siteUrl } from "./site";

/** Builds Person and WebSite JSON-LD structures from site settings */
export function identityJsonLd(settings: SiteSettings, locale: Locale) {
  const url = siteUrl();
  return [
    personJsonLd({
      name: settings.name,
      url,
      jobTitle: settings.i18n[locale].tagline || undefined,
      sameAs: Object.values(settings.socials),
    }),
    websiteJsonLd({ name: settings.name, url, inLanguage: [...locales] }),
  ];
}
