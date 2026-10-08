import type { Locale } from "./config";
import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";

// Static dictionary types derived from fr.json. Type checking ensures parity between languages.
export type Dictionary = typeof fr;
const enChecked: Dictionary = en;

const dictionaries: Record<Locale, Dictionary> = { fr, en: enChecked };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
