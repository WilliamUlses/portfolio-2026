import type { Block } from "./blocks";

// Extracts ordered media IDs from image and gallery blocks for case study shot anchors.
export function blockShots(
  blocks: Block[],
  hasMedia: (id: string) => boolean,
): string[] {
  return blocks.flatMap((b) => {
    if (b.type === "image") return hasMedia(b.mediaId) ? [b.mediaId] : [];
    if (b.type === "gallery") return b.mediaIds.filter(hasMedia);
    return [];
  });
}

export const shotId = (index: number) => `shot-${index + 1}`;
