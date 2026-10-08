import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/JsonLd";
import { MechanicalCounter } from "@/components/site/MechanicalCounter";
import { Media } from "@/components/site/Media";
import { MotionTitle } from "@/components/site/MotionTitle";
import { NextProject } from "@/components/site/NextProject";
import { ProjectPeople } from "@/components/site/ProjectPeople";
import { Blocks } from "@/content/render";
import type { Locale } from "@/i18n/config";
import { href } from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { projectDarkThemeCss, projectThemeCss } from "@/lib/color";
import { breadcrumbJsonLd, creativeWorkJsonLd } from "@/seo/jsonld";
import { pageMetadata } from "@/seo/metadata";
import { siteUrl } from "@/seo/site";
import { exitPreview } from "@/server/actions/draft";
import {
  getProjectBySlug,
  getProjectDraft,
  getPublishedSlugs,
  getSiteSettings,
} from "@/server/queries";
import { ProjectTheme } from "./ProjectTheme";
import styles from "./project.module.css";
import { RevealShots } from "./RevealShots";

// Case study page: sticky left column with project metadata, right column with media gallery.

// Loads project record, bypassing cache in Draft Mode
async function loadProject(slug: string, locale: Locale) {
  const { isEnabled } = await draftMode();
  const project = isEnabled
    ? await getProjectDraft(slug, locale)
    : await getProjectBySlug(slug, locale);
  return { project, preview: isEnabled };
}

// Generate static params for published project slugs
const NO_PROJECT = "aucun-projet";
export async function generateStaticParams() {
  const slugs = await getPublishedSlugs();
  return (slugs.length ? slugs : [NO_PROJECT]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([
    params,
    getLocaleContext(),
  ]);
  const [{ project, preview }, settings] = await Promise.all([
    loadProject(slug, locale),
    getSiteSettings(),
  ]);
  if (!project) return {};
  return {
    ...pageMetadata({
      page: "project",
      locale,
      slug: project.slug,
      title: project.seoTitle || project.title,
      siteName: settings.name,
      description: project.seoDescription || project.summary,
    }),
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/[locale]/projects/[slug]">) {
  const [{ slug }, { locale, dict }] = await Promise.all([
    params,
    getLocaleContext(),
  ]);
  const [{ project, preview }, settings, slugs] = await Promise.all([
    loadProject(slug, locale),
    getSiteSettings(),
    getPublishedSlugs(),
  ]);
  if (!project) notFound();
  // 1-based index within published projects list
  const position = slugs.indexOf(project.slug);
  const t = dict.project;
  const base = siteUrl();
  const url = `${base}${href("project", locale, { slug: project.slug })}`;
  const jsonLd = [
    creativeWorkJsonLd({
      name: project.title,
      description: project.seoDescription || project.summary,
      url,
      siteUrl: base,
      creatorName: settings.name,
      year: project.year,
      image: project.cover?.url,
      keywords: project.tagNames,
      inLanguage: locale,
    }),
    breadcrumbJsonLd([
      { name: dict.nav.home, url: `${base}${href("home", locale)}` },
      { name: dict.nav.projects, url: `${base}${href("projects", locale)}` },
      { name: project.title, url },
    ]),
  ];
  const statusLabel = {
    draft: t.statusDraft,
    published: t.statusPublished,
    archived: t.statusArchived,
  }[project.status];

  const disciplines = [
    project.role,
    project.category?.name,
    ...project.tagNames,
  ].filter((d, i, all): d is string => Boolean(d) && all.indexOf(d) === i);

  return (
    <div className={styles.page}>
      <JsonLd data={jsonLd} />
      {/* Dynamic project theme CSS variables */}
      <ProjectTheme
        css={`
          .site:not(.dark):not([data-theme="dark"]) { ${projectThemeCss(project.accentColor)} }
          @media (prefers-color-scheme: dark) {
            .site:not([data-theme="light"]):not(.light) { ${projectDarkThemeCss(project.accentColor)} }
          }
          .site.dark, .site[data-theme="dark"] { ${projectDarkThemeCss(project.accentColor)} }
        `}
      />
      {preview ? (
        <aside role="status" className={styles.preview}>
          <p>
            {t.previewBanner} {t.previewStatus} {statusLabel}.
          </p>
          <form action={exitPreview}>
            <input type="hidden" name="id" value={project.id} />
            <button type="submit">{t.previewExit}</button>
          </form>
        </aside>
      ) : null}

      <article className={styles.layout}>
        <header className={styles.info} data-shared-fade>
          {position >= 0 ? (
            <MechanicalCounter
              className={styles.counter}
              value={position + 1}
              total={slugs.length}
            />
          ) : null}
          <MotionTitle className={styles.title} weight>
            {project.title}
          </MotionTitle>
          <div className={styles.meta}>
            <p className={styles.year}>[ {project.year} ]</p>
            <div className={styles.details}>
              {disciplines.length ? (
                <ul className={styles.disciplines} aria-label={t.details}>
                  {disciplines.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
              <p className={styles.summary}>{project.summary}</p>
              {project.externalUrl ? (
                <a
                  className={styles.visit}
                  href={project.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.visit}
                  <span aria-hidden="true"> ↗</span>
                </a>
              ) : null}
            </div>
          </div>
        </header>

        <RevealShots className={styles.gallery}>
          {project.cover ? (
            <div className={styles.shot} data-shared-target>
              <Media
                media={project.cover}
                sizes="(min-width: 768px) 56vw, 100vw"
                preload
              />
            </div>
          ) : null}
          <Blocks
            blocks={project.blocks}
            media={project.media}
            labels={{
              stats: t.stats,
              credits: t.credits,
              embed: {
                vimeo: t.embedVimeo,
                youtube: t.embedYoutube,
                figma: t.embedFigma,
              },
            }}
          />
          <ProjectPeople
            people={project.people}
            labels={{ team: t.team, website: t.teamWebsite }}
          />
        </RevealShots>
      </article>

      {project.next ? (
        <NextProject
          next={project.next}
          locale={locale}
          label={t.next}
          exploreLabel={t.exploreNext}
        />
      ) : null}
    </div>
  );
}
