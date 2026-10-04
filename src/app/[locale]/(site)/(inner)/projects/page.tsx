import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MotionTitle } from "@/components/site/MotionTitle";
import { ProjectList } from "@/components/site/ProjectList";
import { parseDisplay } from "@/content/display-text";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import {
  type ProjectsQuery,
  parseProjectsQuery,
  projectsHref,
} from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { pageMetadata } from "@/seo/metadata";
import {
  getCategories,
  getPublishedProjects,
  getSiteSettings,
} from "@/server/queries";
import styles from "./projects.module.css";

// Projects index page: published projects list/grid with category filters.
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  return pageMetadata({
    page: "projects",
    locale,
    title: dict.projects.title,
    siteName: settings.name,
    description: dict.projects.description,
  });
}

export default async function ProjectsPage({
  searchParams,
}: PageProps<"/[locale]/projects">) {
  const { locale, dict } = await getLocaleContext();
  const heading = parseDisplay(dict.projects.heading).flat();
  return (
    <div className={styles.page}>
      <MotionTitle className={styles.heading}>
        {heading.map((seg) =>
          seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
        )}
      </MotionTitle>
      <Suspense
        fallback={
          <ProjectsIndexView
            locale={locale}
            dict={dict}
            query={{ category: null, view: "list" }}
          />
        }
      >
        <ProjectsIndex
          locale={locale}
          dict={dict}
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}

async function ProjectsIndex({
  locale,
  dict,
  searchParams,
}: {
  locale: Locale;
  dict: Dictionary;
  searchParams: PageProps<"/[locale]/projects">["searchParams"];
}) {
  const query = parseProjectsQuery(locale, await searchParams);
  return <ProjectsIndexView locale={locale} dict={dict} query={query} />;
}

async function ProjectsIndexView({
  locale,
  dict,
  query,
}: {
  locale: Locale;
  dict: Dictionary;
  query: ProjectsQuery;
}) {
  const [projects, allCategories] = await Promise.all([
    getPublishedProjects(locale),
    getCategories(locale),
  ]);
  if (projects.length === 0)
    return <p className={styles.empty}>{dict.projects.empty}</p>;

  // Only display categories with at least one published project
  const categories = allCategories.filter((c) =>
    projects.some((p) => p.category?.slug === c.slug),
  );
  const active = categories.some((c) => c.slug === query.category)
    ? query.category
    : null;
  const shown = active
    ? projects.filter((p) => p.category?.slug === active)
    : projects;

  const countIn = (slug: string) =>
    projects.filter((p) => p.category?.slug === slug).length;

  return (
    <>
      <div className={styles.toolbar}>
        <nav aria-label={dict.projects.filterLabel}>
          <ul className={styles.pills}>
            <li>
              <Link
                href={projectsHref(locale, { view: query.view })}
                aria-current={active === null ? "page" : undefined}
                className={styles.pill}
              >
                {dict.projects.all} <sup>{projects.length}</sup>
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={projectsHref(locale, {
                    category: c.slug,
                    view: query.view,
                  })}
                  aria-current={active === c.slug ? "page" : undefined}
                  className={styles.pill}
                >
                  {c.name} <sup>{countIn(c.slug)}</sup>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.side}>
          <p aria-live="polite" className={styles.count}>
            {shown.length}{" "}
            {shown.length === 1
              ? dict.projects.countOne
              : dict.projects.countOther}
          </p>
          <nav aria-label={dict.projects.viewLabel}>
            <ul className={styles.toggle}>
              {(["list", "grid"] as const).map((view) => (
                <li key={view}>
                  <Link
                    href={projectsHref(locale, { category: active, view })}
                    aria-current={query.view === view ? "page" : undefined}
                    className={styles.toggleItem}
                  >
                    {dict.projects[view]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      {shown.length > 0 ? (
        <ProjectList
          key={`${active ?? "all"}-${query.view}`}
          projects={shown}
          locale={locale}
          view={query.view}
        />
      ) : (
        <p className={styles.empty}>{dict.projects.emptyFiltered}</p>
      )}
    </>
  );
}
