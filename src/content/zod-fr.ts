import { z } from "zod";

// French validation locale configuration for Zod schemas across client and server.
z.config(z.locales.fr());

// Human-readable labels for error paths (e.g. "items.0.label" -> "ligne 1 — libellé")
const FIELD_LABELS: Record<string, string> = {
  value: "valeur",
  label: "libellé",
  role: "rôle",
  name: "nom",
  url: "lien",
  mediaId: "média",
  mediaIds: "images",
  text: "texte",
  doc: "texte",
  caption: "légende",
  author: "auteur",
  items: "",
  provider: "fournisseur",
  columns: "colonnes",
  layout: "mise en page",
};

export function readablePath(path: string): string {
  const parts = path
    .split(".")
    .filter(Boolean)
    .map((p) =>
      /^\d+$/.test(p) ? `ligne ${Number(p) + 1}` : (FIELD_LABELS[p] ?? p),
    )
    .filter(Boolean);
  return parts.join(" — ") || "bloc";
}
