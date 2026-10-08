"use client";

// Process timeline section: 5 project phases revealed on scroll.
// Interaction: hover → title weight jumps thin→fat + cobalt (Swiss DA pattern).
// Reveal: each row fades + translates into view on IntersectionObserver.

import { useEffect, useRef, useState } from "react";
import styles from "./ProcessTimeline.module.css";

export type ProcessStep = {
  index: string; // e.g. "01"
  label: string; // e.g. "[ Cadrage & Audit ]"
  duration: string; // e.g. "1 — 2 sem."
  title: string;
  text: string;
};

type Props = {
  steps: ProcessStep[];
  sectionLabel: string;
};

export function ProcessTimeline({ steps, sectionLabel }: Props) {
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [visible, setVisible] = useState<boolean[]>(() =>
    steps.map(() => false),
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    rowRefs.current.forEach((el, i) => {
      if (!el) return;

      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReduced) {
        setVisible((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry?.isIntersecting) {
            setVisible((prev) => {
              const next = [...prev];
              next[i] = true;
              return next;
            });
            observer.disconnect();
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      for (const o of observers) o.disconnect();
    };
  }, []);

  return (
    <section className={styles.section} aria-labelledby="processus">
      <header className={styles.head}>
        <h2 id="processus" className={styles.headLabel}>
          {sectionLabel}
        </h2>
        <span className={styles.headCount} aria-hidden="true">
          {String(steps.length).padStart(2, "0")}
        </span>
      </header>

      <ol className={styles.list}>
        {steps.map((step, i) => (
          <li
            key={step.index}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            className={[styles.row, visible[i] ? styles.rowVisible : ""].join(
              " ",
            )}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            {/* Left column: index + duration */}
            <div className={styles.meta}>
              <span className={styles.index} aria-hidden="true">
                {step.index}
              </span>
              <span className={styles.duration}>{step.duration}</span>
            </div>

            {/* Right column: label + title + text */}
            <div className={styles.content}>
              <p className={styles.label}>{step.label}</p>
              <p className={styles.title}>{step.title}</p>
              <p className={styles.text}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
