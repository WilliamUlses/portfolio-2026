import { createId } from "@paralleldrive/cuid2";
import type { Block } from "./blocks";

/** Copies block structure from another locale: preserves media layouts while resetting translatable text fields. */
export function copyStructure(source: Block[]): Block[] {
  return source.map((b): Block => {
    const id = createId();
    switch (b.type) {
      case "text":
        return { ...b, id, doc: { type: "doc", content: [] } };
      case "image":
      case "gallery":
      case "video":
        return { ...b, id, caption: undefined };
      case "quote":
        return { ...b, id, text: "" };
      case "stats":
        return {
          ...b,
          id,
          items: b.items.map((it) => ({ value: it.value, label: "" })),
        };
      case "credits":
        return { ...b, id, items: b.items.map((it) => ({ ...it, role: "" })) };
      default: // embed: no translatable text
        return { ...b, id };
    }
  });
}
