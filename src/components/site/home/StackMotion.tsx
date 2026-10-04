"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { whileVisible } from "@/motion/gsap";
import styles from "./Stack.module.css";

// Center-weighted typography animation: interpolates variable font weight, width, opacity,
// and brand color intensity based on proximity to viewport centerline.
// Operates on native scroll without pinning; static full styling under prefers-reduced-motion.

const MOTION = "(prefers-reduced-motion: no-preference)";

export function StackMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const list = root?.querySelector("ul");
    if (!root || !list || !window.matchMedia(MOTION).matches) return;
    const items = [...list.querySelectorAll<HTMLElement>("[data-item]")];

    // Cache relative vertical centers, remeasured only on layout changes.
    let centers: number[] = [];
    let lineH = 1;
    const measure = () => {
      const top = list.getBoundingClientRect().top;
      centers = items.map((el) => {
        const r = el.getBoundingClientRect();
        return r.top - top + r.height / 2;
      });
      lineH = items[0]?.offsetHeight ?? 1;
      last = Number.NaN;
    };
    let last = Number.NaN;

    const step = () => {
      const top = list.getBoundingClientRect().top;
      const vh = window.innerHeight;
      const key = top * 10000 + vh;
      if (key === last) return;
      last = key;
      const mid = vh / 2;
      items.forEach((el, i) => {
        const dy = Math.abs(top + (centers[i] ?? 0) - mid);
        const f = Math.max(0, 1 - dy / lineH);
        const far = Math.min(1, dy / mid);
        const opacity = Math.max(f, 0.12 + 0.48 * (1 - far) ** 2);
        el.style.setProperty("--f", f.toFixed(3));
        el.style.opacity = opacity.toFixed(3);
        el.style.fontVariationSettings = `"wdth" ${(100 + 25 * f).toFixed(1)}, "wght" ${(200 + 580 * f).toFixed(0)}`;
      });
    };

    const ro = new ResizeObserver(measure);
    ro.observe(list);
    measure();
    root.dataset.live = "";
    const stop = whileVisible(root, step);

    return () => {
      stop();
      ro.disconnect();
      delete root.dataset.live;
      for (const el of items) {
        el.style.removeProperty("--f");
        el.style.removeProperty("opacity");
        el.style.removeProperty("font-variation-settings");
      }
    };
  }, []);

  return (
    <div ref={ref} className={styles.wheel}>
      {children}
    </div>
  );
}
