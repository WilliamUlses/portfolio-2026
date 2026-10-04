import type { Locale } from "@/i18n/config";

// Home tool suite metadata: lists utility projects shown in lab section with localized taglines.
export const TOOL_SUITE: { slug: string; line: Record<Locale, string> }[] = [
  {
    slug: "gradient-lab",
    line: { fr: "Générateur de dégradés CSS", en: "CSS gradient generator" },
  },
  {
    slug: "shadowlab",
    line: { fr: "Générateur d'ombres CSS", en: "CSS shadow generator" },
  },
  {
    slug: "unit-converter",
    line: { fr: "Convertisseur px, rem et em", en: "px, rem and em converter" },
  },
  {
    slug: "pomodoro",
    line: { fr: "Minuteur Pomodoro immersif", en: "Immersive Pomodoro timer" },
  },
];
