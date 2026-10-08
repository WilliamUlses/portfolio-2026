import { isLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { href } from "@/i18n/routes";
import { siteUrl } from "@/seo/site";
import { getPublishedPosts, getSiteSettings } from "@/server/queries";

// RSS 2.0 feed per language: /fr/journal/rss.xml, /en/journal/rss.xml.
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const xml = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export async function GET(
  _req: Request,
  { params }: RouteContext<"/[locale]/journal/rss.xml">,
) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) return new Response("Not found", { status: 404 });
  const locale = raw;
  const t = getDictionary(locale).journal;
  const [posts, settings] = await Promise.all([
    getPublishedPosts(locale),
    getSiteSettings(),
  ]);
  const base = siteUrl();
  const blogUrl = `${base}${href("journal", locale)}`;
  const items = posts
    .map((p) => {
      const url = `${base}${href("post", locale, { slug: p.slug })}`;
      return `    <item>
      <title>${xml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${p.publishedAt.toUTCString()}</pubDate>
      <description>${xml(p.excerpt)}</description>${p.topic ? `\n      <category>${xml(p.topic)}</category>` : ""}
      <enclosure url="${url}/opengraph-image" type="image/png" length="0" />
    </item>`;
    })
    .join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xml(`${t.title} — ${settings.name}`)}</title>
    <link>${blogUrl}</link>
    <description>${xml(t.description)}</description>
    <language>${locale === "fr" ? "fr-FR" : "en-GB"}</language>
    <atom:link href="${blogUrl}/rss.xml" rel="self" type="application/rss+xml" />${posts[0] ? `\n    <lastBuildDate>${posts[0].updatedAt.toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
