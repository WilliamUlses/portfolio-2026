"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import styles from "./About.module.css";

// Home about section animations:
// - AboutVisual: 3D glass monogram (Three.js, lazy-loaded near viewport, renders only when visible).
//   Static image fallback applies on mobile, reduced motion, or WebGL unavailability.
// - AboutText: masked line reveals using SplitText triggered on scroll enter.

const MOTION = "(prefers-reduced-motion: no-preference)";
const WIDE = "(min-width: 768px)";

export function AboutVisual({ fallback }: { fallback: ReactNode }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!window.matchMedia(`${MOTION} and ${WIDE}`).matches) return;
    let disposed = false;
    let scene: import("@/motion/webgl/glass-monogram").GlassMonogram | null =
      null;
    let visible: IntersectionObserver | null = null;

    // Preload one viewport height prior to section arrival.
    const near = new IntersectionObserver(
      async ([entry]) => {
        if (!entry?.isIntersecting) return;
        near.disconnect();
        const { mountGlassMonogram } = await import(
          "@/motion/webgl/glass-monogram"
        );
        if (disposed) return;
        scene = mountGlassMonogram(host, { animate: true });
        if (!scene) return;
        setLive(true);
        visible = new IntersectionObserver(([e]) => {
          if (e?.isIntersecting) scene?.start();
          else scene?.stop();
        });
        visible.observe(host);
      },
      { rootMargin: "100% 0px" },
    );
    near.observe(host);

    return () => {
      disposed = true;
      near.disconnect();
      visible?.disconnect();
      scene?.dispose();
      setLive(false);
    };
  }, []);

  return (
    <div className={styles.visual} data-live={live ? "" : undefined}>
      <div className={styles.fallback}>{fallback}</div>
      <div ref={hostRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}

export function AboutText({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !window.matchMedia(MOTION).matches) return;
    let ctx: gsap.Context | null = null;
    let cancelled = false;
    void (async () => {
      const { SplitText } = await import("gsap/SplitText");
      if (cancelled) return;
      gsap.registerPlugin(SplitText);
      await document.fonts.ready;
      if (cancelled) return;
      ctx = gsap.context(() => {
        const statement = root.querySelector<HTMLElement>("[data-statement]");
        const rest = root.querySelectorAll<HTMLElement>("[data-rest]");
        if (!statement) return;
        SplitText.create(statement, {
          type: "lines",
          mask: "lines",
          // Preserve natural text reading order for screen readers
          aria: "none",
          autoSplit: true,
          onSplit: (self) =>
            gsap
              .timeline({
                scrollTrigger: { trigger: root, start: "top 75%", once: true },
              })
              .from(self.lines, {
                yPercent: 110,
                duration: 0.9,
                stagger: 0.08,
                ease: "expo.out",
              })
              .from(
                rest,
                {
                  autoAlpha: 0,
                  y: 24,
                  duration: 0.8,
                  stagger: 0.08,
                  ease: "power3.out",
                },
                "-=0.5",
              ),
        });
      }, root);
      ScrollTrigger.refresh();
    })();
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={ref} className={styles.text}>
      {children}
    </div>
  );
}
