import type { Metadata } from "next";
import Link from "next/link";
import contactStyles from "@/components/site/home/Contact.module.css";
import { JournalThumbnail } from "@/components/site/JournalThumbnail";
import { JsonLd } from "@/components/site/JsonLd";
import { MotionTitle } from "@/components/site/MotionTitle";
import { parseDisplay } from "@/content/display-text";
import { formatPostDate } from "@/content/post-date";
import { href } from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { identityJsonLd } from "@/seo/identity";
import { blogJsonLd, breadcrumbJsonLd } from "@/seo/jsonld";
import { pageMetadata, rssAlternates } from "@/seo/metadata";
import { OG_SIZE } from "@/seo/og";
import { siteUrl } from "@/seo/site";
import { getPublishedPosts, getSiteSettings } from "@/server/queries";
import styles from "./journal.module.css";

// Journal index (Roadmap V2 3.2): Services-style intro, then project-index rows
// (date · title · topic · reading time), closing contact block.
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  const meta = pageMetadata({
    page: "journal",
    locale,
    title: dict.journal.title,
    siteName: settings.name,
    description: dict.journal.description,
  });
  return {
    ...meta,
    alternates: { ...meta.alternates, types: rssAlternates() },
  };
}

export default async function JournalPage() {
  const { locale, dict } = await getLocaleContext();
  const [posts, settings] = await Promise.all([
    getPublishedPosts(locale),
    getSiteSettings(),
  ]);
  const t = dict.journal;
  const base = siteUrl();
  const blogUrl = `${base}${href("journal", locale)}`;
  const postUrl = (slug: string) => `${base}${href("post", locale, { slug })}`;
  const jsonLd = [
    ...identityJsonLd(settings, locale),
    blogJsonLd({
      name: `${t.title} — ${settings.name}`,
      description: t.description,
      url: blogUrl,
      siteUrl: base,
      inLanguage: locale,
      authorName: settings.name,
      posts: posts.map((p) => ({
        headline: p.title,
        description: p.excerpt,
        url: postUrl(p.slug),
        datePublished: p.publishedAt,
        dateModified: p.updatedAt,
        image: { url: `${postUrl(p.slug)}/opengraph-image`, ...OG_SIZE },
        section: p.topic,
        wordCount: p.words,
        minutes: p.minutes,
      })),
    }),
    breadcrumbJsonLd([
      { name: dict.nav.home, url: `${base}${href("home", locale)}` },
      { name: t.title, url: blogUrl },
    ]),
  ];
  const statement = parseDisplay(t.statement).flat();
  const ctaTitle = parseDisplay(t.ctaTitle).flat();

  return (
    <div className={styles.page}>
      <JsonLd data={jsonLd} />
      <section className={styles.intro}>
        <header className={styles.head}>
          <span className={styles.label}>{t.title}</span>
          <span className={styles.count}>
            {String(posts.length).padStart(2, "0")} {t.count}
          </span>
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

      {posts.length === 0 ? (
        <p className={styles.empty}>{t.empty}</p>
      ) : (
        <ol className={styles.list}>
          {posts.map((p, i) => (
            <li key={p.slug}>
              <Link
                href={href("post", locale, { slug: p.slug })}
                className={styles.row}
                data-shared-scope
                data-transition-label={p.title}
              >
                <span className={styles.rowMeta}>
                  <time dateTime={p.publishedAt.toISOString()}>
                    {formatPostDate(p.publishedAt, locale)}
                  </time>
                  {p.topic ? <span>{p.topic}</span> : null}
                  <span>
                    {p.minutes} {t.minutes}
                  </span>
                </span>
                <span className={styles.body}>
                  <span className={styles.title}>{p.title}</span>
                  {p.excerpt ? (
                    <span className={styles.excerpt}>{p.excerpt}</span>
                  ) : null}
                </span>
                <span className={styles.thumb}>
                  <JournalThumbnail slug={p.slug} priority={i < 2} />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <section className={styles.closing} aria-labelledby="journal-cta">
        <h2 id="journal-cta" className={styles.closingStatement}>
          {ctaTitle.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </h2>
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
        </ul>
      </section>
    </div>
  );
}
