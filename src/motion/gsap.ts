"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// GSAP registration point
gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const ease = {
  out: "expo.out",
  inOut: "expo.inOut",
  soft: "power3.out",
  sweep: "power2.inOut",
  zoom: "power3.inOut",
} as const;

/** Client-side media queries for user motion and pointer preferences */
export function motionPrefs() {
  const mq = (q: string) =>
    typeof window !== "undefined" && window.matchMedia(q).matches;
  return {
    reduce: mq("(prefers-reduced-motion: reduce)"),
    fine: mq("(pointer: fine)"),
    wide: mq("(min-width: 768px)"),
  };
}

/** Runs a callback on every RAF frame only while element is within viewport */
export function whileVisible(el: Element, step: () => void): () => void {
  let raf = 0;
  let visible = false;
  const loop = () => {
    if (!visible) return;
    step();
    raf = requestAnimationFrame(loop);
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    cancelAnimationFrame(raf);
    if (visible) raf = requestAnimationFrame(loop);
  });
  io.observe(el);
  return () => {
    visible = false;
    cancelAnimationFrame(raf);
    io.disconnect();
  };
}
