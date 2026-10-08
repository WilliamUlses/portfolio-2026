"use client";

import { useEffect, useRef, useState } from "react";
import { parseDisplay } from "@/content/display-text";
import type { Dictionary } from "@/i18n/get-dictionary";
import { whenStageReady } from "@/motion/stage-ready";
import styles from "./KeyMetrics.module.css";

export interface MetricItem {
  id: string;
  tag: string;
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  subtext?: string;
}

function MetricReelDigit({
  digit,
  active,
}: {
  digit: string;
  active: boolean;
}) {
  const target = Number(digit);
  const translateY = active ? -target * 10 : 0;

  return (
    <span className={styles.digitCol} aria-hidden="true">
      <span
        className={styles.digitReel}
        style={{
          transform: `translateY(${translateY}%)`,
        }}
      >
        {"0123456789".split("").map((num) => (
          <span key={num}>{num}</span>
        ))}
      </span>
    </span>
  );
}

function MetricNumber({
  metricId,
  value,
  prefix,
  suffix,
  active,
}: {
  metricId: string;
  value: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
}) {
  const digits = String(value)
    .split("")
    .map((digit, i) => ({
      id: `${metricId}-d${i}`,
      digit,
    }));

  return (
    <div className={styles.valueContainer}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <span className="sr-only">
        {prefix}
        {value}
        {suffix}
      </span>
      {digits.map((item) => (
        <MetricReelDigit key={item.id} digit={item.digit} active={active} />
      ))}
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </div>
  );
}

export function KeyMetrics({
  dict,
  metrics = [],
}: {
  dict: Dictionary;
  metrics?: MetricItem[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (!metrics || metrics.length === 0) return;
    const el = sectionRef.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setHasRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          whenStageReady(() => {
            setHasRevealed(true);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [metrics]);

  // Strict conditional rendering: if no metrics are configured, render nothing
  if (!metrics || metrics.length === 0) {
    return null;
  }

  const statement = parseDisplay(dict.home.metricsStatement).flat();
  const countStr = `(${String(metrics.length).padStart(2, "0")})`;

  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="key-metrics-title"
    >
      <header className={styles.head}>
        <h2 id="key-metrics-title" className={styles.label}>
          {dict.home.metricsLabel}
        </h2>
        <span className={styles.count}>{countStr}</span>
      </header>

      <div className={styles.intro}>
        <p className={styles.statement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        <p className={styles.lede}>{dict.home.metricsLede}</p>
      </div>

      <ul className={styles.grid}>
        {metrics.map((m, idx) => (
          <li key={m.id} className={styles.metricCol}>
            <div className={styles.colHeader}>
              <span>[ {String(idx + 1).padStart(2, "0")} ]</span>
              <span className={styles.colTag}>{m.tag}</span>
            </div>
            <MetricNumber
              metricId={m.id}
              value={m.value}
              prefix={m.prefix}
              suffix={m.suffix}
              active={hasRevealed}
            />
            <div>
              <p className={styles.metricLabel}>{m.label}</p>
              {m.subtext && <p className={styles.metricSubtext}>{m.subtext}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
