import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton } from "@/components/site/BookingButton";
import contactStyles from "@/components/site/home/Contact.module.css";
import { MotionTitle } from "@/components/site/MotionTitle";
import { displayPlainText, parseDisplay } from "@/content/display-text";
import { getServices } from "@/content/services";
import { href } from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { pageMetadata } from "@/seo/metadata";
import { getPublishedProjects, getSiteSettings } from "@/server/queries";
import { type Chapter, ServiceChapters } from "./ServiceChapters";
import styles from "./services.module.css";

// Services page (Roadmap V2 — 3.1), built from the site's own patterns:
// intro (Lab header) → typographic index (project index rows) → cobalt chapters with
// sticky counter (About « Parcours ») → closing availability block (About).
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  return pageMetadata({
    page: "services",
    locale,
    title: dict.services.title,
    siteName: settings.name,
    description: dict.services.description,
  });
}

export default async function ServicesPage() {
  const { locale, dict } = await getLocaleContext();
  const projects = await getPublishedProjects(locale);
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const services = getServices(locale);
  const t = dict.services;
  const statement = parseDisplay(t.statement).flat();
  const ctaTitle = parseDisplay(t.ctaTitle).flat();
  const pad = (n: number) => String(n).padStart(2, "0");

  const chapters: Chapter[] = services.map((s) => ({
    key: s.key,
    category: s.category,
    title: s.title,
    tagline: s.tagline,
    rows: s.rows,
    cases: s.cases.flatMap((slug) => {
      const p = bySlug.get(slug);
      if (!p) return [];
      const cover =
        p.cover?.kind === "video"
          ? (p.cover.poster?.url ?? null)
          : (p.cover?.url ?? null);
      return [
        {
          slug: p.slug,
          href: href("project", locale, { slug: p.slug }),
          title: p.title,
          year: p.year,
          cover,
        },
      ];
    }),
  }));

  return (
    <div className={styles.page}>
      {/* Intro */}
      <section className={styles.intro}>
        <header className={styles.head}>
          <span className={styles.label}>{t.title}</span>
          <span className={styles.count}>{pad(services.length)}</span>
        </header>
        <div className={styles.introGrid}>
          <MotionTitle className={styles.statement}>
            {statement.map((seg) =>
              seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
            )}
          </MotionTitle>
          <p className={styles.lede}>{t.intro}</p>
        </div>
      </section>

      {/* Typographic index */}
      <nav className={styles.index} aria-label={t.index}>
        <ol>
          {services.map((s, i) => (
            <li key={s.key}>
              <a href={`#${s.key}`} className={styles.indexRow}>
                <span className={styles.indexNum}>{pad(i + 1)}</span>
                <span className={styles.indexTitle}>
                  {displayPlainText(s.title)}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Chapters */}
      <ServiceChapters
        chapters={chapters}
        label={t.details}
        casesLabel={t.cases}
      />

      {/* Closing */}
      <section className={styles.closing} aria-labelledby="services-cta">
        <h2 id="services-cta" className={styles.label}>
          {t.next}
        </h2>
        <p className={styles.closingStatement}>
          {ctaTitle.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        <ul className={contactStyles.links}>
          <li>
            <Link
              href={href("contact", locale)}
              className={`${contactStyles.pill} ${styles.primary}`}
            >
              <span>
                {t.cta}
                <span aria-hidden="true"> ↗</span>
              </span>
            </Link>
          </li>
          <li>
            <BookingButton
              label={dict.contact.bookCall}
              locale={locale}
              dict={dict.booking}
              className={contactStyles.pill}
            />
          </li>
          <li>
            <Link
              href={`${href("about", locale)}#processus`}
              className={contactStyles.pill}
            >
              <span>
                {t.process}
                <span aria-hidden="true"> →</span>
              </span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
