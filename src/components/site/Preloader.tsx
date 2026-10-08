"use client";

import { useEffect, useRef, useState } from "react";
import { LOADER_KEY } from "@/design/boot";
import { gsap } from "@/motion/gsap";
import { Monogram } from "./Monogram";
import styles from "./Preloader.module.css";

// Initial session preloader curtain tracking font loading, critical above-the-fold images, and WebGL hero assets.
const MIN_MS = 700;
const MAX_MS = 2200;

function track(promises: Promise<unknown>[], onStep: () => void) {
  return promises.map((p) => p.catch(() => undefined).then(onStep));
}

export function Preloader({ name, label }: { name: string; label: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current;
    const count = countRef.current;
    if (!root || !count || !("loader" in html.dataset)) {
      setDone(true);
      return;
    }
    const start = performance.now();
    const home = /^\/(fr|en)\/?$/.test(location.pathname);
    // Desktop WebGL glass and 3D monogram requirements
    const wide = matchMedia("(min-width: 768px)").matches;
    const canvas = document.createElement("canvas");
    const webgl = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl"),
    );

    // Critical viewport resources
    const tasks: Promise<unknown>[] = [document.fonts.ready];
    for (const img of Array.from(document.images)) {
      if (img.complete || img.getBoundingClientRect().top > innerHeight)
        continue;
      tasks.push(
        new Promise((r) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", r, { once: true });
        }),
      );
    }
    if (home && webgl && wide) {
      tasks.push(import("@/motion/webgl/fluted-glass"));
      tasks.push(import("@/motion/webgl/glass-monogram"));
      // Wait for hero shader compilation and initial frame
      tasks.push(
        new Promise<void>((resolve) => {
          const ready = () =>
            document.querySelector('[data-seq="on"][data-glass="on"]');
          if (ready()) return resolve();
          const mo = new MutationObserver(() => {
            if (!ready()) return;
            mo.disconnect();
            resolve();
          });
          mo.observe(document.body, {
            subtree: true,
            attributes: true,
            attributeFilter: ["data-glass"],
          });
          window.setTimeout(() => {
            mo.disconnect();
            resolve();
          }, 2000);
        }),
      );
    }

    let finished = 0;
    let target = 0;
    let shown = 0;
    let raf = 0;
    let leaving = false;
    track(tasks, () => {
      finished += 1;
      target = finished / tasks.length;
    });

    const digits = [...count.querySelectorAll<HTMLElement>("[data-digit]")];
    const paint = (v: number) => {
      const pct = Math.round(v * 100);
      const s = String(pct).padStart(3, "0");
      digits.forEach((d, i) => {
        d.style.transform = `translateY(${-Number(s[i]) * 10}%)`;
      });
      count.style.fontVariationSettings = `"wdth" ${(112.5 + 12.5 * v).toFixed(1)}, "wght" ${(150 + 650 * v).toFixed(0)}`;
    };

    const leave = () => {
      leaving = true;
      gsap
        .timeline({
          onComplete: () => {
            delete html.dataset.loader;
            try {
              sessionStorage.setItem(LOADER_KEY, "1");
            } catch {
              // Session storage unavailable
            }
            window.dispatchEvent(new Event("wu:loaded"));
            setDone(true);
          },
        })
        .to(root.querySelector("[data-inner]"), {
          yPercent: -40,
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
        })
        .to(
          root,
          { yPercent: -100, duration: 0.7, ease: "expo.inOut" },
          "-=0.3",
        );
    };

    const loop = () => {
      const elapsed = performance.now() - start;
      // Progress smoothed up to elapsed duration
      const timeCap = Math.min(1, elapsed / MIN_MS);
      const goal = elapsed >= MAX_MS ? 1 : Math.min(target, timeCap);
      shown += (goal - shown) * 0.2;
      if (goal === 1 && 1 - shown < 0.01) shown = 1;
      paint(shown);
      if (shown === 1 && !leaving) leave();
      if (!leaving) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (done) return null;
  return (
    <div ref={rootRef} className={styles.loader} aria-hidden="true">
      <div className={styles.inner} data-inner>
        <Monogram size={64} className={styles.mark} />
        <span ref={countRef} className={styles.count}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={styles.col}>
              <span data-digit className={styles.reel}>
                {"0123456789".split("").map((n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          ))}
          <span className={styles.pct}>%</span>
        </span>
      </div>
      <div className={styles.foot}>
        <span>{name}</span>
        <span>[ {label} ]</span>
      </div>
    </div>
  );
}
