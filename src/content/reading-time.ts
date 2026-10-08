import type { Block } from "./blocks";

// Estimated reading time (minutes, ≥ 1) from the text carried by content blocks.
const WORDS_PER_MINUTE = 220;

function collectText(node: unknown, out: string[]): void {
  if (Array.isArray(node)) {
    for (const n of node) collectText(n, out);
    return;
  }
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    if (typeof o.text === "string") out.push(o.text);
    if (o.content) collectText(o.content, out);
  }
}

/** Number of words carried by text and quote blocks (schema.org wordCount). */
export function wordCount(blocks: Block[]): number {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.type === "text") collectText(b.doc, out);
    else if (b.type === "quote") out.push(b.text);
  }
  return out.join(" ").split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(blocks: Block[]): number {
  return Math.max(1, Math.round(wordCount(blocks) / WORDS_PER_MINUTE));
}
