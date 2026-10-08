"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useRef, useState } from "react";
import styles from "./ProjectList.module.css";

// Cursor-following project cover preview on row hover.
// Pointer devices only, disabled under prefers-reduced-motion; aria-hidden.
// Row elements declare data-preview matching their index in covers.

export function ProjectPreview({
  covers,
  children,
}: {
  covers: ({ id: string; url: string } | null)[];
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const figRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    setEnabled(
      window.matchMedia(
        "(pointer: fine) and (prefers-reduced-motion: no-preference)",
      ).matches,
    );
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const fig = figRef.current;
    if (!enabled || !root || !fig) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let first = true;

    const loop = () => {
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      fig.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3)
        raf = requestAnimationFrame(loop);
      else raf = 0;
    };
    const onMove = (e: PointerEvent) => {
      const row = (e.target as Element).closest<HTMLElement>("[data-preview]");
      const i = row ? Number(row.dataset.preview) : null;
      setActive(i !== null && covers[i] ? i : null);
      // Position to right of cursor, vertically centered, clamped within viewport bounds.
      const w = fig.offsetWidth;
      const h = fig.offsetHeight;
      tx = Math.min(e.clientX + 32, window.innerWidth - w - 16);
      ty = Math.max(
        16,
        Math.min(e.clientY - h / 2, window.innerHeight - h - 16),
      );
      if (first) {
        x = tx;
        y = ty;
        first = false;
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      setActive(null);
      first = true;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, covers]);

  return (
    <div ref={rootRef}>
      {children}
      {enabled ? (
        <div
          ref={figRef}
          className={styles.preview}
          data-show={active !== null ? "" : undefined}
          aria-hidden="true"
        >
          {covers.map((c, i) =>
            c ? (
              <span
                key={c.id}
                className={styles.previewImage}
                data-active={active === i ? "" : undefined}
              >
                <Image src={c.url} alt="" fill sizes="28vw" />
              </span>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
