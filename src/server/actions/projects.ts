"use server";

import { and, eq, inArray, max, ne } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import {
  type ActionResult,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/content/project-input";
import { db } from "@/db/client";
import {
  media,
  projects,
  projectTags,
  projectTranslations,
  slugRedirects,
} from "@/db/schema";
import { newId } from "@/lib/ids";
import { COVER_MIN_WIDTH } from "@/media/constants";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

// Project management Server Actions (creation, metadata update, slug redirects)

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

const slugTaken = (): ActionResult<never> => ({
  ok: false,
  code: "SLUG_TAKEN",
  message: "Ce slug est déjà utilisé par un autre projet.",
  fieldErrors: { slug: ["déjà utilisé"] },
});

/** Extracts Postgres error code from error or cause chain. */
function pgCode(err: unknown): string | undefined {
  const e = (err as { code?: string; cause?: { code?: string } }) ?? {};
  return e.code ?? e.cause?.code;
}
/** Checks for Postgres unique violation code 23505. */
const isUniqueViolation = (err: unknown) => pgCode(err) === "23505";
/** Checks for Postgres foreign key violation code 23503. */
const isForeignKeyViolation = (err: unknown) => pgCode(err) === "23503";

export async function createProject(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = CreateProjectInput.safeParse({
    slug: formData.get("slug"),
    year: formData.get("year"),
    titleFr: formData.get("titleFr"),
  });
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  const id = newId();
  try {
    await db.transaction(async (tx) => {
      const [taken] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, data.slug));
      if (taken) throw new SlugTakenError();
      const [last] = await tx
        .select({ value: max(projects.sortOrder) })
        .from(projects);
      await tx.insert(projects).values({
        id,
        slug: data.slug,
        year: data.year,
        sortOrder: (last?.value ?? -10) + 10,
      });
      await tx.insert(projectTranslations).values({
        projectId: id,
        locale: "fr",
        title: data.titleFr,
        summary: "",
      });
      // New project reuses slug: remove former redirect pointing to another project
      await tx
        .delete(slugRedirects)
        .where(eq(slugRedirects.fromSlug, data.slug));
    });
  } catch (err) {
    if (err instanceof SlugTakenError || isUniqueViolation(err))
      return slugTaken();
    throw err;
  }

  updateTag(tags.projectsList);
  updateTag(tags.project(id));
  redirect(`/admin/projets/${id}`);
}

class SlugTakenError extends Error {}
class NotFoundError extends Error {}
class EnTitleRequiredError extends Error {}
class MediaChoiceError extends Error {}

/** Parses FormData from project edit form. */
function readUpdateForm(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");
  const translation = (locale: "fr" | "en") => ({
    title: text(`${locale}.title`),
    subtitle: text(`${locale}.subtitle`),
    role: text(`${locale}.role`),
    summary: text(`${locale}.summary`),
    seoTitle: text(`${locale}.seoTitle`),
    seoDescription: text(`${locale}.seoDescription`),
  });
  return {
    id: text("id"),
    slug: text("slug"),
    year: text("year"),
    client: text("client"),
    categoryId: text("categoryId"),
    tagIds: formData.getAll("tagIds").map(String),
    accentColor: text("accentColor"),
    externalUrl: text("externalUrl"),
    featured: formData.get("featured") === "on",
    coverMediaId: text("coverMediaId"),
    previewMediaId: text("previewMediaId"),
    ogMediaId: text("ogMediaId"),
    fr: translation("fr"),
    en: translation("en"),
  };
}

export async function updateProject(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = UpdateProjectInput.safeParse(readUpdateForm(formData));
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ slug: projects.slug })
        .from(projects)
        .where(eq(projects.id, data.id));
      if (!current) throw new NotFoundError();

      // Validate media attachments: kind check and cover width constraint
      const chosen = [
        data.coverMediaId,
        data.previewMediaId,
        data.ogMediaId,
      ].filter((v): v is string => Boolean(v));
      const found = chosen.length
        ? await tx
            .select({ id: media.id, kind: media.kind, width: media.width })
            .from(media)
            .where(inArray(media.id, chosen))
        : [];
      const byId = new Map(found.map((m) => [m.id, m]));
      const cover = data.coverMediaId ? byId.get(data.coverMediaId) : undefined;
      const preview = data.previewMediaId
        ? byId.get(data.previewMediaId)
        : undefined;
      const og = data.ogMediaId ? byId.get(data.ogMediaId) : undefined;
      if (data.coverMediaId && (!cover || cover.kind === "video")) {
        throw new MediaChoiceError("cover : image introuvable");
      }
      if (cover && cover.kind === "image" && cover.width < COVER_MIN_WIDTH) {
        throw new MediaChoiceError(
          `cover trop petite (${cover.width} px, ${COVER_MIN_WIDTH} px minimum)`,
        );
      }
      if (data.previewMediaId && preview?.kind !== "video") {
        throw new MediaChoiceError("vidéo de survol : vidéo introuvable");
      }
      if (data.ogMediaId && og?.kind !== "image") {
        throw new MediaChoiceError("image de partage : image introuvable");
      }

      if (data.slug !== current.slug) {
        const [taken] = await tx
          .select({ id: projects.id })
          .from(projects)
          .where(and(eq(projects.slug, data.slug), ne(projects.id, data.id)));
        if (taken) throw new SlugTakenError();
        // Former slug points permanently to current project ID (308 redirect)
        await tx
          .insert(slugRedirects)
          .values({ fromSlug: current.slug, projectId: data.id })
          .onConflictDoUpdate({
            target: slugRedirects.fromSlug,
            set: { projectId: data.id },
          });
        await tx
          .delete(slugRedirects)
          .where(eq(slugRedirects.fromSlug, data.slug));
      }

      const now = new Date();
      await tx
        .update(projects)
        .set({
          slug: data.slug,
          year: data.year,
          client: data.client,
          categoryId: data.categoryId,
          accentColor: data.accentColor.toUpperCase(),
          externalUrl: data.externalUrl,
          featured: data.featured,
          coverMediaId: data.coverMediaId,
          previewMediaId: data.previewMediaId,
          ogMediaId: data.ogMediaId,
          updatedAt: now,
        })
        .where(eq(projects.id, data.id));

      for (const locale of ["fr", "en"] as const) {
        const t = data[locale];
        // EN translation remains optional until publication
        if (locale === "en" && !t.title) {
          const [existing] = await tx
            .select({ locale: projectTranslations.locale })
            .from(projectTranslations)
            .where(
              and(
                eq(projectTranslations.projectId, data.id),
                eq(projectTranslations.locale, "en"),
              ),
            );
          if (existing) throw new EnTitleRequiredError();
          continue;
        }
        const values = {
          title: t.title,
          subtitle: t.subtitle,
          role: t.role,
          summary: t.summary,
          seoTitle: t.seoTitle,
          seoDescription: t.seoDescription,
          updatedAt: now,
        };
        await tx
          .insert(projectTranslations)
          .values({ projectId: data.id, locale, ...values })
          .onConflictDoUpdate({
            target: [projectTranslations.projectId, projectTranslations.locale],
            set: values,
          });
      }

      await tx.delete(projectTags).where(eq(projectTags.projectId, data.id));
      if (data.tagIds.length) {
        await tx
          .insert(projectTags)
          .values(data.tagIds.map((tagId) => ({ projectId: data.id, tagId })));
      }
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      return { ok: false, code: "NOT_FOUND", message: "Projet introuvable." };
    }
    if (err instanceof SlugTakenError || isUniqueViolation(err))
      return slugTaken();
    if (err instanceof MediaChoiceError) {
      return {
        ok: false,
        code: "VALIDATION",
        message: `Média refusé : ${err.message}.`,
      };
    }
    if (err instanceof EnTitleRequiredError) {
      return {
        ok: false,
        code: "VALIDATION",
        message:
          "La traduction anglaise existe : son titre ne peut pas être vide.",
        fieldErrors: { "en.title": ["titre EN requis (traduction existante)"] },
      };
    }
    if (isForeignKeyViolation(err)) {
      return {
        ok: false,
        code: "CONFLICT",
        message:
          "Catégorie ou tag introuvable (supprimé entre-temps ?). Recharge la page.",
      };
    }
    throw err;
  }

  updateTag(tags.project(data.id));
  updateTag(tags.projectsList);
  refresh();
  return { ok: true, data: undefined };
}
