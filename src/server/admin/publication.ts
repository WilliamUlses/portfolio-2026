import { eq, inArray } from "drizzle-orm";
import { mediaRefs } from "@/content/blocks";
import { publicationProblems } from "@/content/publication";
import { db } from "@/db/client";
import {
  media,
  mediaTranslations,
  projects,
  projectTranslations,
} from "@/db/schema";

/** Returns blocking publication issues for a project, or null if project is not found. */
export async function getPublicationProblems(
  projectId: string,
): Promise<string[] | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project) return null;
  const translations = await db
    .select()
    .from(projectTranslations)
    .where(eq(projectTranslations.projectId, projectId));
  const fr = translations.find((t) => t.locale === "fr");
  const en = translations.find((t) => t.locale === "en");

  const ids = [
    project.coverMediaId,
    project.previewMediaId,
    project.ogMediaId,
    ...mediaRefs(fr?.blocks ?? []).map((r) => r.id),
    ...mediaRefs(en?.blocks ?? []).map((r) => r.id),
  ].filter((id): id is string => Boolean(id));
  const unique = [...new Set(ids)];

  const alts = new Map<string, { fr?: string; en?: string }>();
  const names = new Map<string, string>();
  if (unique.length) {
    for (const a of await db
      .select()
      .from(mediaTranslations)
      .where(inArray(mediaTranslations.mediaId, unique))) {
      alts.set(a.mediaId, { ...alts.get(a.mediaId), [a.locale]: a.altText });
    }
    for (const m of await db
      .select({
        id: media.id,
        name: media.originalName,
        pathname: media.pathname,
      })
      .from(media)
      .where(inArray(media.id, unique))) {
      names.set(m.id, m.name ?? m.pathname);
    }
  }

  return publicationProblems({
    coverMediaId: project.coverMediaId,
    previewMediaId: project.previewMediaId,
    ogMediaId: project.ogMediaId,
    fr,
    en,
    alts,
    names,
  });
}
