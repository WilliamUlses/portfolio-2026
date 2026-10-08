import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { media, mediaTranslations } from "@/db/schema";
import type { Locale } from "@/i18n/config";

// Storefront media representations with localized alt text and resolved video posters
export type PublicMedia = {
  id: string;
  kind: "image" | "video" | "svg";
  url: string;
  mimeType: string;
  width: number;
  height: number;
  alt: string;
  thumbhash: string | null;
  dominantColor: string | null;
  durationMs: number | null;
  poster: { url: string; width: number; height: number } | null;
};

/**
 * Loads media records by ID, attaching localized alt text and video poster metadata.
 */
export async function loadMedia(
  ids: string[],
  locale: Locale,
): Promise<Map<string, PublicMedia>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const rows = await db
    .select({ m: media, alt: mediaTranslations.altText })
    .from(media)
    .leftJoin(
      mediaTranslations,
      and(
        eq(mediaTranslations.mediaId, media.id),
        eq(mediaTranslations.locale, locale),
      ),
    )
    .where(inArray(media.id, unique));

  const posterIds = rows.flatMap((r) =>
    r.m.posterMediaId ? [r.m.posterMediaId] : [],
  );
  const posters = posterIds.length
    ? await db.select().from(media).where(inArray(media.id, posterIds))
    : [];

  const result = new Map<string, PublicMedia>();
  for (const { m, alt } of rows) {
    const poster = posters.find((p) => p.id === m.posterMediaId);
    result.set(m.id, {
      id: m.id,
      kind: m.kind,
      url: m.url,
      mimeType: m.mimeType,
      width: m.width,
      height: m.height,
      alt: alt ?? "",
      thumbhash: m.thumbhash,
      dominantColor: m.dominantColor,
      durationMs: m.durationMs,
      poster: poster
        ? { url: poster.url, width: poster.width, height: poster.height }
        : null,
    });
  }
  return result;
}
