"use server";

import { and, eq, inArray, ne } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CreatePostInput, UpdatePostInput } from "@/content/post-input";
import type { ActionResult } from "@/content/project-input";
import { db } from "@/db/client";
import { media, posts, postTranslations } from "@/db/schema";
import { newId } from "@/lib/ids";
import { getPostProblems } from "@/server/admin/posts";
import { checkBlocks } from "@/server/blocks-check";
import { tags } from "@/server/cache-tags";
import { requireAdmin } from "@/server/session";

// Journal post Server Actions: create, update texts/meta, blocks, publication.

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
  message: "Ce slug est déjà utilisé par un autre article.",
  fieldErrors: { slug: ["déjà utilisé"] },
});

const isUniqueViolation = (err: unknown) => {
  const e = (err as { code?: string; cause?: { code?: string } }) ?? {};
  return (e.code ?? e.cause?.code) === "23505";
};

function invalidate(id: string) {
  updateTag(tags.post(id));
  updateTag(tags.postsList);
  refresh();
}

export async function createPost(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = CreatePostInput.safeParse({
    slug: formData.get("slug"),
    titleFr: formData.get("titleFr"),
  });
  if (!parsed.success) return validationError(parsed.error);
  const { slug, titleFr } = parsed.data;
  const id = newId();
  try {
    await db.transaction(async (tx) => {
      await tx.insert(posts).values({ id, slug });
      await tx
        .insert(postTranslations)
        .values({ postId: id, locale: "fr", title: titleFr });
    });
  } catch (err) {
    if (isUniqueViolation(err)) return slugTaken();
    throw err;
  }
  updateTag(tags.postsList);
  redirect(`/admin/journal/${id}`);
}

export async function updatePost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const text = (name: string) => String(formData.get(name) ?? "");
  const translation = (l: "fr" | "en") => ({
    title: text(`${l}.title`),
    excerpt: text(`${l}.excerpt`),
    seoTitle: text(`${l}.seoTitle`),
    seoDescription: text(`${l}.seoDescription`),
  });
  const parsed = UpdatePostInput.safeParse({
    id: text("id"),
    slug: text("slug"),
    topic: text("topic"),
    coverMediaId: text("coverMediaId"),
    fr: translation("fr"),
    en: translation("en"),
  });
  if (!parsed.success) return validationError(parsed.error);
  const data = parsed.data;

  if (data.coverMediaId) {
    const [cover] = await db
      .select({ kind: media.kind })
      .from(media)
      .where(inArray(media.id, [data.coverMediaId]));
    if (!cover || cover.kind === "video") {
      return {
        ok: false,
        code: "VALIDATION",
        message: "Média refusé : image de couverture introuvable.",
      };
    }
  }

  const [taken] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, data.slug), ne(posts.id, data.id)));
  if (taken) return slugTaken();

  const now = new Date();
  try {
    const found = await db.transaction(async (tx) => {
      const res = await tx
        .update(posts)
        .set({
          slug: data.slug,
          topic: data.topic,
          coverMediaId: data.coverMediaId,
          updatedAt: now,
        })
        .where(eq(posts.id, data.id))
        .returning({ id: posts.id });
      if (!res.length) return false;
      for (const locale of ["fr", "en"] as const) {
        const t = data[locale];
        // EN stays optional until it has a title
        if (locale === "en" && !t.title) continue;
        const values = { ...t, updatedAt: now };
        await tx
          .insert(postTranslations)
          .values({ postId: data.id, locale, ...values })
          .onConflictDoUpdate({
            target: [postTranslations.postId, postTranslations.locale],
            set: values,
          });
      }
      return true;
    });
    if (!found)
      return { ok: false, code: "NOT_FOUND", message: "Article introuvable." };
  } catch (err) {
    if (isUniqueViolation(err)) return slugTaken();
    throw err;
  }
  invalidate(data.id);
  return { ok: true, data: undefined };
}

const BlocksInput = z.object({
  projectId: z.string().min(1),
  locale: z.enum(["fr", "en"]),
  blocks: z.unknown(),
});

/** Same contract as updateBlocks (projects) so BlocksEditor can use either. */
export async function updatePostBlocks(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const base = BlocksInput.safeParse(input);
  if (!base.success)
    return { ok: false, code: "VALIDATION", message: "Requête invalide." };
  const checked = await checkBlocks(base.data.blocks);
  if (!checked.ok) return checked;
  const { projectId: postId, locale } = base.data;
  const now = new Date();
  const res = await db
    .update(postTranslations)
    .set({ blocks: checked.blocks, updatedAt: now })
    .where(
      and(
        eq(postTranslations.postId, postId),
        eq(postTranslations.locale, locale),
      ),
    )
    .returning({ postId: postTranslations.postId });
  if (!res.length) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message:
        locale === "en"
          ? "Pas de traduction anglaise : saisis d'abord un titre EN."
          : "Article introuvable.",
    };
  }
  await db.update(posts).set({ updatedAt: now }).where(eq(posts.id, postId));
  invalidate(postId);
  return { ok: true, data: undefined };
}

export async function publishPost(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const problems = await getPostProblems(id);
  if (problems === null)
    return { ok: false, code: "NOT_FOUND", message: "Article introuvable." };
  if (problems.length) {
    return {
      ok: false,
      code: "VALIDATION",
      message: `Publication refusée (${problems.length} point${problems.length > 1 ? "s" : ""} à régler).`,
      fieldErrors: { publication: problems },
    };
  }
  const [current] = await db
    .select({ publishedAt: posts.publishedAt })
    .from(posts)
    .where(eq(posts.id, id));
  const now = new Date();
  await db
    .update(posts)
    .set({
      status: "published",
      publishedAt: current?.publishedAt ?? now,
      updatedAt: now,
    })
    .where(eq(posts.id, id));
  invalidate(id);
  return { ok: true, data: undefined };
}

export async function setPostStatus(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({ id: z.string().min(1), status: z.enum(["draft", "archived"]) })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success)
    return { ok: false, code: "VALIDATION", message: "Requête invalide." };
  const { id, status } = parsed.data;
  const res = await db
    .update(posts)
    .set({ status, updatedAt: new Date() })
    .where(eq(posts.id, id))
    .returning({ id: posts.id });
  if (!res.length)
    return { ok: false, code: "NOT_FOUND", message: "Article introuvable." };
  invalidate(id);
  return { ok: true, data: undefined };
}
