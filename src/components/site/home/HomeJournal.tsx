import Link from "next/link";
import { JournalThumbnail } from "@/components/site/JournalThumbnail";
import { parseDisplay } from "@/content/display-text";
import { formatPostDate } from "@/content/post-date";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { href } from "@/i18n/routes";
import type { PostSummary } from "@/server/queries";
import styles from "./HomeJournal.module.css";

// Home journal showcase: replaces old tool suite with latest architectural notes and articles.
export function HomeJournal({
  posts,
  locale,
  dict,
}: {
  posts: PostSummary[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (posts.length === 0) return null;

  const statement = parseDisplay(dict.home.journalStatement).flat();
  const displayed = posts.slice(0, 3);

  return (
    <section className={styles.section} aria-labelledby="home-journal">
      <header className={styles.head}>
        <h2 id="home-journal" className={styles.label}>
          {dict.home.journalLabel}
        </h2>
        <Link href={href("journal", locale)} className={styles.allLink}>
          {dict.home.journalAll} ↗
        </Link>
      </header>

      <div className={styles.intro}>
        <p className={styles.statement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        <p className={styles.lede}>{dict.home.journalLede}</p>
      </div>

      <ol className={styles.grid}>
        {displayed.map((p, i) => {
          const postUrl = href("post", locale, { slug: p.slug });
          return (
            <li key={p.slug} className={styles.card}>
              <Link
                href={postUrl}
                className={styles.cardLink}
                data-shared-scope
                data-transition-label={p.title}
              >
                <div className={styles.thumbWrap}>
                  <JournalThumbnail
                    slug={p.slug}
                    alt={p.title}
                    priority={i === 0}
                  />
                </div>
                <div className={styles.meta}>
                  <time dateTime={p.publishedAt.toISOString()}>
                    {formatPostDate(p.publishedAt, locale)}
                  </time>
                  <span className={styles.metaDot}>·</span>
                  <span>
                    {p.minutes} {dict.journal.minutes}
                  </span>
                </div>
                <h3 className={styles.title}>{p.title}</h3>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
