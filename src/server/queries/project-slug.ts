import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { projects, slugRedirects } from "@/db/schema";

// Fast slug lookup used by proxy.ts to verify published status or resolve 308 redirects for renamed projects
export type SlugLookup =
  | { kind: "published" }
  | { kind: "moved"; slug: string }
  | { kind: "missing" };

export async function lookupProjectSlug(slug: string): Promise<SlugLookup> {
  const [current] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
    .limit(1);
  if (current) return { kind: "published" };

  const [moved] = await db
    .select({ slug: projects.slug })
    .from(slugRedirects)
    .innerJoin(projects, eq(projects.id, slugRedirects.projectId))
    .where(
      and(eq(slugRedirects.fromSlug, slug), eq(projects.status, "published")),
    )
    .limit(1);
  return moved && moved.slug !== slug
    ? { kind: "moved", slug: moved.slug }
    : { kind: "missing" };
}
