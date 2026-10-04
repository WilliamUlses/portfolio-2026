"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { getPublicationProblems } from "@/server/admin/publication";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

type Status = (typeof projects.$inferSelect)["status"];

function invalidate(id: string) {
  updateTag(tags.project(id));
  updateTag(tags.projectsList);
  refresh();
}

// Publishes project if all validation rules pass; sets publishedAt on first publish.
export async function publishProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const problems = await getPublicationProblems(id);
  if (problems === null)
    return { ok: false, code: "NOT_FOUND", message: "Projet introuvable." };
  if (problems.length) {
    return {
      ok: false,
      code: "VALIDATION",
      message: `Publication refusée (${problems.length} point${problems.length > 1 ? "s" : ""} à régler).`,
      fieldErrors: { publication: problems },
    };
  }
  const [current] = await db
    .select({ publishedAt: projects.publishedAt })
    .from(projects)
    .where(eq(projects.id, id));
  const now = new Date();
  await db
    .update(projects)
    .set({
      status: "published",
      publishedAt: current?.publishedAt ?? now,
      updatedAt: now,
    })
    .where(eq(projects.id, id));
  invalidate(id);
  return { ok: true, data: undefined };
}

/** Updates project status to draft or archived. */
export async function setProjectStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({ id: z.string().min(1), status: z.enum(["draft", "archived"]) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success)
    return { ok: false, code: "VALIDATION", message: "Requête invalide." };
  const { id, status } = parsed.data as { id: string; status: Status };
  const res = await db
    .update(projects)
    .set({ status, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning({ id: projects.id });
  if (!res.length)
    return { ok: false, code: "NOT_FOUND", message: "Projet introuvable." };
  invalidate(id);
  return { ok: true, data: undefined };
}

// Reorders projects by updating sortOrder (0, 10, 20...) in a single transaction.
export async function reorderProjects(ids: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z.array(z.string().min(1)).min(1).max(500).safeParse(ids);
  if (!parsed.success || new Set(parsed.data).size !== parsed.data.length) {
    return { ok: false, code: "VALIDATION", message: "Liste invalide." };
  }
  const list = parsed.data;
  const all = await db.select({ id: projects.id }).from(projects);
  if (all.length !== list.length || !all.every((p) => list.includes(p.id))) {
    return {
      ok: false,
      code: "CONFLICT",
      message: "La liste des projets a changé entre-temps. Recharge la page.",
    };
  }
  await db.transaction(async (tx) => {
    for (const [index, id] of list.entries()) {
      await tx
        .update(projects)
        .set({ sortOrder: index * 10 })
        .where(eq(projects.id, id));
    }
  });
  for (const id of list) updateTag(tags.project(id));
  updateTag(tags.projectsList);
  refresh();
  return { ok: true, data: undefined };
}
