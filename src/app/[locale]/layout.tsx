import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locale as rootLocale } from "next/root-params";
import { bootScript } from "@/design/boot";
import { archivo, hanken } from "@/design/fonts";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { isIndexable, siteUrl } from "@/seo/site";
import "../globals.css";
import "./site.css";

// Storefront root layout: sets <html lang> and fonts from route params.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await rootLocale();
  const dict = getDictionary(isLocale(locale) ? locale : "fr");
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: dict.meta.siteName,
      template: `%s — ${dict.meta.siteName}`,
    },
    openGraph: {
      images: [
        {
          url: "/og-default.png",
          secureUrl: "/og-default.png",
          type: "image/png",
          width: 2400,
          height: 1260,
          alt: dict.meta.siteName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["/og-default.png"],
    },
    // Indexable only in production when SITE_OPEN=true
    robots: isIndexable()
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export default async function SiteRootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!isLocale(locale)) notFound();
  return (
    // suppressHydrationWarning: data-js attribute is injected before hydration by boot script
    <html
      lang={locale}
      className={`site ${archivo.variable} ${hanken.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inline boot script */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        {children}
        {/* Cookieless audience measurement: no consent banner needed */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
