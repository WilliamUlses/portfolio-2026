import type { Locale } from "@/i18n/config";

// Journal dates: dd/mm/yyyy in both languages (Paris time).
export function formatPostDate(date: Date, locale: Locale): string {
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}
