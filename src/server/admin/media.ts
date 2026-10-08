import { desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db/client";
import { media, mediaTranslations } from "@/db/schema";
import { findMediaUsages } from "./media-usage";

// Admin media library: uncached queries with search on original name and alt texts.
export async function listAdminMedia(search?: string) {
  // Escape SQL LIKE wildcards (% and _)
  const term = search?.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
  const rows = await db
    .selectDistinct({ media })
    .from(media)
    .leftJoin(mediaTranslations, eq(mediaTranslations.mediaId, media.id))
    .where(
      term
        ? or(
            ilike(media.originalName, `%${term}%`),
            ilike(mediaTranslations.altText, `%${term}%`),
          )
        : undefined,
    )
    .orderBy(desc(media.createdAt));
  const alts = await db.select().from(mediaTranslations);
  const usages = await findMediaUsages();
  return rows.map(({ media: m }) => ({
    ...m,
    usages: usages.get(m.id) ?? [],
    altFr:
      alts.find((a) => a.mediaId === m.id && a.locale === "fr")?.altText ?? "",
    altEn:
      alts.find((a) => a.mediaId === m.id && a.locale === "en")?.altText ?? "",
  }));
}

/** Media picker options ordered newest to oldest. */
export async function listMediaOptions() {
  const rows = await db
    .select({
      id: media.id,
      kind: media.kind,
      url: media.url,
      width: media.width,
      height: media.height,
      originalName: media.originalName,
      pathname: media.pathname,
      posterMediaId: media.posterMediaId,
      thumbhash: media.thumbhash,
      dominantColor: media.dominantColor,
    })
    .from(media)
    .orderBy(desc(media.createdAt));
  const alts = await db
    .select({
      mediaId: mediaTranslations.mediaId,
      altText: mediaTranslations.altText,
    })
    .from(mediaTranslations)
    .where(eq(mediaTranslations.locale, "fr"));
  const altById = new Map(alts.map((a) => [a.mediaId, a.altText]));
  const urlById = new Map(rows.map((m) => [m.id, m.url]));
  return rows.map((m) => {
    const name = m.originalName ?? m.pathname;
    return {
      id: m.id,
      kind: m.kind,
      url: m.url,
      width: m.width,
      height: m.height,
      name,
      altFr: altById.get(m.id) ?? "",
      posterUrl: m.posterMediaId
        ? (urlById.get(m.posterMediaId) ?? null)
        : null,
      dominantColor: m.dominantColor,
      label: `${name} (${m.width}×${m.height})`,
    };
  });
}
export type MediaOption = Awaited<ReturnType<typeof listMediaOptions>>[number];
