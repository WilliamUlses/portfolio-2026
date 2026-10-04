import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { href } from "@/i18n/routes";
import { selectionColors, selectionDarkColors } from "@/lib/color";
import type { ProjectSummary } from "@/server/queries";
import { SelectionSlider, type SlideData } from "./SelectionSlider";

// Home selection block: one full-screen project slide per item featuring prominent typography,
// project metadata, and responsive cover media styled with computed dynamic theme accents.
export function Selection({
  projects,
  locale,
  dict,
}: {
  projects: ProjectSummary[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (projects.length === 0) return null;
  const slides: SlideData[] = projects.map((p) => ({
    href: href("project", locale, { slug: p.slug }),
    title: p.title,
    meta: [p.category?.name, String(p.year), p.role]
      .filter(Boolean)
      .join(" · "),
    cover: p.cover && p.cover.kind !== "video" ? p.cover : null,
    colors: selectionColors(p.accentColor),
    darkColors: selectionDarkColors(p.accentColor),
  }));
  return (
    <SelectionSlider
      slides={slides}
      labels={{
        title: dict.home.selection,
        all: dict.home.allProjects,
        allHref: href("projects", locale),
        view: dict.home.view,
      }}
    />
  );
}
