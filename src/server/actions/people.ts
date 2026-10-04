"use server";

import { eq, inArray } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import type { z } from "zod";
import {
  githubLogin,
  PersonInput,
  ProjectPeopleInput,
  UpdatePersonInput,
} from "@/content/people-input";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import {
  media,
  mediaTranslations,
  people,
  projectPeople,
  projects,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { fetchGithubAvatar, GithubAvatarError } from "@/media/github-avatar";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

// Collaborator management Server Actions (CRUD, project association, GitHub avatar import)

function validationError(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return {
    ok: false,
    code: "VALIDATION",
    message: "Certains champs sont invalides.",
    fieldErrors,
  };
}

const personFields = (formData: FormData) => ({
  name: String(formData.get("name") ?? ""),
  githubUrl: String(formData.get("githubUrl") ?? ""),
  linkedinUrl: String(formData.get("linkedinUrl") ?? ""),
  websiteUrl: String(formData.get("websiteUrl") ?? ""),
  photoMediaId: String(formData.get("photoMediaId") ?? ""),
});

/** Validates that photo ID references an image or SVG asset. */
async function photoIsValid(id: string | null): Promise<boolean> {
  if (!id) return true;
  const [row] = await db
    .select({ kind: media.kind })
    .from(media)
    .where(eq(media.id, id));
  return row?.kind === "image" || row?.kind === "svg";
}
const badPhoto: ActionResult<never> = {
  ok: false,
  code: "VALIDATION",
  message: "La photo doit être une image de la médiathèque.",
  fieldErrors: { photoMediaId: ["image requise"] },
};

/** Revalidates all project pages where the collaborator appears. */
async function invalidatePersonProjects(personId: string) {
  const rows = await db
    .select({ projectId: projectPeople.projectId })
    .from(projectPeople)
    .where(eq(projectPeople.personId, personId));
  for (const r of rows) updateTag(tags.project(r.projectId));
}

export async function createPerson(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = PersonInput.safeParse(personFields(formData));
  if (!parsed.success) return validationError(parsed.error);
  if (!(await photoIsValid(parsed.data.photoMediaId))) return badPhoto;
  const id = newId();
  await db.insert(people).values({ id, ...parsed.data });
  refresh();
  return { ok: true, data: undefined };
}

export async function updatePerson(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = UpdatePersonInput.safeParse({
    id: String(formData.get("id") ?? ""),
    ...personFields(formData),
  });
  if (!parsed.success) return validationError(parsed.error);
  if (!(await photoIsValid(parsed.data.photoMediaId))) return badPhoto;
  const { id, ...values } = parsed.data;
  const updated = await db
    .update(people)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(people.id, id))
    .returning({ id: people.id });
  if (!updated.length)
    return { ok: false, code: "NOT_FOUND", message: "Personne introuvable." };
  await invalidatePersonProjects(id);
  refresh();
  return { ok: true, data: undefined };
}

/**
 * Imports a GitHub avatar to blob storage and adds it to media library with localized alt text.
 */
export async function importGithubPhoto(input: {
  githubUrl: string;
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const githubUrl = String(input.githubUrl ?? "").trim();
  const name = String(input.name ?? "")
    .trim()
    .slice(0, 100);
  if (!githubLogin(githubUrl))
    return {
      ok: false,
      code: "VALIDATION",
      message:
        "Saisissez d'abord un lien GitHub valide (https://github.com/…).",
      fieldErrors: { githubUrl: ["lien GitHub (github.com) attendu"] },
    };
  let avatar: Awaited<ReturnType<typeof fetchGithubAvatar>>;
  try {
    avatar = await fetchGithubAvatar(githubUrl);
  } catch (error) {
    if (error instanceof GithubAvatarError)
      return { ok: false, code: "NOT_FOUND", message: error.message };
    throw error;
  }
  const who = name || (githubLogin(githubUrl) as string);
  await db.transaction(async (tx) => {
    await tx.insert(media).values({
      id: avatar.id,
      kind: "image",
      url: avatar.url,
      pathname: avatar.pathname,
      mimeType: "image/webp",
      fileSize: avatar.fileSize,
      width: avatar.width,
      height: avatar.height,
      thumbhash: avatar.thumbhash,
      dominantColor: avatar.dominantColor,
      originalName: avatar.originalName,
    });
    await tx.insert(mediaTranslations).values([
      { mediaId: avatar.id, locale: "fr", altText: `Photo de ${who}` },
      { mediaId: avatar.id, locale: "en", altText: `Photo of ${who}` },
    ]);
  });
  refresh();
  return { ok: true, data: { id: avatar.id } };
}

// Removes collaborator and cascades removal from project associations.
export async function deletePerson(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await invalidatePersonProjects(id);
  const deleted = await db
    .delete(people)
    .where(eq(people.id, id))
    .returning({ id: people.id });
  if (!deleted.length)
    return { ok: false, code: "NOT_FOUND", message: "Personne introuvable." };
  refresh();
  return { ok: true, data: undefined };
}

/** Updates project collaborator roster in specified sort order. */
export async function setProjectPeople(
  input: ProjectPeopleInput,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = ProjectPeopleInput.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);
  const { projectId, people: team } = parsed.data;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId));
  if (!project)
    return { ok: false, code: "NOT_FOUND", message: "Projet introuvable." };
  if (team.length) {
    const found = await db
      .select({ id: people.id })
      .from(people)
      .where(
        inArray(
          people.id,
          team.map((p) => p.personId),
        ),
      );
    if (found.length !== team.length)
      return {
        ok: false,
        code: "CONFLICT",
        message:
          "Une personne a été supprimée entre-temps : rechargez la page.",
      };
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(projectPeople)
      .where(eq(projectPeople.projectId, projectId));
    if (team.length)
      await tx.insert(projectPeople).values(
        team.map((p, i) => ({
          projectId,
          personId: p.personId,
          sortOrder: i,
          roleFr: p.roleFr,
          roleEn: p.roleEn,
        })),
      );
  });
  updateTag(tags.project(projectId));
  refresh();
  return { ok: true, data: undefined };
}
