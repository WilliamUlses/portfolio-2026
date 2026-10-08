"use server";

import { del, head } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { RegisterMediaInput, UpdateMediaAltInput } from "@/content/media-input";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import { media, mediaTranslations } from "@/db/schema";
import { newId } from "@/lib/ids";
import { blobStoreId } from "@/media/blob";
import { MAX_SVG_BYTES } from "@/media/constants";
import { findUnsafeSvg } from "@/media/svg-check";
import { findMediaUsages } from "@/server/admin/media-usage";
import { listOrphanUrls } from "@/server/admin/orphans";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

const invalid = (message: string): ActionResult<never> => ({
  ok: false,
  code: "VALIDATION",
  message,
});

/** Empty alt texts omit database rows; publication validation enforces presence of FR and EN. */
function altRows(mediaId: string, altFr: string, altEn: string) {
  return [
    { mediaId, locale: "fr" as const, altText: altFr },
    { mediaId, locale: "en" as const, altText: altEn },
  ].filter((r) => r.altText.length > 0);
}

// Persists a newly uploaded media record after direct client upload.
export async function registerMedia(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = RegisterMediaInput.safeParse(input);
  if (!parsed.success) return invalid("Données du média invalides.");
  const data = parsed.data;
  if (new URL(data.url).pathname !== `/${data.pathname}`) {
    return invalid("L'URL ne correspond pas au chemin.");
  }
  const storeId = blobStoreId();

  // Verify that the file exists in the designated blob store
  let blob: Awaited<ReturnType<typeof head>>;
  try {
    blob = await head(data.url, { storeId });
  } catch {
    return invalid("Fichier introuvable dans le stockage.");
  }
  if (blob.contentType !== data.mimeType)
    return invalid("Type de fichier incohérent.");

  // For SVG files, re-verify content safety on the stored asset
  if (data.kind === "svg") {
    const problems =
      blob.size > MAX_SVG_BYTES
        ? ["fichier trop lourd"]
        : findUnsafeSvg(await (await fetch(blob.url)).text());
    if (problems.length) {
      await del(blob.url, { storeId });
      return invalid(`SVG refusé et supprimé : ${problems.join(", ")}.`);
    }
  }

  // Videos require a registered image as their poster
  let posterThumb:
    | { thumbhash: string | null; dominantColor: string | null }
    | undefined;
  if (data.kind === "video") {
    const [poster] = await db
      .select({
        kind: media.kind,
        thumbhash: media.thumbhash,
        dominantColor: media.dominantColor,
      })
      .from(media)
      .where(eq(media.id, data.posterMediaId));
    if (poster?.kind !== "image")
      return invalid("Poster de la vidéo introuvable.");
    posterThumb = poster;
  }

  const id = newId();
  await db.transaction(async (tx) => {
    await tx.insert(media).values({
      id,
      kind: data.kind,
      url: blob.url,
      pathname: blob.pathname,
      mimeType: blob.contentType,
      fileSize: blob.size,
      width: data.width,
      height: data.height,
      thumbhash:
        data.kind === "image"
          ? data.thumbhash
          : (posterThumb?.thumbhash ?? null),
      dominantColor:
        data.kind === "image"
          ? data.dominantColor.toUpperCase()
          : (posterThumb?.dominantColor ?? null),
      posterMediaId: data.kind === "video" ? data.posterMediaId : null,
      durationMs: data.kind === "video" ? data.durationMs : null,
      originalName: data.originalName || null,
    });
    const rows = altRows(id, data.altFr, data.altEn);
    if (rows.length) await tx.insert(mediaTranslations).values(rows);
  });

  refresh();
  return { ok: true, data: { id } };
}

export async function updateMediaAlts(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = UpdateMediaAltInput.safeParse({
    id: formData.get("id"),
    altFr: formData.get("altFr") ?? "",
    altEn: formData.get("altEn") ?? "",
  });
  if (!parsed.success)
    return invalid("Texte alternatif invalide (300 car. max).");
  const { id, altFr, altEn } = parsed.data;

  const [exists] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.id, id));
  if (!exists)
    return { ok: false, code: "NOT_FOUND", message: "Média introuvable." };

  await db.transaction(async (tx) => {
    for (const [locale, altText] of [
      ["fr", altFr],
      ["en", altEn],
    ] as const) {
      if (altText) {
        await tx
          .insert(mediaTranslations)
          .values({ mediaId: id, locale, altText })
          .onConflictDoUpdate({
            target: [mediaTranslations.mediaId, mediaTranslations.locale],
            set: { altText },
          });
      } else {
        await tx
          .delete(mediaTranslations)
          .where(
            and(
              eq(mediaTranslations.mediaId, id),
              eq(mediaTranslations.locale, locale),
            ),
          );
      }
    }
  });

  updateTag(tags.media(id));
  refresh();
  return { ok: true, data: undefined };
}

// Media deletion is blocked if referenced anywhere in projects or blocks.
export async function deleteMedia(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const [row] = await db.select().from(media).where(eq(media.id, id));
  if (!row)
    return { ok: false, code: "NOT_FOUND", message: "Média introuvable." };

  const usages = (await findMediaUsages([id])).get(id) ?? [];
  if (usages.length) {
    return {
      ok: false,
      code: "CONFLICT",
      message: `Suppression refusée, média utilisé : ${usages
        .map((u) =>
          u.projectSlug ? `${u.where} de « ${u.projectSlug} »` : u.where,
        )
        .join(", ")}.`,
    };
  }

  // Delete DB record first, then remote blob storage
  await db.delete(media).where(eq(media.id, id));
  try {
    await del(row.url, { storeId: blobStoreId() });
  } catch {
    // Leftover orphan will be caught by orphan cleaner
  }
  updateTag(tags.media(id));
  refresh();
  return { ok: true, data: undefined };
}

export async function findOrphans(): Promise<ActionResult<{ urls: string[] }>> {
  await requireAdmin();
  return { ok: true, data: { urls: await listOrphanUrls() } };
}

// Deletes unreferenced orphan files from blob storage.
export async function deleteOrphans(
  urls: string[],
): Promise<ActionResult<{ deleted: number }>> {
  await requireAdmin();
  const stillOrphan = new Set(await listOrphanUrls());
  const targets = urls.filter((u) => stillOrphan.has(u));
  if (targets.length) await del(targets, { storeId: blobStoreId() });
  refresh();
  return { ok: true, data: { deleted: targets.length } };
}
