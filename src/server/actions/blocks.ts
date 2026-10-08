"use server";

import { and, eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import { projects, projectTranslations } from "@/db/schema";
import { checkBlocks } from "@/server/blocks-check";
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
  const checked = await checkBlocks(base.data.blocks);
  if (!checked.ok) return checked;
  const { projectId, locale } = base.data;
  const { blocks } = checked;

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
