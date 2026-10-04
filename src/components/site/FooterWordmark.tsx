"use client";

import { useEffect, useRef } from "react";
import { whileVisible } from "@/motion/gsap";
import styles from "./Footer.module.css";

// Interactive oversized wordmark: font-variation-settings interpolate smoothly based on cursor proximity.

const THIN = { wdth: 112.5, wght: 150 };
const FAT = { wdth: 125, wght: 800 };

export function FooterWordmark({
  first,
  last,
}: {
  first: string;
  last: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ok = window.matchMedia(
      "(pointer: fine) and (prefers-reduced-motion: no-preference)",
    ).matches;
    if (!ok) return;
    const letters = [...root.querySelectorAll<HTMLElement>("[data-l]")].map(
      (el) => ({ el, fat: el.dataset.l === "fat", t: 0 }),
    );
    let px = -1e4;
    let py = -1e4;
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const step = () => {
      const radius = window.innerWidth * 0.14;
      for (const l of letters) {
        const r = l.el.getBoundingClientRect();
        const d = Math.hypot(
          px - (r.left + r.width / 2),
          py - (r.top + r.height / 2),
        );
        const target = Math.max(0, 1 - d / radius);
        const next = l.t + (target - l.t) * 0.14;
        if (Math.abs(next - l.t) < 0.001) continue;
        l.t = next;
        const [from, to] = l.fat ? [FAT, THIN] : [THIN, FAT];
        const wdth = from.wdth + (to.wdth - from.wdth) * next;
        const wght = from.wght + (to.wght - from.wght) * next;
        l.el.style.fontVariationSettings = `"wdth" ${wdth.toFixed(1)}, "wght" ${wght.toFixed(0)}`;
      }
    };
    const stop = whileVisible(root, step);
    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      for (const l of letters)
        l.el.style.removeProperty("font-variation-settings");
    };
  }, []);

  const split = (word: string, kind: "thin" | "fat") =>
    [...word].map((ch, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: fixed static character positions
      <span key={i} data-l={kind}>
        {ch}
      </span>
    ));

  return (
    <p ref={ref} className={styles.wordmark} aria-hidden="true">
      <span className={styles.first}>{split(first, "thin")}</span>
      <span className={styles.last}>{split(last, "fat")}</span>
    </p>
  );
}
