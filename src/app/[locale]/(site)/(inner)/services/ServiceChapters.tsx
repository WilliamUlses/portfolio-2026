"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { parseDisplay } from "@/content/display-text";
import styles from "./services.module.css";

// Cobalt full-bleed chapters (same mechanics as the About « Parcours »): a sticky
// mechanical counter on the left tracks the service in view; each service lists its
// detail rows and case-study cards (Lab card pattern).

export type ChapterCase = {
  slug: string;
  href: string;
  title: string;
  year: number;
  cover: string | null;
};

export type Chapter = {
  key: string;
  category: string;
  title: string;
  tagline: string;
  rows: { label: string; value: string }[];
  cases: ChapterCase[];
};

function Reel({ digit }: { digit: string }) {
  return (
    <span className={styles.col}>
      <span
        className={styles.reel}
        style={{ transform: `translateY(${-Number(digit) * 10}%)` }}
      >
        {"0123456789".split("").map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

export function ServiceChapters({
  chapters,
  label,
  casesLabel,
}: {
  chapters: Chapter[];
  label: string;
  casesLabel: string;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-chapter]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting)
            setActive(items.indexOf(e.target as HTMLElement));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of items) io.observe(el);
    list.dataset.live = "";
    return () => io.disconnect();
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  const current = pad(active + 1);
  const activeChapter = chapters[active];

  return (
    <section className={styles.chapters} aria-label={label} data-bg="dark">
      <div className={styles.aside}>
        <p className={styles.label}>{label}</p>
        <p className={styles.counter} aria-hidden="true">
          {current.split("").map((d, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 2 fixed digit positions
            <Reel key={i} digit={d} />
          ))}
        </p>
        <p className={styles.asideCategory} aria-hidden="true">
          {activeChapter?.category}
          <span>/ {pad(chapters.length)}</span>
        </p>
      </div>

      <ol ref={listRef} className={styles.chapterList}>
        {chapters.map((c, i) => (
          <li
            key={c.key}
            id={c.key}
            className={styles.chapter}
            data-chapter
            data-active={i === active ? "" : undefined}
          >
            <p className={styles.chapterMeta}>
              <span>{pad(i + 1)}</span>
              <span>{c.category}</span>
            </p>
            <h2 className={styles.chapterTitle}>
              {parseDisplay(c.title).map((line, n) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static lines
                <span key={n} className={styles.line}>
                  {line.map((seg) =>
                    seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
                  )}{" "}
                </span>
              ))}
            </h2>
            <p className={styles.tagline}>{c.tagline}</p>
            <dl className={styles.rows}>
              {c.rows.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
            {c.cases.length > 0 ? (
              <div className={styles.cases}>
                <p className={styles.casesHead}>
                  <span className={styles.label}>{casesLabel}</span>
                  <span>{pad(c.cases.length)}</span>
                </p>
                <ul className={styles.caseGrid}>
                  {c.cases.map((p, n) => (
                    <li key={p.slug} className={styles.case} data-cursor="view">
                      <Link
                        href={p.href}
                        className={styles.caseMedia}
                        tabIndex={-1}
                        aria-hidden="true"
                      >
                        {p.cover ? (
                          <Image
                            src={p.cover}
                            alt=""
                            fill
                            sizes="(min-width: 768px) 28vw, 90vw"
                          />
                        ) : null}
                      </Link>
                      <div className={styles.caseBody}>
                        <span className={styles.caseIndex} aria-hidden="true">
                          {pad(n + 1)}
                        </span>
                        <h3 className={styles.caseTitle}>
                          <Link href={p.href} data-transition-label={p.title}>
                            {p.title}
                          </Link>
                        </h3>
                        <span className={styles.caseYear}>{p.year}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
