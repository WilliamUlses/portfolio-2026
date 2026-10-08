import { and, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { Block } from "@/content/blocks";
import { mediaRefs } from "@/content/blocks";
import { readBlocks } from "@/content/read-blocks";
import { readingMinutes, wordCount } from "@/content/reading-time";
import { db } from "@/db/client";
import { posts, postTranslations } from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { tags } from "../cache-tags";
import { databaseAvailable } from "./db-available";
import { loadMedia, type PublicMedia } from "./media";

// Storefront cached journal queries (Roadmap V2 3.2), newest first.

export type PostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  topic: string | null;
  publishedAt: Date;
  updatedAt: Date;
  minutes: number;
  words: number;
  cover: PublicMedia | null;
};

export type PostDetail = PostSummary & {
  blocks: Block[];
  seoTitle: string | null;
  seoDescription: string | null;
  media: Record<string, PublicMedia>;
  newer: { slug: string; title: string } | null;
  older: { slug: string; title: string } | null;
};

async function querySummaries(locale: Locale) {
  const rows = await db
    .select({ p: posts, t: postTranslations })
    .from(posts)
    .innerJoin(
      postTranslations,
      and(
        eq(postTranslations.postId, posts.id),
        eq(postTranslations.locale, locale),
      ),
    )
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt));
  const covers = await loadMedia(
    rows.flatMap((r) => (r.p.coverMediaId ? [r.p.coverMediaId] : [])),
    locale,
  );
  for (const id of covers.keys()) cacheTag(tags.media(id));
  return rows.map(({ p, t }) => {
    const blocks = readBlocks(t.blocks, `journal ${p.slug} (${locale})`);
    return {
      summary: {
        id: p.id,
        slug: p.slug,
        title: t.title,
        excerpt: t.excerpt,
        topic: p.topic,
        publishedAt: p.publishedAt ?? p.createdAt,
        updatedAt: p.updatedAt,
        minutes: readingMinutes(blocks),
        words: wordCount(blocks),
        cover: (p.coverMediaId && covers.get(p.coverMediaId)) || null,
      } satisfies PostSummary,
      blocks,
      t,
    };
  });
}

/** Published posts for the journal index. */
export async function getPublishedPosts(
  locale: Locale,
): Promise<PostSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.postsList);
  if (!databaseAvailable()) return [];
  return (await querySummaries(locale)).map((r) => r.summary);
}

/** Published post slugs for static path generation. */
export async function getPublishedPostSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.postsList);
  if (!databaseAvailable()) return [];
  const rows = await db
    .select({ slug: posts.slug })
    .from(posts)
    .where(eq(posts.status, "published"));
  return rows.map((r) => r.slug);
}

/** Published posts with last modification date for the sitemap. */
export async function getSitemapPosts(): Promise<
  { slug: string; lastModified: Date }[]
> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.postsList);
  if (!databaseAvailable()) return [];
  const rows = await db
    .select({ slug: posts.slug, lastModified: posts.updatedAt })
    .from(posts)
    .where(eq(posts.status, "published"));
  return rows;
}

/** Full published post with block media and its neighbours. */
export async function getPostBySlug(
  slug: string,
  locale: Locale,
): Promise<PostDetail | null> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.postsList);
  if (!databaseAvailable()) return null;
  const all = await querySummaries(locale);
  const index = all.findIndex((r) => r.summary.slug === slug);
  const current = all[index];
  if (!current) return null;
  cacheTag(tags.post(current.summary.id));
  const media = await loadMedia(
    mediaRefs(current.blocks).map((r) => r.id),
    locale,
  );
  for (const id of media.keys()) cacheTag(tags.media(id));
  const link = (r: (typeof all)[number] | undefined) =>
    r ? { slug: r.summary.slug, title: r.summary.title } : null;
  return {
    ...current.summary,
    blocks: current.blocks,
    seoTitle: current.t.seoTitle,
    seoDescription: current.t.seoDescription,
    media: Object.fromEntries(media),
    newer: link(all[index - 1]),
    older: link(all[index + 1]),
  };
}
