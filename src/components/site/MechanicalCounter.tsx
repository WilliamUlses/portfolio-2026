"use client";

import { useEffect, useRef } from "react";
import { whenStageReady } from "@/motion/stage-ready";
import styles from "./MechanicalCounter.module.css";

// Mechanical counter reel format: "[ 02 / 10 ]", each digit rolling from 0 to target on reveal.
// Accessible fallback text provided for screen readers and reduced motion.

function Reel({ digit }: { digit: string }) {
  return (
    <span className={styles.col}>
      <span
        className={styles.reel}
        data-digit={digit}
        style={{ transform: `translateY(${-Number(digit) * 10}%)` }}
      >
        {"0123456789".split("").map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

export function MechanicalCounter({
  value,
  total,
  className,
}: {
  value: number;
  total: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const a = String(value).padStart(2, "0");
  const b = String(total).padStart(2, "0");
  const left = [...a].map((d, i) => ({ key: `v${a.length - i}`, d }));
  const right = [...b].map((d, i) => ({ key: `t${b.length - i}`, d }));

  useEffect(() => {
    const root = ref.current;
    if (!root || !matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;
    const reels = [...root.querySelectorAll<HTMLElement>("[data-digit]")];
    // Reset to zero without transition before animating to target value.
    for (const r of reels) {
      r.style.transition = "none";
      r.style.transform = "translateY(0%)";
    }
    return whenStageReady(() => {
      reels.forEach((r, i) => {
        r.style.transition = "";
        r.style.transitionDelay = `${i * 70}ms`;
        r.style.transform = `translateY(${-Number(r.dataset.digit) * 10}%)`;
      });
    });
  }, []);

  return (
    <p ref={ref} className={className}>
      <span className="sr-only">
        {value} / {total}
      </span>
      <span aria-hidden="true" className={styles.counter}>
        [{" "}
        {left.map(({ key, d }) => (
          <Reel key={key} digit={d} />
        ))}
        <span className={styles.sep}>/</span>
        {right.map(({ key, d }) => (
          <Reel key={key} digit={d} />
        ))}{" "}
        ]
      </span>
    </p>
  );
}
