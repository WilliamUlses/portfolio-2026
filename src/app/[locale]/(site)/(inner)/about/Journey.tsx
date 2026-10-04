"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./about.module.css";

// Career timeline: sticky mechanical counter reel on the left tracking active step in viewport.

type Step = {
  year: number;
  period: string;
  title: string;
  place: string;
  text: string;
};

export function Journey({ steps, label }: { steps: Step[]; label: string }) {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-step]")];
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

  const year = String(steps[active]?.year ?? "").padStart(4, "0");

  return (
    <section
      className={styles.journey}
      aria-labelledby="parcours"
      data-bg="dark"
    >
      <div className={styles.journeyAside}>
        <h2 id="parcours" className={styles.label}>
          {label}
        </h2>
        <p className={styles.year} aria-hidden="true">
          {year.split("").map((d, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: 4 fixed digit positions
            <span key={i} className={styles.col}>
              <span
                className={styles.reel}
                style={{ transform: `translateY(${-Number(d) * 10}%)` }}
              >
                {"0123456789".split("").map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          ))}
        </p>
      </div>
      <ol ref={listRef} className={styles.steps}>
        {steps.map((s, i) => (
          <li
            key={`${s.period}-${s.title}`}
            className={styles.step}
            data-step
            data-active={i === active ? "" : undefined}
          >
            <p className={styles.period}>{s.period}</p>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className={styles.place}>{s.place}</p>
            <p className={styles.stepText}>{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
