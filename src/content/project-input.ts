import { z } from "zod";
import "./zod-fr";

// Project input validation schemas.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

export const Slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "2 caractères minimum")
  .max(80, "80 caractères maximum")
  .regex(SLUG_RE, "minuscules, chiffres et tirets uniquement");

const currentYear = new Date().getFullYear();
export const Year = z.coerce
  .number()
  .int("année entière")
  .min(1990, "1990 minimum")
  .max(currentYear + 1, `${currentYear + 1} maximum`);

export const CreateProjectInput = z.object({
  slug: Slug,
  year: Year,
  titleFr: z.string().trim().min(1, "titre FR requis").max(160),
});

export const ProjectTranslationInput = z.object({
  title: z.string().trim().max(160),
  subtitle: optionalText(200),
  role: optionalText(120),
  summary: z.string().trim().max(600),
  seoTitle: optionalText(70),
  seoDescription: optionalText(160),
});

export const UpdateProjectInput = z.object({
  id: z.string().min(1),
  slug: Slug,
  year: Year,
  client: optionalText(120),
  categoryId: optionalText(64),
  tagIds: z.array(z.string().min(1)).max(20),
  accentColor: z.string().regex(HEX_RE, "format #RRGGBB"),
  externalUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .pipe(
      z.url({ protocol: /^https$/, error: "URL https:// attendue" }).nullable(),
    ),
  featured: z.boolean(),
  coverMediaId: optionalText(64),
  previewMediaId: optionalText(64),
  ogMediaId: optionalText(64),
  fr: ProjectTranslationInput.extend({
    title: z.string().trim().min(1, "titre FR requis").max(160),
  }),
  en: ProjectTranslationInput,
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectInput>;

// Typed Server Action result
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: "VALIDATION" | "SLUG_TAKEN" | "NOT_FOUND" | "CONFLICT";
      message: string;
      fieldErrors?: Record<string, string[]>;
    };
