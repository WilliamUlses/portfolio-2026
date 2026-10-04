import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import type { Block } from "@/content/blocks";
import { mediaRefs } from "@/content/blocks";
import { readBlocks } from "@/content/read-blocks";
import { db } from "@/db/client";
import {
  categories,
  categoryTranslations,
  people,
  projectPeople,
  projects,
  projectTags,
  projectTranslations,
  tagTranslations,
} from "@/db/schema";
import type { Locale } from "@/i18n/config";
import { tags } from "../cache-tags";
import { databaseAvailable } from "./db-available";
import { loadMedia, type PublicMedia } from "./media";

// Storefront cached project queries.
// Pure functions accepting locale as argument without reading cookies/headers.

export type ProjectSummary = {
  id: string;
  slug: string;
  status: "draft" | "published" | "archived";
  title: string;
  subtitle: string | null;
  summary: string;
  role: string | null;
  client: string | null;
  year: number;
  featured: boolean;
  accentColor: string;
  externalUrl: string | null;
  category: { slug: string; name: string } | null;
  cover: PublicMedia | null;
};

export type ProjectPerson = {
  id: string;
  name: string;
  role: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  photo: PublicMedia | null;
};

export type NextProject = {
  slug: string;
  title: string;
  category: { slug: string; name: string } | null;
  cover: PublicMedia | null;
  accentColor: string;
  year: number;
};

export type ProjectDetail = ProjectSummary & {
  /** Custom social share image selected in admin (fallback to cover derivative). */
  ogImage: PublicMedia | null;
  blocks: Block[];
  seoTitle: string | null;
  seoDescription: string | null;
  tagNames: string[];
  /** Media assets referenced by content blocks, indexed by ID. */
  media: Record<string, PublicMedia>;
  /** Collaborators sorted by display order. */
  people: ProjectPerson[];
  next: NextProject | null;
};

type Loaded<T> = { value: T; mediaIds: string[]; usesTaxonomies: boolean };

async function querySummaries(
  locale: Locale,
  where: SQL | undefined,
): Promise<Loaded<ProjectSummary[]>> {
  const rows = await db
    .select({ p: projects, t: projectTranslations, cat: categories })
    .from(projects)
    .innerJoin(
      projectTranslations,
      and(
        eq(projectTranslations.projectId, projects.id),
        eq(projectTranslations.locale, locale),
      ),
    )
    .leftJoin(categories, eq(categories.id, projects.categoryId))
    .where(where)
    .orderBy(asc(projects.sortOrder), asc(projects.createdAt));

  const categoryIds = rows.flatMap((r) => (r.cat ? [r.cat.id] : []));
  const catNames = categoryIds.length
    ? await db
        .select()
        .from(categoryTranslations)
        .where(
          and(
            inArray(categoryTranslations.categoryId, categoryIds),
            eq(categoryTranslations.locale, locale),
          ),
        )
    : [];
  const covers = await loadMedia(
    rows.flatMap((r) => (r.p.coverMediaId ? [r.p.coverMediaId] : [])),
    locale,
  );

  return {
    value: rows.map(({ p, t, cat }) => ({
      id: p.id,
      slug: p.slug,
      status: p.status,
      title: t.title,
      subtitle: t.subtitle,
      summary: t.summary,
      role: t.role,
      client: p.client,
      year: p.year,
      featured: p.featured,
      accentColor: p.accentColor,
      externalUrl: p.externalUrl,
      category: cat
        ? {
            slug: cat.slug,
            name:
              catNames.find((c) => c.categoryId === cat.id)?.name ?? cat.slug,
          }
        : null,
      cover: (p.coverMediaId && covers.get(p.coverMediaId)) || null,
    })),
    mediaIds: [...covers.keys()],
    usesTaxonomies: categoryIds.length > 0,
  };
}

/** Content blocks, tags, and block media for a project. */
async function queryDetail(
  summary: ProjectSummary,
  locale: Locale,
): Promise<Loaded<Omit<ProjectDetail, "next">> | null> {
  const [translation] = await db
    .select()
    .from(projectTranslations)
    .where(
      and(
        eq(projectTranslations.projectId, summary.id),
        eq(projectTranslations.locale, locale),
      ),
    );
  if (!translation) return null;

  const blocks = readBlocks(translation.blocks, `${summary.slug} (${locale})`);
  const [project] = await db
    .select({ ogMediaId: projects.ogMediaId })
    .from(projects)
    .where(eq(projects.id, summary.id));
  const ogMediaId = project?.ogMediaId ?? null;
  const blockMedia = await loadMedia(
    [...mediaRefs(blocks).map((r) => r.id), ...(ogMediaId ? [ogMediaId] : [])],
    locale,
  );
  const ogImage = (ogMediaId && blockMedia.get(ogMediaId)) || null;
  const team = await db
    .select({
      id: people.id,
      name: people.name,
      roleFr: projectPeople.roleFr,
      roleEn: projectPeople.roleEn,
      githubUrl: people.githubUrl,
      linkedinUrl: people.linkedinUrl,
      websiteUrl: people.websiteUrl,
      photoMediaId: people.photoMediaId,
    })
    .from(projectPeople)
    .innerJoin(people, eq(people.id, projectPeople.personId))
    .where(eq(projectPeople.projectId, summary.id))
    .orderBy(asc(projectPeople.sortOrder));
  const photos = await loadMedia(
    team.flatMap((p) => (p.photoMediaId ? [p.photoMediaId] : [])),
    locale,
  );
  const tagRows = await db
    .select({ name: tagTranslations.name })
    .from(projectTags)
    .innerJoin(
      tagTranslations,
      and(
        eq(tagTranslations.tagId, projectTags.tagId),
        eq(tagTranslations.locale, locale),
      ),
    )
    .where(eq(projectTags.projectId, summary.id));

  return {
    value: {
      ...summary,
      ogImage,
      blocks,
      seoTitle: translation.seoTitle,
      seoDescription: translation.seoDescription,
      tagNames: tagRows.map((r) => r.name),
      media: Object.fromEntries(blockMedia),
      people: team.map((p) => ({
        id: p.id,
        name: p.name,
        role: locale === "fr" ? p.roleFr : p.roleEn,
        githubUrl: p.githubUrl,
        linkedinUrl: p.linkedinUrl,
        websiteUrl: p.websiteUrl,
        photo: (p.photoMediaId && photos.get(p.photoMediaId)) || null,
      })),
    },
    mediaIds: [...blockMedia.keys(), ...photos.keys()],
    usesTaxonomies: tagRows.length > 0,
  };
}

function tagLoaded(loaded: Loaded<unknown>) {
  for (const id of loaded.mediaIds) cacheTag(tags.media(id));
  if (loaded.usesTaxonomies) cacheTag(tags.taxonomies);
}

// ── Cached public storefront queries ─────────────────────────────────────────

/** Published projects in display order. */
export async function getPublishedProjects(
  locale: Locale,
): Promise<ProjectSummary[]> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.projectsList);
  if (!databaseAvailable()) return [];
  const loaded = await querySummaries(locale, eq(projects.status, "published"));
  tagLoaded(loaded);
  return loaded.value;
}

/** Published project slugs for static path generation. */
export async function getPublishedSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.projectsList);
  if (!databaseAvailable()) return [];
  const rows = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(asc(projects.sortOrder));
  return rows.map((r) => r.slug);
}

/** Published projects with latest modification timestamp for sitemap. */
export async function getSitemapProjects(): Promise<
  { slug: string; lastModified: Date }[]
> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.projectsList);
  if (!databaseAvailable()) return [];
  const rows = await db
    .select({
      slug: projects.slug,
      updatedAt: projects.updatedAt,
      translationUpdatedAt: projectTranslations.updatedAt,
    })
    .from(projects)
    .leftJoin(
      projectTranslations,
      eq(projectTranslations.projectId, projects.id),
    )
    .where(eq(projects.status, "published"))
    .orderBy(asc(projects.sortOrder));
  const bySlug = new Map<string, Date>();
  for (const r of rows) {
    const dates = [r.updatedAt, r.translationUpdatedAt, bySlug.get(r.slug)];
    const latest = dates.filter((d): d is Date => d instanceof Date);
    bySlug.set(r.slug, new Date(Math.max(...latest.map((d) => d.getTime()))));
  }
  return [...bySlug].map(([slug, lastModified]) => ({ slug, lastModified }));
}

function nextOf(list: ProjectSummary[], id: string): NextProject | null {
  const index = list.findIndex((p) => p.id === id);
  const next =
    index >= 0 && list.length > 1 ? list[(index + 1) % list.length] : null;
  return next
    ? {
        slug: next.slug,
        title: next.title,
        category: next.category,
        cover: next.cover,
        accentColor: next.accentColor,
        year: next.year,
      }
    : null;
}

/** Published case study detail or null if not found. */
export async function getProjectBySlug(
  slug: string,
  locale: Locale,
): Promise<ProjectDetail | null> {
  "use cache";
  cacheLife("max");
  const list = await getPublishedProjects(locale);
  const summary = list.find((p) => p.slug === slug);
  if (!summary) return null;
  cacheTag(tags.project(summary.id));
  const detail = await queryDetail(summary, locale);
  if (!detail) return null;
  tagLoaded(detail);
  return { ...detail.value, next: nextOf(list, summary.id) };
}

// ── Preview mode (Draft Mode, uncached) ───────────────────────────────────────

/** Fetches project regardless of status for admin preview. */
export async function getProjectDraft(
  slug: string,
  locale: Locale,
): Promise<ProjectDetail | null> {
  const summaries = await querySummaries(locale, eq(projects.slug, slug));
  const summary = summaries.value[0];
  if (!summary) return null;
  const detail = await queryDetail(summary, locale);
  if (!detail) return null;
  const list = await querySummaries(locale, eq(projects.status, "published"));
  return { ...detail.value, next: nextOf(list.value, summary.id) };
}

/** Categories in display order with localized names. */
export async function getCategories(
  locale: Locale,
): Promise<{ slug: string; name: string }[]> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.taxonomies);
  if (!databaseAvailable()) return [];
  const rows = await db
    .select({ slug: categories.slug, name: categoryTranslations.name })
    .from(categories)
    .innerJoin(
      categoryTranslations,
      and(
        eq(categoryTranslations.categoryId, categories.id),
        eq(categoryTranslations.locale, locale),
      ),
    )
    .orderBy(asc(categories.sortOrder));
  return rows;
}
