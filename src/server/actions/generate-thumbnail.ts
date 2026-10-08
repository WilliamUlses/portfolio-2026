"use server";

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import { db } from "@/db/client";
import { media, mediaTranslations, posts } from "@/db/schema";
import { newId } from "@/lib/ids";
import { renderLiquidGlassThumbnail } from "@/seo/render-pure-dark";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

// Server action to generate both Dark (#08090D) and Light Cobalt (#0029FF) Liquid Glass thumbnails.
export async function generatePostThumbnailAction({
  postId,
  slug,
  title,
}: {
  postId: string;
  slug: string;
  title: string;
}): Promise<{ ok: boolean; url?: string; mediaId?: string; message?: string }> {
  try {
    await requireAdmin();

    if (!postId || !slug || !title) {
      return { ok: false, message: "Paramètres manquants." };
    }

    // 1. Generate both PNG buffers in parallel via Chromium Playwright
    const [pngDark, pngLight] = await Promise.all([
      renderLiquidGlassThumbnail(title, "dark"),
      renderLiquidGlassThumbnail(title, "light"),
    ]);

    // 2. Write files to public/thumbnails/
    const dir = join(process.cwd(), "public/thumbnails");
    const darkFilename = `${slug}-dark.png`;
    const lightFilename = `${slug}-light.png`;
    const defaultFilename = `${slug}.png`;

    await Promise.all([
      writeFile(join(dir, darkFilename), pngDark),
      writeFile(join(dir, lightFilename), pngLight),
      writeFile(join(dir, defaultFilename), pngDark),
    ]);

    // 3. Compute image metadata via sharp for primary media
    const metadata = await sharp(pngDark).metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 630;

    // Small thumbnail for Thumbhash calculation
    const rawPixels = await sharp(pngDark)
      .resize(100, 100, { fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let thumbhashStr: string | null = null;
    try {
      const hashBytes = rgbaToThumbHash(
        rawPixels.info.width,
        rawPixels.info.height,
        rawPixels.data,
      );
      thumbhashStr = Buffer.from(hashBytes).toString("base64");
    } catch {
      // Thumbhash is optional fallback
    }

    const publicUrl = `/thumbnails/${defaultFilename}`;

    // 4. Upsert or insert media record
    let mediaId = newId();
    const [existingMedia] = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.url, publicUrl));

    if (existingMedia) {
      mediaId = existingMedia.id;
      await db
        .update(media)
        .set({
          fileSize: pngDark.length,
          width,
          height,
          thumbhash: thumbhashStr,
          dominantColor: "#08090D",
        })
        .where(eq(media.id, mediaId));
    } else {
      await db.transaction(async (tx) => {
        await tx.insert(media).values({
          id: mediaId,
          kind: "image",
          url: publicUrl,
          pathname: `thumbnails/${defaultFilename}`,
          mimeType: "image/png",
          fileSize: pngDark.length,
          width,
          height,
          thumbhash: thumbhashStr,
          dominantColor: "#08090D",
          originalName: defaultFilename,
        });
        await tx.insert(mediaTranslations).values([
          {
            mediaId,
            locale: "fr",
            altText: `Miniature Liquid Glass — ${title.replaceAll("*", "")}`,
          },
          {
            mediaId,
            locale: "en",
            altText: `Liquid Glass Thumbnail — ${title.replaceAll("*", "")}`,
          },
        ]);
      });
    }

    // 5. Link cover to post and persist thumbnailTitle (distinct from the article title)
    await db
      .update(posts)
      .set({
        coverMediaId: mediaId,
        thumbnailTitle: title,
        updatedAt: new Date(),
      })
      .where(eq(posts.id, postId));

    // 6. Invalidate caches
    updateTag(tags.post(postId));
    updateTag(tags.postsList);
    refresh();

    return {
      ok: true,
      url: `${publicUrl}?v=${Date.now()}`,
      mediaId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    return { ok: false, message: `Échec de la génération : ${errorMsg}` };
  }
}

/**
 * Server action to manually import/upload a thumbnail image file for Dark or Light theme.
 * Saves locally to public/thumbnails/ in dev and uploads to Vercel Blob in production.
 */
export async function uploadThumbnailAction(
  formData: FormData,
): Promise<{ ok: boolean; url?: string; mediaId?: string; message?: string }> {
  try {
    await requireAdmin();
    const postId = formData.get("postId") as string;
    const slug = formData.get("slug") as string;
    const theme = (formData.get("theme") as "dark" | "light") || "dark";
    const file = formData.get("file") as File | null;

    if (!postId || !slug || !file) {
      return { ok: false, message: "Fichier ou paramètres manquants." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pngBuffer = await sharp(buffer)
      .resize(1200, 630, { fit: "cover" })
      .png()
      .toBuffer();

    const dir = join(process.cwd(), "public/thumbnails");
    const filename = `${slug}-${theme}.png`;

    try {
      await writeFile(join(dir, filename), pngBuffer);
      if (theme === "dark") {
        await writeFile(join(dir, `${slug}.png`), pngBuffer);
      }
    } catch {
      // Ignored if file system is read-only (e.g. on Vercel runtime)
    }

    let publicUrl = `/thumbnails/${filename}`;

    // Upload to Vercel Blob if store ID is configured or in production
    try {
      const { put } = await import("@vercel/blob");
      const { blobStoreId } = await import("@/media/blob");
      const storeId = blobStoreId();
      if (storeId) {
        const blob = await put(`thumbnails/${filename}`, pngBuffer, {
          access: "public",
          contentType: "image/png",
          storeId,
        });
        publicUrl = blob.url;
      }
    } catch {
      // Local fallback
    }

    const metadata = await sharp(pngBuffer).metadata();
    const width = metadata.width ?? 1200;
    const height = metadata.height ?? 630;

    let thumbhashStr: string | null = null;
    try {
      const rawPixels = await sharp(pngBuffer)
        .resize(100, 100, { fit: "inside" })
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const hashBytes = rgbaToThumbHash(
        rawPixels.info.width,
        rawPixels.info.height,
        rawPixels.data,
      );
      thumbhashStr = Buffer.from(hashBytes).toString("base64");
    } catch {
      // Optional
    }

    let mediaId = newId();
    const [existingMedia] = await db
      .select({ id: media.id })
      .from(media)
      .where(eq(media.url, publicUrl));

    if (existingMedia) {
      mediaId = existingMedia.id;
      await db
        .update(media)
        .set({
          fileSize: pngBuffer.length,
          width,
          height,
          thumbhash: thumbhashStr,
          dominantColor: theme === "dark" ? "#08090D" : "#0029FF",
        })
        .where(eq(media.id, mediaId));
    } else {
      await db.transaction(async (tx) => {
        await tx.insert(media).values({
          id: mediaId,
          kind: "image",
          url: publicUrl,
          pathname: `thumbnails/${filename}`,
          mimeType: "image/png",
          fileSize: pngBuffer.length,
          width,
          height,
          thumbhash: thumbhashStr,
          dominantColor: theme === "dark" ? "#08090D" : "#0029FF",
          originalName: file.name || filename,
        });
        await tx.insert(mediaTranslations).values([
          {
            mediaId,
            locale: "fr",
            altText: `Miniature importée (${theme}) — ${slug}`,
          },
          {
            mediaId,
            locale: "en",
            altText: `Imported thumbnail (${theme}) — ${slug}`,
          },
        ]);
      });
    }

    if (theme === "dark") {
      await db
        .update(posts)
        .set({ coverMediaId: mediaId, updatedAt: new Date() })
        .where(eq(posts.id, postId));
    }

    updateTag(tags.post(postId));
    updateTag(tags.postsList);
    refresh();

    return {
      ok: true,
      url: `${publicUrl}?v=${Date.now()}`,
      mediaId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
    return { ok: false, message: `Échec de l'import : ${errorMsg}` };
  }
}
