import { eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { media, people, projects, projectTranslations } from "@/db/schema";

// Tracks media references across projects, blocks, collaborators, and video posters
export type MediaUsage = {
  mediaId: string;
  where: string;
  projectId?: string;
  projectSlug?: string;
};

export async function findMediaUsages(
  ids?: string[],
): Promise<Map<string, MediaUsage[]>> {
  const usages = new Map<string, MediaUsage[]>();
  const add = (u: MediaUsage) => {
    if (ids && !ids.includes(u.mediaId)) return;
    usages.set(u.mediaId, [...(usages.get(u.mediaId) ?? []), u]);
  };

  const projectRows = await db
    .select({
      id: projects.id,
      slug: projects.slug,
      cover: projects.coverMediaId,
      preview: projects.previewMediaId,
      og: projects.ogMediaId,
    })
    .from(projects)
    .where(
      or(
        isNotNull(projects.coverMediaId),
        isNotNull(projects.previewMediaId),
        isNotNull(projects.ogMediaId),
      ),
    );
  for (const p of projectRows) {
    const base = { projectId: p.id, projectSlug: p.slug };
    if (p.cover) add({ mediaId: p.cover, where: "cover", ...base });
    if (p.preview)
      add({ mediaId: p.preview, where: "hover preview video", ...base });
    if (p.og) add({ mediaId: p.og, where: "Open Graph image", ...base });
  }

  // Collaborator portraits
  const photos = await db
    .select({ name: people.name, photo: people.photoMediaId })
    .from(people)
    .where(isNotNull(people.photoMediaId));
  for (const p of photos) {
    if (p.photo) add({ mediaId: p.photo, where: `photo: ${p.name}` });
  }

  const posters = await db
    .select({ id: media.id, poster: media.posterMediaId })
    .from(media)
    .where(isNotNull(media.posterMediaId));
  for (const v of posters) {
    if (v.poster) add({ mediaId: v.poster, where: `video poster: ${v.id}` });
  }

  // Block references: extract mediaId and mediaIds array entries from block JSON
  const blockRefs = await db
    .select({
      mediaId: sql<string>`ref`,
      locale: projectTranslations.locale,
      projectId: projects.id,
      slug: projects.slug,
    })
    .from(projectTranslations)
    .innerJoin(projects, eq(projects.id, projectTranslations.projectId))
    .innerJoin(
      sql`lateral (
        select b->>'mediaId' as ref from jsonb_array_elements(${projectTranslations.blocks}) b where b ? 'mediaId'
        union all
        select jsonb_array_elements_text(b->'mediaIds') from jsonb_array_elements(${projectTranslations.blocks}) b where b ? 'mediaIds'
      ) refs`,
      sql`true`,
    )
    .where(ids?.length ? inArray(sql`ref`, ids) : undefined);
  for (const r of blockRefs) {
    add({
      mediaId: r.mediaId,
      where: `block (${r.locale.toUpperCase()})`,
      projectId: r.projectId,
      projectSlug: r.slug,
    });
  }
  return usages;
}
