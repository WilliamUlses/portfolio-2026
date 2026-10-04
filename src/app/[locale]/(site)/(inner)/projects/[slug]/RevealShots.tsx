"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/motion/gsap";

// Scroll-driven image reveals and subtle parallax within frames.
export function RevealShots({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (
      !root ||
      !window.matchMedia("(prefers-reduced-motion: no-preference)").matches
    )
      return;
    const shots = [...root.querySelectorAll<HTMLElement>("[data-shot]")];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          (e.target as HTMLElement).dataset.in = "";
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    for (const el of shots) io.observe(el);
    root.dataset.reveal = "";

    // Subtle parallax shift for framed images
    const ctx = gsap.context(() => {
      const frames = root.querySelectorAll<HTMLElement>(
        "[data-shot], [data-shared-target]",
      );
      for (const frame of frames) {
        const img = frame.querySelector("img");
        if (!img) continue;
        gsap.fromTo(
          img,
          { yPercent: -5, scale: 1.12 },
          {
            yPercent: 5,
            scale: 1.12,
            ease: "none",
            scrollTrigger: {
              trigger: frame,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      }
    }, root);
    ScrollTrigger.refresh();
    return () => {
      io.disconnect();
      ctx.revert();
      delete root.dataset.reveal;
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
