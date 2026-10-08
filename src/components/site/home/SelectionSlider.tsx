"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { SelectionColors } from "@/lib/color";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import type { PublicMedia } from "@/server/queries";
import styles from "./Selection.module.css";

export type SlideData = {
  href: string;
  title: string;
  meta: string;
  cover: PublicMedia | null;
  colors: SelectionColors;
  darkColors?: SelectionColors;
};

// Pinned scroll-driven selection showcase: one full viewport height per project.
// Transitions roll typography vertically, project cover tilts and scales, and dynamic background colors interpolate.
// Responsive fallback: static colored stacked panels without pinning on mobile or prefers-reduced-motion.

const SEQ_QUERY =
  "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(SEQ_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const seqAllowed = () => window.matchMedia(SEQ_QUERY).matches;
const noSeqOnServer = () => false;

/** Title and metadata roll travel distance as percentage of height to clear overflow masks. */
const OUT = 140;
/** Normalized transition slice between project plateaus. */
const PLATEAU = 0.25;
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

export function SelectionSlider({
  slides,
  labels,
}: {
  slides: SlideData[];
  labels: { title: string; all: string; allHref: string; view: string };
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const allowed = useSyncExternalStore(subscribe, seqAllowed, noSeqOnServer);
  const total = String(slides.length).padStart(2, "0");

  useEffect(() => {
    const section = sectionRef.current;
    const pin = pinRef.current;
    if (!allowed || !section || !pin || slides.length < 2) return;
    const n = slides.length;
    const items = [...pin.querySelectorAll<HTMLElement>("[data-slide]")];
    const moving = items.map((el) => ({
      el,
      roll: [...el.querySelectorAll<HTMLElement>("[data-roll]")],
      image: el.querySelector<HTMLElement>("[data-image]"),
    }));
    const ticks = [...pin.querySelectorAll<HTMLElement>("[data-tick]")];
    const count = pin.querySelector<HTMLElement>("[data-count]");
    section.dataset.seq = "on";

    const mixColor = gsap.utils.interpolate;
    let current = -1;
    const render = (progress: number) => {
      const pos = progress * (n - 1);
      const i = Math.min(n - 2, Math.floor(pos));
      const raw = pos - i;
      const t = easeInOut(
        Math.min(1, Math.max(0, (raw - PLATEAU) / (1 - 2 * PLATEAU))),
      );
      moving.forEach(({ el, roll, image }, k) => {
        // Travel 140% to ensure descenders fully clear the overflow mask during transition.
        const y =
          k === i ? -OUT * t : k === i + 1 ? OUT * (1 - t) : k < i ? -OUT : OUT;
        for (const r of roll) r.style.transform = `translateY(${y}%)`;
        if (!image) return;
        if (k === i) {
          image.style.opacity = String(1 - t);
          image.style.transform = `translateY(${t * 26}%) rotateX(${t * 28}deg) scale(${1 + t * 0.14})`;
          el.style.zIndex = t < 0.5 ? "2" : "1";
        } else if (k === i + 1) {
          image.style.opacity = String(t);
          image.style.transform = `scale(${0.94 + t * 0.06})`;
          el.style.zIndex = t < 0.5 ? "1" : "2";
        } else {
          image.style.opacity = "0";
          el.style.zIndex = "0";
        }
      });
      const isDark =
        document.documentElement.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme &&
          !document.documentElement.classList.contains("light") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const slideA = slides[i];
      const slideB = slides[i + 1];
      const a =
        isDark && slideA?.darkColors ? slideA.darkColors : slideA?.colors;
      const b =
        isDark && slideB?.darkColors ? slideB.darkColors : slideB?.colors;
      if (a && b) {
        pin.style.setProperty(
          "--sel-bg",
          mixColor(a.background, b.background, t),
        );
        pin.style.setProperty("--sel-title", mixColor(a.title, b.title, t));
        pin.style.setProperty("--sel-text", mixColor(a.text, b.text, t));
        pin.style.setProperty("--sel-dot", mixColor(a.dot, b.dot, t));
      }
      const active = t < 0.5 ? i : i + 1;
      if (active !== current) {
        current = active;
        items.forEach((el, k) => {
          el.dataset.active = k === active ? "true" : "false";
        });
        ticks.forEach((el, k) => {
          el.dataset.on = k === active ? "true" : "false";
        });
        if (count)
          count.textContent = `${String(active + 1).padStart(2, "0")} / ${total}`;
      }
    };

    const goToSlide = (targetIndex: number) => {
      const clamped = Math.max(0, Math.min(n - 1, targetIndex));
      const targetY = st.start + ((st.end - st.start) * clamped) / (n - 1);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    };

    const st = ScrollTrigger.create({
      id: "selection-scroll",
      trigger: section,
      start: "top top",
      end: `+=${(n - 1) * 100}%`,
      pin,
      // Refresh after hero sequence above to preserve accurate geometry.
      refreshPriority: -1,
      invalidateOnRefresh: true,
      onUpdate: (self) => render(self.progress),
    });
    render(st.progress);

    const onTheme = () => render(st.progress);
    window.addEventListener("wu:theme-change", onTheme);

    // Keyboard navigation (ArrowLeft / ArrowRight / ArrowUp / ArrowDown)
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const rect = section.getBoundingClientRect();
      const inView = rect.top <= 120 && rect.bottom >= window.innerHeight * 0.4;
      if (!inView) return;

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (current < n - 1) {
          e.preventDefault();
          goToSlide(current + 1);
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (current > 0) {
          e.preventDefault();
          goToSlide(current - 1);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // Keyboard focus brings associated slide into view.
    const onFocus = (e: FocusEvent) => {
      const slide = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-slide]",
      );
      if (!slide) return;
      const k = items.indexOf(slide);
      if (k < 0) return;
      goToSlide(k);
    };
    pin.addEventListener("focusin", onFocus);

    // Interactive view cursor dot on hover (fine pointers only).
    const dot = dotRef.current;
    let cleanupDot = () => {};
    if (dot && window.matchMedia("(pointer: fine)").matches) {
      const onMove = (e: PointerEvent) => {
        const box = pin.getBoundingClientRect();
        dot.style.transform = `translate(${e.clientX - box.left}px, ${e.clientY - box.top}px)`;
        const overImage = (e.target as HTMLElement).closest("[data-image]");
        dot.dataset.on = overImage ? "true" : "false";
      };
      const onLeave = () => {
        dot.dataset.on = "false";
      };
      pin.addEventListener("pointermove", onMove);
      pin.addEventListener("pointerleave", onLeave);
      cleanupDot = () => {
        pin.removeEventListener("pointermove", onMove);
        pin.removeEventListener("pointerleave", onLeave);
      };
    }

    return () => {
      st.kill();
      cleanupDot();
      window.removeEventListener("wu:theme-change", onTheme);
      window.removeEventListener("keydown", onKeyDown);
      pin.removeEventListener("focusin", onFocus);
      delete section.dataset.seq;
      for (const prop of ["--sel-bg", "--sel-title", "--sel-text", "--sel-dot"])
        pin.style.removeProperty(prop);
      for (const { el, roll, image } of moving) {
        el.style.zIndex = "";
        delete el.dataset.active;
        for (const r of roll) r.style.transform = "";
        if (image) {
          image.style.opacity = "";
          image.style.transform = "";
        }
      }
    };
  }, [allowed, slides, total]);

  const first = slides[0]?.colors;
  return (
    <section
      ref={sectionRef}
      className={styles.section}
      aria-labelledby="selection"
    >
      <div
        ref={pinRef}
        className={styles.pin}
        style={
          first
            ? ({
                "--sel-bg": first.background,
                "--sel-title": first.title,
                "--sel-text": first.text,
                "--sel-dot": first.dot,
              } as React.CSSProperties)
            : undefined
        }
      >
        <div className={styles.head}>
          <h2 id="selection" className={styles.heading}>
            {labels.title}
          </h2>
          <Link href={labels.allHref} className={styles.all}>
            {labels.all} →
          </Link>
        </div>

        <ol className={styles.slides}>
          {slides.map((s, k) => (
            <li
              key={s.href}
              className={styles.slide}
              data-slide
              data-shared-scope
              data-cursor="none"
              style={
                {
                  "--slide-bg": s.colors.background,
                  "--slide-title": s.colors.title,
                  "--slide-text": s.colors.text,
                  "--slide-bg-dark": s.darkColors?.background,
                  "--slide-title-dark": s.darkColors?.title,
                  "--slide-text-dark": s.darkColors?.text,
                } as React.CSSProperties
              }
            >
              <h3 className={styles.title}>
                <span className={styles.mask}>
                  <Link href={s.href} data-roll className={styles.roll}>
                    {s.title}
                  </Link>
                </span>
              </h3>
              <p className={styles.meta}>
                <span className={styles.mask}>
                  <span data-roll className={styles.roll}>
                    {s.meta}
                  </span>
                </span>
              </p>
              <div className={styles.stage}>
                {s.cover ? (
                  // Secondary click target hidden from tab order and screen readers
                  <Link
                    href={s.href}
                    className={styles.image}
                    data-image
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <Image
                      src={s.cover.url}
                      alt=""
                      fill
                      loading="lazy"
                      sizes="(min-width: 768px) 74vw, 100vw"
                    />
                  </Link>
                ) : null}
              </div>
              <span className={styles.index} aria-hidden="true">
                {String(k + 1).padStart(2, "0")} / {total}
              </span>
            </li>
          ))}
        </ol>

        <nav className={styles.ticks} aria-label="Progression sélection">
          {slides.map((s, idx) => (
            <button
              key={s.href}
              type="button"
              data-tick
              data-on={idx === 0 ? "true" : "false"}
              className={styles.tickButton}
              onClick={() => {
                const st = ScrollTrigger.getById("selection-scroll");
                if (st) {
                  const targetY =
                    st.start +
                    ((st.end - st.start) * idx) / (slides.length - 1);
                  window.scrollTo({ top: targetY, behavior: "smooth" });
                }
              }}
              aria-label={`${s.title} (${String(idx + 1).padStart(2, "0")} / ${total})`}
              title={s.title}
            >
              <span className={styles.tickBar} />
            </button>
          ))}
        </nav>

        <div className={styles.progressFooter} aria-hidden="true">
          <p className={styles.count} data-count>
            01 / {total}
          </p>
          <div className={styles.keysHint} title="Navigation clavier">
            <kbd className={styles.key}>←</kbd>
            <kbd className={styles.key}>→</kbd>
          </div>
        </div>

        <div ref={dotRef} className={styles.dot} aria-hidden="true">
          <span>{labels.view} ↗</span>
        </div>
      </div>
    </section>
  );
}
