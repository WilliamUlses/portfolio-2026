import type { Block } from "./blocks";

// Extracts H2 headings from text blocks to generate table of contents and slug anchors.

type Node = {
  type: string;
  text?: string;
  content?: Node[];
  attrs?: { level?: number };
};

function textOf(node: Node): string {
  if (node.type === "text") return node.text ?? "";
  return (node.content ?? []).map(textOf).join("");
}

/** Ordered list of H2 text strings from text blocks. */
export function docHeadings(blocks: Block[]): string[] {
  return blocks.flatMap((b) =>
    b.type === "text"
      ? ((b.doc.content ?? []) as Node[])
          .filter((n) => n.type === "heading" && n.attrs?.level === 2)
          .map((n) => textOf(n).trim())
          .filter(Boolean)
      : [],
  );
}

/** Generates unique normalized URL slug anchors. */
export function anchorIds(texts: string[]): string[] {
  const seen = new Map<string, number>();
  return texts.map((t) => {
    const base =
      t
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "section";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  });
}
