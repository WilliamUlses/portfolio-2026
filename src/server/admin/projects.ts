import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  categories,
  categoryTranslations,
  projects,
  projectTags,
  projectTranslations,
  tags,
  tagTranslations,
} from "@/db/schema";

// Admin queries: uncached real-time database reads for back-office forms and views

export type ProjectStatus = (typeof projects.$inferSelect)["status"];
type Translation = typeof projectTranslations.$inferSelect;

/** Checks whether a project translation has title, summary, and blocks */
export function isTranslationComplete(t: Translation | undefined): boolean {
  return Boolean(t?.title.trim() && t.summary.trim() && t.blocks.length > 0);
}

export async function listAdminProjects(status?: ProjectStatus) {
  const rows = await db
    .select()
    .from(projects)
    .where(status ? eq(projects.status, status) : undefined)
    .orderBy(asc(projects.sortOrder), asc(projects.createdAt));
  const translations = await db.select().from(projectTranslations);
  return rows.map((p) => {
    const fr = translations.find(
      (t) => t.projectId === p.id && t.locale === "fr",
    );
    const en = translations.find(
      (t) => t.projectId === p.id && t.locale === "en",
    );
    return {
      ...p,
      title: fr?.title || en?.title || p.slug,
      frComplete: isTranslationComplete(fr),
      enComplete: isTranslationComplete(en),
    };
  });
}

export async function getAdminProject(id: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return null;
  const translations = await db
    .select()
    .from(projectTranslations)
    .where(eq(projectTranslations.projectId, id));
  const tagRows = await db
    .select({ tagId: projectTags.tagId })
    .from(projectTags)
    .where(eq(projectTags.projectId, id));
  return {
    project,
    fr: translations.find((t) => t.locale === "fr"),
    en: translations.find((t) => t.locale === "en"),
    tagIds: tagRows.map((r) => r.tagId),
  };
}

export async function getTaxonomyOptions() {
  const cats = await db
    .select({ id: categories.id, name: categoryTranslations.name })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      eq(categoryTranslations.categoryId, categories.id),
    )
    .where(eq(categoryTranslations.locale, "fr"))
    .orderBy(asc(categories.sortOrder));
  const tagOptions = await db
    .select({ id: tags.id, name: tagTranslations.name })
    .from(tags)
    .innerJoin(tagTranslations, eq(tagTranslations.tagId, tags.id))
    .where(eq(tagTranslations.locale, "fr"))
    .orderBy(asc(tagTranslations.name));
  return { categories: cats, tags: tagOptions };
}
