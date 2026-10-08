import { list } from "@vercel/blob";
import { db } from "@/db/client";
import { media } from "@/db/schema";
import { blobStoreId } from "@/media/blob";

/** Blob store objects without a corresponding database row (interrupted uploads, stale assets). */
export async function listOrphanUrls(): Promise<string[]> {
  const known = new Set(
    (await db.select({ url: media.url }).from(media)).map((m) => m.url),
  );
  const orphans: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, storeId: blobStoreId() });
    for (const b of page.blobs) if (!known.has(b.url)) orphans.push(b.url);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return orphans;
}
