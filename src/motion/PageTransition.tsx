"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { gsap } from "./gsap";
import styles from "./PageTransition.module.css";

// Page transitions:
// - Standard pages: cobalt curtain slide with variable typography interpolation.
// - Projects: shared-element image expanding to full screen and docking to project cover.
// Unmodified clicks (Cmd/Ctrl/new tab) and reduced motion preserve native browser behavior.
const PROJECT_PATH = /^\/(fr\/projets|en\/projects)\/[^/]+\/?$/;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frames = (n: number) =>
  new Promise<void>((r) => {
    const step = (k: number) =>
      k <= 0 ? r() : requestAnimationFrame(() => step(k - 1));
    step(n);
  });
const norm = (p: string) => p.replace(/\/$/, "") || "/";

const THIN = '"wdth" 112.5, "wght" 150';
const FAT = '"wdth" 125, "wght" 800';

/**
 * Pre-computes title layout in final bold state to lock line wraps and prevent shifts.
 */
function layoutTitle(title: HTMLElement, label: string) {
  title.style.fontSize = "";
  title.style.fontVariationSettings = FAT;
  const box = title.parentElement ?? title;
  const pad = getComputedStyle(box);
  const avail =
    box.clientWidth -
    parseFloat(pad.paddingLeft) -
    parseFloat(pad.paddingRight);
  const words = label.split(/\s+/).filter(Boolean);
  // Reduce font size if widest word exceeds container width
  const probe = document.createElement("span");
  probe.style.whiteSpace = "nowrap";
  title.replaceChildren(probe);
  let widest = 0;
  for (const w of words) {
    probe.textContent = w;
    widest = Math.max(widest, probe.getBoundingClientRect().width);
  }
  if (widest > avail) {
    const size = parseFloat(getComputedStyle(title).fontSize);
    title.style.fontSize = `${Math.floor((size * avail * 0.97) / widest)}px`;
  }
  // Measure line wraps in bold state and lock as block spans
  const spans = words.map((w) => {
    const s = document.createElement("span");
    s.textContent = w;
    return s;
  });
  title.replaceChildren(...spans.flatMap((s, i) => (i ? [" ", s] : [s])));
  const lines: string[][] = [];
  let top = Number.NaN;
  for (const s of spans) {
    if (s.offsetTop !== top) {
      lines.push([]);
      top = s.offsetTop;
    }
    lines[lines.length - 1]?.push(s.textContent ?? "");
  }
  title.replaceChildren(
    ...lines.map((l) => {
      const line = document.createElement("span");
      line.style.display = "block";
      line.style.whiteSpace = "nowrap";
      line.textContent = l.join(" ");
      return line;
    }),
  );
}

/** Derives transition label: explicit data attribute or cleaned anchor text */
function labelOf(a: HTMLAnchorElement): string {
  const explicit = a.dataset.transitionLabel;
  if (explicit) return explicit;
  const clone = a.cloneNode(true) as HTMLElement;
  for (const el of clone.querySelectorAll("sup, [aria-hidden='true']"))
    el.remove();
  return (clone.textContent ?? "")
    .replace(/[↗→↑←[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Source image for shared-element transition */
function sharedImageOf(a: HTMLAnchorElement): HTMLImageElement | null {
  const scope = a.closest("[data-shared-scope]");
  let img = scope?.querySelector("img") ?? null;
  if (!img && a.closest("[data-preview]"))
    img = document.querySelector<HTMLImageElement>(
      "[data-show] [data-active] img",
    );
  if (!img) return null;
  const r = img.getBoundingClientRect();
  const visible =
    r.width > 40 && r.bottom > 0 && r.top < innerHeight && img.complete;
  return visible ? img : null;
}

export function PageTransition({ name }: { name: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const arrival = useRef<{ path: string; resolve: () => void } | null>(null);

  useEffect(() => {
    const a = arrival.current;
    if (a && norm(pathname) === a.path) {
      arrival.current = null;
      a.resolve();
    }
  }, [pathname]);

  useEffect(() => {
    const curtain = curtainRef.current;
    const title = titleRef.current;
    if (!curtain || !title) return;
    const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const prefetched = new Set<string>();
    let busy = false;

    const linkOf = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      if (!(a instanceof HTMLAnchorElement)) return null;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download"))
        return null;
      // Language switches change root layout and set cookies: skip curtain transition
      if (a.hasAttribute("hreflang")) return null;
      const url = new URL(a.href);
      if (url.origin !== location.origin) return null;
      if (norm(url.pathname) === norm(location.pathname)) return null;
      if (/^\/(admin|api)(\/|$)/.test(url.pathname)) return null;
      return { a, url };
    };

    const onOver = (e: PointerEvent) => {
      const link = linkOf(e);
      if (!link) return;
      const target = link.url.pathname + link.url.search;
      if (prefetched.has(target)) return;
      prefetched.add(target);
      router.prefetch(target);
    };

    const curtainIn = (label: string) => {
      layoutTitle(title, label);
      gsap.set(curtain, { yPercent: 100, visibility: "visible" });
      gsap.set(title, {
        yPercent: 60,
        opacity: 0,
        fontVariationSettings: THIN,
      });
      return gsap
        .timeline()
        .to(curtain, { yPercent: 0, duration: 0.6, ease: "expo.inOut" }, 0)
        .to(
          title,
          { yPercent: 0, opacity: 1, duration: 0.5, ease: "expo.out" },
          0.3,
        )
        .to(
          title,
          {
            fontVariationSettings: FAT,
            duration: 0.5,
            ease: "expo.inOut",
          },
          0.4,
        )
        .then();
    };
    const curtainOut = () =>
      gsap
        .timeline()
        .to(title, {
          yPercent: -60,
          opacity: 0,
          duration: 0.3,
          ease: "power2.in",
        })
        .to(curtain, { yPercent: -100, duration: 0.6, ease: "expo.inOut" })
        .set(curtain, { visibility: "hidden" })
        .then();

    // Shared element: duplicate target image and animate fullscreen
    let clone: HTMLImageElement | null = null;
    const sharedOut = (img: HTMLImageElement) => {
      const r = img.getBoundingClientRect();
      clone = document.createElement("img");
      clone.src = img.currentSrc || img.src;
      clone.alt = "";
      clone.setAttribute("aria-hidden", "true");
      clone.className = styles.clone ?? "";
      Object.assign(clone.style, {
        top: `${r.top}px`,
        left: `${r.left}px`,
        width: `${r.width}px`,
        height: `${r.height}px`,
        borderRadius: getComputedStyle(img.parentElement ?? img).borderRadius,
      });
      document.body.append(clone);
      document.documentElement.dataset.shared = "";
      return gsap
        .to(clone, {
          top: 0,
          left: 0,
          width: innerWidth,
          height: innerHeight,
          borderRadius: 0,
          duration: 0.8,
          ease: "expo.inOut",
        })
        .then();
    };
    // Dock shared image into destination case-study cover
    const sharedIn = async () => {
      const c = clone;
      const target = document.querySelector<HTMLElement>(
        "[data-shared-target]",
      );
      const html = document.documentElement;
      if (c && target) {
        const r = target.getBoundingClientRect();
        await gsap
          .to(c, {
            top: r.top,
            left: r.left,
            width: r.width,
            height: r.height,
            borderRadius: getComputedStyle(target).borderRadius,
            duration: 0.9,
            ease: "expo.inOut",
          })
          .then();
      } else if (c) {
        await gsap.to(c, { opacity: 0, duration: 0.4 }).then();
      }
      delete html.dataset.shared;
      await frames(2);
      c?.remove();
      clone = null;
    };

    const onClick = async (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const link = linkOf(e);
      if (!link || reduce()) return;
      e.preventDefault();
      e.stopPropagation();
      if (busy) return;
      busy = true;
      const { a, url } = link;
      const to = url.pathname + url.search + url.hash;
      const img = PROJECT_PATH.test(url.pathname) ? sharedImageOf(a) : null;
      const arrived = new Promise<void>((resolve) => {
        arrival.current = { path: norm(url.pathname), resolve };
      });
      document.documentElement.dataset.nav = "";
      window.dispatchEvent(new Event("wu:nav-start"));
      try {
        if (img) await sharedOut(img);
        else await curtainIn(labelOf(a));
        router.push(to, { scroll: false });
        // Wait for next page to mount before lifting curtain (max 8s timeout)
        await Promise.race([arrived, wait(8000)]);
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event("wu:nav-cover"));
        await frames(2);
        if (img) await sharedIn();
        else await curtainOut();
        // Focus first heading on the newly mounted page
        const h1 = document.querySelector<HTMLElement>("main h1, h1");
        if (h1) {
          if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
      } finally {
        delete document.documentElement.dataset.shared;
        clone?.remove();
        clone = null;
        gsap.set(curtain, { visibility: "hidden" });
        delete document.documentElement.dataset.nav;
        window.dispatchEvent(new Event("wu:nav-end"));
        busy = false;
      }
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerover", onOver);
    };
  }, [router]);

  return (
    <div ref={curtainRef} className={styles.curtain} aria-hidden="true">
      <p ref={titleRef} className={styles.title} />
      <p className={styles.foot}>{name}</p>
    </div>
  );
}
