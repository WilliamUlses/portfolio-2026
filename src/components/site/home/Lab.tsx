import Image from "next/image";
import Link from "next/link";
import { parseDisplay } from "@/content/display-text";
import { TOOL_SUITE } from "@/content/lab";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { href } from "@/i18n/routes";
import type { ProjectSummary } from "@/server/queries";
import styles from "./Lab.module.css";

// Home lab tool suite: 2x2 grid presentation of web utility experiments on cobalt background.
// Title links to internal case study; external button opens live tool.
export function Lab({
  projects,
  locale,
  dict,
}: {
  projects: ProjectSummary[];
  locale: Locale;
  dict: Dictionary;
}) {
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const tools = TOOL_SUITE.flatMap(({ slug, line }) => {
    const p = bySlug.get(slug);
    return p ? [{ p, line: line[locale] }] : [];
  });
  if (tools.length === 0) return null;
  const statement = parseDisplay(dict.home.toolsStatement).flat();

  return (
    <section className={styles.section} aria-labelledby="lab" data-bg="dark">
      <header className={styles.head}>
        <h2 id="lab" className={styles.label}>
          {dict.home.toolsLabel}
        </h2>
        <span className={styles.count}>
          {String(tools.length).padStart(2, "0")} {dict.home.toolsCount}
        </span>
      </header>
      <div className={styles.intro}>
        <p className={styles.statement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        <p className={styles.lede}>{dict.home.toolsLede}</p>
      </div>
      <ol className={styles.grid}>
        {tools.map(({ p, line }, i) => {
          const caseStudy = href("project", locale, { slug: p.slug });
          return (
            <li
              key={p.slug}
              className={styles.card}
              data-shared-scope
              data-cursor="view"
            >
              {/* Secondary click target hidden from tab order and screen readers */}
              <Link
                href={caseStudy}
                className={styles.media}
                tabIndex={-1}
                aria-hidden="true"
              >
                {p.cover && p.cover.kind !== "video" ? (
                  <Image
                    src={p.cover.url}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 47vw, 90vw"
                  />
                ) : null}
              </Link>
              <div className={styles.body}>
                <span className={styles.index} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className={styles.text}>
                  <h3 className={styles.title}>
                    <Link href={caseStudy}>{p.title}</Link>
                  </h3>
                  <p className={styles.line}>{line}</p>
                </div>
                {p.externalUrl ? (
                  <a
                    className={styles.open}
                    href={p.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${dict.home.openTool} ${p.title} (${dict.home.newTab})`}
                  >
                    {dict.home.openTool}
                    <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
