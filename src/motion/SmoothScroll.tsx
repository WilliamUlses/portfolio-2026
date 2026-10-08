"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, motionPrefs, ScrollTrigger } from "./gsap";

// Smooth scrolling via Lenis synchronized with GSAP ScrollTrigger.
// In-page hash anchors are explicitly intercepted to handle focus and avoid jump conflicts.
export function SmoothScroll() {
  useEffect(() => {
    if (motionPrefs().reduce) return;
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);

    // Pause scrolling while preloader is active
    const onLoaded = () => lenis.start();
    if ("loader" in document.documentElement.dataset) {
      lenis.stop();
      window.addEventListener("wu:loaded", onLoaded, { once: true });
    }

    // Modal dialogs: pause Lenis scrolling while active
    const onModalOpen = () => lenis.stop();
    const onModalClose = () => {
      lenis.resize();
      lenis.start();
    };
    window.addEventListener("wu:modal-open", onModalOpen);
    window.addEventListener("wu:modal-close", onModalClose);

    // Page transitions: pause, reset to top under curtain, then resume
    const onNavStart = () => lenis.stop();
    const onNavCover = () => {
      lenis.resize();
      lenis.scrollTo(0, { immediate: true, force: true });
    };
    const onNavEnd = () => {
      lenis.resize();
      lenis.start();
    };
    window.addEventListener("wu:nav-start", onNavStart);
    window.addEventListener("wu:nav-cover", onNavCover);
    window.addEventListener("wu:nav-end", onNavEnd);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const link = (e.target as Element | null)?.closest?.("a[href*='#']");
      if (!(link instanceof HTMLAnchorElement)) return;
      const url = new URL(link.href);
      if (
        url.origin !== location.origin ||
        url.pathname !== location.pathname ||
        url.search !== location.search ||
        !url.hash
      )
        return;
      const id = decodeURIComponent(url.hash.slice(1));
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.resize();
      const toTop = id === "top";
      lenis.scrollTo(toTop ? 0 : target);
      history.pushState(null, "", url.hash);
      if (!toTop) {
        if (!target.hasAttribute("tabindex"))
          target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("wu:loaded", onLoaded);
      window.removeEventListener("wu:nav-start", onNavStart);
      window.removeEventListener("wu:nav-cover", onNavCover);
      window.removeEventListener("wu:nav-end", onNavEnd);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
