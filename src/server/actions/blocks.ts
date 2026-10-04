"use server";

import { and, eq, inArray } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { Blocks, mediaRefs } from "@/content/blocks";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import { media, projects, projectTranslations } from "@/db/schema";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

const Input = z.object({
  projectId: z.string().min(1),
  locale: z.enum(["fr", "en"]),
  blocks: z.unknown(),
});

// Updates content blocks for a project translation.
export async function updateBlocks(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const base = Input.safeParse(input);
  if (!base.success) {
    return { ok: false, code: "VALIDATION", message: "Requête invalide." };
  }
  const parsed = Blocks.safeParse(base.data.blocks);
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
  const { projectId, locale } = base.data;
  const blocks = parsed.data;

  // Validate that all referenced media exist and match expected media kinds
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

  const now = new Date();
  const updated = await db.transaction(async (tx) => {
    const res = await tx
      .update(projectTranslations)
      .set({ blocks, updatedAt: now })
      .where(
        and(
          eq(projectTranslations.projectId, projectId),
          eq(projectTranslations.locale, locale),
        ),
      )
      .returning({ projectId: projectTranslations.projectId });
    if (res.length) {
      await tx
        .update(projects)
        .set({ updatedAt: now })
        .where(eq(projects.id, projectId));
    }
    return res.length;
  });
  if (!updated) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message:
        locale === "en"
          ? "Pas de traduction anglaise : saisis d'abord un titre EN."
          : "Projet introuvable.",
    };
  }

  updateTag(tags.project(projectId));
  updateTag(tags.projectsList);
  refresh();
  return { ok: true, data: undefined };
}
