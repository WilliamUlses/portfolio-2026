"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { gsap } from "@/motion/gsap";
import { whenStageReady } from "@/motion/stage-ready";

// Page title entrance animation using GSAP SplitText lines reveal.
// Optionally interpolates variable font weight and width settings.
// Hidden until stage readiness; static text rendered under prefers-reduced-motion.

const THIN = '"wdth" 112.5, "wght" 150';
const FAT = '"wdth" 125, "wght" 780';

export function MotionTitle({
  className,
  children,
  weight = false,
}: {
  className?: string;
  children: ReactNode;
  weight?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia("(prefers-reduced-motion: no-preference)").matches)
      return;
    let cancelled = false;
    let stop: (() => void) | null = null;
    let ctx: gsap.Context | null = null;
    // Hide initially to prevent flash before split and stage readiness.
    el.style.visibility = "hidden";
    void (async () => {
      const { SplitText } = await import("gsap/SplitText");
      if (cancelled) return;
      gsap.registerPlugin(SplitText);
      await document.fonts.ready;
      if (cancelled) return;
      ctx = gsap.context(() => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          aria: "none",
        });
        gsap.set(split.lines, { yPercent: 110 });
        if (weight) gsap.set(el, { fontVariationSettings: THIN });
        el.style.visibility = "";
        stop = whenStageReady(() => {
          const tl = gsap.timeline({
            onComplete: () => {
              split.revert();
              gsap.set(el, { clearProps: "fontVariationSettings" });
            },
          });
          tl.to(split.lines, {
            yPercent: 0,
            duration: 1,
            stagger: 0.08,
            ease: "expo.out",
          });
          if (weight)
            tl.to(
              el,
              { fontVariationSettings: FAT, duration: 1.1, ease: "expo.inOut" },
              0.15,
            );
        });
      }, el);
    })();
    return () => {
      cancelled = true;
      stop?.();
      ctx?.revert();
      el.style.visibility = "";
    };
  }, [weight]);

  return (
    <h1 ref={ref} className={className}>
      {children}
    </h1>
  );
}
