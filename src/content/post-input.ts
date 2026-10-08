import { z } from "zod";
import { Slug } from "./project-input";
import "./zod-fr";

// Journal post input validation schemas (Roadmap V2 3.2).
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

export const CreatePostInput = z.object({
  slug: Slug,
  titleFr: z.string().trim().min(1, "titre FR requis").max(160),
});

const PostTranslationInput = z.object({
  title: z.string().trim().max(160),
  excerpt: z.string().trim().max(400),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

export const UpdatePostInput = z.object({
  id: z.string().min(1),
  slug: Slug,
  topic: optionalText(40),
  coverMediaId: optionalText(64),
  fr: PostTranslationInput.extend({
    title: z.string().trim().min(1, "titre FR requis").max(160),
  }),
  en: PostTranslationInput,
});

export type PostPublicationInput = {
  fr: { title: string; excerpt: string; blocks: number } | null;
  en: { title: string; excerpt: string; blocks: number } | null;
};

/** Rules a post must satisfy before going live (both languages required). */
export function postPublicationProblems(p: PostPublicationInput): string[] {
  const problems: string[] = [];
  for (const [locale, t] of [
    ["FR", p.fr],
    ["EN", p.en],
  ] as const) {
    if (!t) {
      problems.push(`Traduction ${locale} manquante`);
      continue;
    }
    if (!t.title) problems.push(`Titre ${locale} manquant`);
    if (!t.excerpt) problems.push(`Chapeau ${locale} manquant`);
    if (t.blocks === 0) problems.push(`Contenu ${locale} vide`);
  }
  return problems;
}
