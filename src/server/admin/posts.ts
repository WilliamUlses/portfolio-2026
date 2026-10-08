import { asc, desc, eq } from "drizzle-orm";
import { postPublicationProblems } from "@/content/post-input";
import { db } from "@/db/client";
import { posts, postTranslations } from "@/db/schema";

// Admin journal queries: always fresh (no cache), called from protected pages only.

export async function listAdminPosts() {
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      topic: posts.topic,
      status: posts.status,
      publishedAt: posts.publishedAt,
      updatedAt: posts.updatedAt,
      locale: postTranslations.locale,
      title: postTranslations.title,
    })
    .from(posts)
    .leftJoin(postTranslations, eq(postTranslations.postId, posts.id))
    .orderBy(desc(posts.updatedAt), asc(postTranslations.locale));
  const byId = new Map<
    string,
    (typeof rows)[number] & { titleFr: string; hasEn: boolean }
  >();
  for (const r of rows) {
    const cur = byId.get(r.id) ?? { ...r, titleFr: "", hasEn: false };
    if (r.locale === "fr") cur.titleFr = r.title ?? "";
    if (r.locale === "en") cur.hasEn = true;
    byId.set(r.id, cur);
  }
  return [...byId.values()];
}

export async function getAdminPost(id: string) {
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post) return null;
  const translations = await db
    .select()
    .from(postTranslations)
    .where(eq(postTranslations.postId, id));
  return {
    post,
    fr: translations.find((t) => t.locale === "fr") ?? null,
    en: translations.find((t) => t.locale === "en") ?? null,
  };
}

/** Blocking problems before publication, or null if the post does not exist. */
export async function getPostProblems(id: string): Promise<string[] | null> {
  const data = await getAdminPost(id);
  if (!data) return null;
  const t = (x: typeof data.fr) =>
    x ? { title: x.title, excerpt: x.excerpt, blocks: x.blocks.length } : null;
  return postPublicationProblems({
    fr: t(data.fr),
    en: t(data.en),
  });
}
