import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import type { Locale } from "@/i18n/config";
import { href, type ProjectsView } from "@/i18n/routes";
import { projectDarkThemeCss, projectThemeCss } from "@/lib/color";
import type { ProjectSummary } from "@/server/queries";
import { HoverTheme } from "./HoverTheme";
import styles from "./ProjectList.module.css";
import { ProjectPreview } from "./ProjectPreview";

// Projects list or grid view with hover previews and theme switching
export function ProjectList({
  projects,
  locale,
  view = "list",
}: {
  projects: ProjectSummary[];
  locale: Locale;
  view?: ProjectsView;
}) {
  const index = (i: number) => String(i + 1).padStart(2, "0");
  const cover = (p: ProjectSummary) =>
    p.cover && p.cover.kind !== "video" ? p.cover : null;

  if (view === "grid") {
    return (
      <HoverTheme>
        <ol className={styles.grid}>
          {projects.map((p, i) => {
            const c = cover(p);
            return (
              <li key={p.id} style={{ "--i": i } as CSSProperties}>
                <article
                  className={styles.card}
                  data-shared-scope
                  data-cursor="view"
                  data-theme={projectThemeCss(p.accentColor)}
                  data-dark-theme={projectDarkThemeCss(p.accentColor)}
                >
                  <span className={styles.media}>
                    {c ? (
                      <Image
                        src={c.url}
                        alt={c.alt}
                        fill
                        sizes="(min-width: 768px) 47vw, 90vw"
                      />
                    ) : null}
                  </span>
                  <div className={styles.cardBody}>
                    <span className={styles.index} aria-hidden="true">
                      {index(i)}
                    </span>
                    <div>
                      <h2 className={styles.cardTitle}>
                        <Link
                          href={href("project", locale, { slug: p.slug })}
                          className={styles.stretch}
                        >
                          {p.title}
                        </Link>
                      </h2>
                      <p className={styles.meta}>
                        {[p.category?.name, p.year].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={styles.arrow} aria-hidden="true">
                      ↗
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </HoverTheme>
    );
  }

  return (
    <HoverTheme>
      <ProjectPreview
        covers={projects.map((p) => {
          const c = cover(p);
          return c ? { id: p.id, url: c.url } : null;
        })}
      >
        <ol className={styles.list}>
          {projects.map((p, i) => (
            <li key={p.id} style={{ "--i": i } as CSSProperties}>
              <article
                className={styles.row}
                data-preview={i}
                data-cursor="none"
                data-theme={projectThemeCss(p.accentColor)}
                data-dark-theme={projectDarkThemeCss(p.accentColor)}
              >
                <span className={styles.index} aria-hidden="true">
                  {index(i)}
                </span>
                <h2 className={styles.title}>
                  <Link
                    href={href("project", locale, { slug: p.slug })}
                    className={styles.stretch}
                  >
                    {p.title}
                  </Link>
                </h2>
                <p className={styles.type}>{p.category?.name}</p>
                <p className={styles.year}>{p.year}</p>
                <span className={styles.arrow} aria-hidden="true">
                  ↗
                </span>
              </article>
            </li>
          ))}
        </ol>
      </ProjectPreview>
    </HoverTheme>
  );
}
