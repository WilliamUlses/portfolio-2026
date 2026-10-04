import { type Locale, locales } from "./config";

// Localized route mapping between public localized URL segments and internal folders.
export type Page = "home" | "projects" | "project" | "about" | "contact";

/** Public URL segment per locale mapping to internal directory */
const SEGMENTS: Record<
  Exclude<Page, "home" | "project">,
  Record<Locale, string>
> = {
  projects: { fr: "projets", en: "projects" },
  about: { fr: "a-propos", en: "about" },
  contact: { fr: "contact", en: "contact" },
};
const REAL: Record<Exclude<Page, "home" | "project">, string> = {
  projects: "projects",
  about: "about",
  contact: "contact",
};

/** Constructs localized internal paths */
export function href(
  page: Page,
  locale: Locale,
  params?: { slug?: string },
): string {
  switch (page) {
    case "home":
      return `/${locale}`;
    case "project":
      if (!params?.slug) throw new Error("href(project): slug is required");
      return `/${locale}/${SEGMENTS.projects[locale]}/${encodeURIComponent(params.slug)}`;
    default:
      return `/${locale}/${SEGMENTS[page][locale]}`;
  }
}

type Resolution =
  | { kind: "ok"; internal: string }
  | { kind: "redirect"; to: string };

/**
 * Resolves a localized path to internal route, or redirects cross-language URLs.
 */
export function resolveLocalizedPath(
  locale: Locale,
  rest: string[],
): Resolution {
  const [first, ...tail] = rest;
  if (first === undefined) return { kind: "ok", internal: `/${locale}` };
  for (const page of Object.keys(SEGMENTS) as (keyof typeof SEGMENTS)[]) {
    const canonical = SEGMENTS[page][locale];
    const suffix = tail.length ? `/${tail.join("/")}` : "";
    if (first === canonical)
      return { kind: "ok", internal: `/${locale}/${REAL[page]}${suffix}` };
    const foreign = locales.some(
      (l) => l !== locale && SEGMENTS[page][l] === first,
    );
    if (foreign)
      return { kind: "redirect", to: `/${locale}/${canonical}${suffix}` };
  }
  return { kind: "ok", internal: `/${locale}/${rest.join("/")}` };
}

/** Returns the matching URL path when switching between languages */
export function switchLocalePath(pathname: string, target: Locale): string {
  const [, current, ...rest] = pathname.split("/");
  if (!current || !(locales as readonly string[]).includes(current))
    return `/${target}`;
  const [first, ...tail] = rest;
  if (!first) return `/${target}`;
  for (const page of Object.keys(SEGMENTS) as (keyof typeof SEGMENTS)[]) {
    if (locales.some((l) => SEGMENTS[page][l] === first)) {
      return `/${target}/${SEGMENTS[page][target]}${tail.length ? `/${tail.join("/")}` : ""}`;
    }
  }
  return `/${target}/${rest.join("/")}`;
}

// Project index URL query parameters and view states
export type ProjectsView = "list" | "grid";
const QUERY = {
  category: { fr: "categorie", en: "category" },
  view: { fr: "vue", en: "view" },
} as const;
const VIEW_VALUES: Record<ProjectsView, Record<Locale, string>> = {
  list: { fr: "liste", en: "list" },
  grid: { fr: "grille", en: "grid" },
};

export type ProjectsQuery = { category: string | null; view: ProjectsView };

export function projectsHref(
  locale: Locale,
  { category, view }: Partial<ProjectsQuery> = {},
): string {
  const params = new URLSearchParams();
  if (category) params.set(QUERY.category[locale], category);
  if (view && view !== "list")
    params.set(QUERY.view[locale], VIEW_VALUES[view][locale]);
  const query = params.toString();
  return `${href("projects", locale)}${query ? `?${query}` : ""}`;
}

/** Parses search query parameters into category and view filters */
export function parseProjectsQuery(
  locale: Locale,
  searchParams: Record<string, string | string[] | undefined>,
): ProjectsQuery {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const category = first(searchParams[QUERY.category[locale]]) ?? null;
  const viewValue = first(searchParams[QUERY.view[locale]]);
  const view =
    (Object.keys(VIEW_VALUES) as ProjectsView[]).find(
      (v) => VIEW_VALUES[v][locale] === viewValue,
    ) ?? "list";
  return { category: category || null, view };
}
