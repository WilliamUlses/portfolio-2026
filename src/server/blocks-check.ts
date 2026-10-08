import { inArray } from "drizzle-orm";
import { type Block, Blocks, mediaRefs } from "@/content/blocks";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import { media } from "@/db/schema";

// Shared block validation for projects and journal posts: schema check, then every
// referenced media must exist and match the kind the block expects.
export async function checkBlocks(
  raw: unknown,
): Promise<{ ok: true; blocks: Block[] } | (ActionResult & { ok: false })> {
  const parsed = Blocks.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return {
      ok: false,
      code: "VALIDATION",
      message: "Certains blocs sont invalides.",
      fieldErrors,
    };
  }
  const blocks = parsed.data;
  const refs = mediaRefs(blocks);
  if (refs.length) {
    const rows = await db
      .select({ id: media.id, kind: media.kind })
      .from(media)
      .where(inArray(media.id, [...new Set(refs.map((r) => r.id))]));
    const kindById = new Map(rows.map((r) => [r.id, r.kind]));
    const wrong = refs.filter((r) => {
      const kind = kindById.get(r.id);
      return r.expects === "video"
        ? kind !== "video"
        : kind !== "image" && kind !== "svg";
    });
    if (wrong.length) {
      return {
        ok: false,
        code: "VALIDATION",
        message: `Média introuvable ou de mauvais type (${wrong.length}). Recharge la page.`,
      };
    }
  }
  return { ok: true, blocks };
}
