import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/db/schema";

// Fast lookup used by proxy.ts: unknown or unpublished journal slugs get a real 404.
export async function isPublishedPostSlug(slug: string): Promise<boolean> {
  const [row] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.status, "published")))
    .limit(1);
  return Boolean(row);
}
