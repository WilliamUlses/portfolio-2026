import Link from "next/link";
import { Media } from "@/components/site/Media";
import type { Locale } from "@/i18n/config";
import { href } from "@/i18n/routes";
import type { NextProject as NextProjectType } from "@/server/queries";
import styles from "./NextProject.module.css";

// Monumental Next Project section for case studies.
// Pure Swiss editorial aesthetic: high-contrast typography, crisp frame, no glassmorphism abuse.

export function NextProject({
  next,
  locale,
  label,
  exploreLabel,
}: {
  next: NextProjectType;
  locale: Locale;
  label: string;
  exploreLabel: string;
}) {
  return (
    <aside className={styles.section} aria-label={label}>
      <Link
        href={href("project", locale, { slug: next.slug })}
        className={styles.link}
        data-transition-label={next.title}
        data-cursor="view"
      >
        <div className={styles.header}>
          <span className={styles.tag}>[ {label} ]</span>
          <span className={styles.meta}>
            [ {next.category?.name ? `${next.category.name} · ` : ""}
            {next.year} ]
          </span>
        </div>

        <div className={styles.content}>
          <h2 className={styles.title}>{next.title}</h2>

          {next.cover ? (
            <div className={styles.previewFrame}>
              <Media
                media={next.cover}
                sizes="(min-width: 1200px) 85vw, 100vw"
              />
            </div>
          ) : null}
        </div>

        <div className={styles.footer}>
          <span className={styles.cta}>
            <span>{exploreLabel}</span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </span>
        </div>
      </Link>
    </aside>
  );
}
