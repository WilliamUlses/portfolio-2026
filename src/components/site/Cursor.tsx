"use client";

import { useEffect, useRef } from "react";
import { onScrollProgress } from "@/motion/scroll-progress";
import styles from "./Cursor.module.css";

// Custom pointer follower: scroll progress ring and project hover pill.
// Active only on fine pointer devices, hidden during page transitions and preloader.

const R = 15;
const C = 2 * Math.PI * R;

export function Cursor({ viewLabel }: { viewLabel: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const arc = arcRef.current;
    if (!root || !arc) return;
    if (!matchMedia("(pointer: fine)").matches) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.dataset.on = "";

    let tx = -100;
    let ty = -100;
    let x = tx;
    let y = ty;
    let raf = 0;
    const loop = () => {
      const k = reduce ? 1 : 0.15;
      x += (tx - x) * k;
      y += (ty - y) * k;
      root.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf =
        Math.abs(tx - x) > 0.2 || Math.abs(ty - y) > 0.2
          ? requestAnimationFrame(loop)
          : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      root.dataset.visible = "";
      const target = e.target as Element | null;
      // Mode detection: "view" pill or "none"
      const zone = target
        ?.closest?.("[data-cursor]")
        ?.getAttribute("data-cursor");
      if (zone === "view" || zone === "none") root.dataset.mode = zone;
      else delete root.dataset.mode;
      if (target?.closest?.('[data-bg="dark"]')) root.dataset.dark = "";
      else delete root.dataset.dark;
      kick();
    };
    const onLeave = () => delete root.dataset.visible;
    const hide = () => {
      root.dataset.hidden = "";
    };
    const show = () => {
      delete root.dataset.hidden;
    };

    const stop = onScrollProgress((p) => {
      arc.style.strokeDashoffset = String(C * (1 - p));
    });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("wu:nav-start", hide);
    window.addEventListener("wu:nav-end", show);
    return () => {
      stop();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("wu:nav-start", hide);
      window.removeEventListener("wu:nav-end", show);
    };
  }, []);

  return (
    <div ref={rootRef} className={styles.cursor} aria-hidden="true">
      <svg
        className={styles.ring}
        viewBox="0 0 36 36"
        focusable="false"
        aria-hidden="true"
      >
        <circle className={styles.track} cx="18" cy="18" r={R} />
        <circle
          ref={arcRef}
          className={styles.arc}
          cx="18"
          cy="18"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C}
        />
      </svg>
      <span className={styles.pill}>{viewLabel}</span>
    </div>
  );
}
