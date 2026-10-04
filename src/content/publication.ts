import { type Block, mediaRefs } from "./blocks";

// Publication validation rules:
// Requires cover image, complete French and English translations (title, summary, >= 1 block),
// and localized alt texts for all referenced media.
export type TranslationForRules =
  | { title: string; summary: string; blocks: Block[] }
  | undefined;

export type PublicationInput = {
  coverMediaId: string | null;
  previewMediaId: string | null;
  ogMediaId: string | null;
  fr: TranslationForRules;
  en: TranslationForRules;
  /** Known alt texts keyed by media ID: { fr, en } */
  alts: Map<string, { fr?: string; en?: string }>;
  /** Human-readable media names for validation messages */
  names: Map<string, string>;
};

const LOCALE_NAME = { fr: "français", en: "anglais" } as const;

export function publicationProblems(input: PublicationInput): string[] {
  const problems: string[] = [];
  if (!input.coverMediaId) problems.push("Aucune cover choisie.");

  for (const locale of ["fr", "en"] as const) {
    const t = input[locale];
    const name = LOCALE_NAME[locale];
    if (!t) {
      problems.push(`Pas de traduction en ${name}.`);
      continue;
    }
    if (!t.title.trim()) problems.push(`Titre manquant (${name}).`);
    if (!t.summary.trim()) problems.push(`Résumé manquant (${name}).`);
    if (t.blocks.length === 0)
      problems.push(`Aucun bloc de contenu (${name}).`);
  }

  const used = new Set<string>(
    [
      input.coverMediaId,
      input.previewMediaId,
      input.ogMediaId,
      ...mediaRefs(input.fr?.blocks ?? []).map((r) => r.id),
      ...mediaRefs(input.en?.blocks ?? []).map((r) => r.id),
    ].filter((id): id is string => Boolean(id)),
  );
  for (const id of used) {
    const alt = input.alts.get(id);
    const missing = [!alt?.fr?.trim() && "FR", !alt?.en?.trim() && "EN"].filter(
      Boolean,
    );
    if (missing.length) {
      problems.push(
        `Texte alternatif ${missing.join(" et ")} manquant : ${input.names.get(id) ?? id}.`,
      );
    }
  }
  return problems;
}
