import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { href, type Page } from "@/i18n/routes";
import { alternatesFor } from "@/seo/metadata";
import { siteUrl } from "@/seo/site";
import { getSitemapPosts, getSitemapProjects } from "@/server/queries";

// sitemap.xml generator: localized static pages and published projects with alternates and last modified dates
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const absolute = (languages: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(languages).map(([l, path]) => [l, `${base}${path}`]),
    );
  const entry = (page: Page, slug?: string, lastModified?: Date) =>
    locales.map((locale) => ({
      url: `${base}${href(page, locale, slug ? { slug } : undefined)}`,
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages: absolute(alternatesFor(page, slug).languages) },
    }));

  const [projects, posts] = await Promise.all([
    getSitemapProjects(),
    getSitemapPosts(),
  ]);
  return [
    ...(
      ["home", "projects", "about", "services", "journal", "contact"] as const
    ).flatMap((page) => entry(page)),
    ...projects.flatMap((p) => entry("project", p.slug, p.lastModified)),
    ...posts.flatMap((p) => entry("post", p.slug, p.lastModified)),
  ];
}
