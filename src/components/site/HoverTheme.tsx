"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { PROJECT_THEME_KEYS } from "@/lib/color";

// Dynamically applies hover project theme variables to <html> and cleans up on leave
export function HoverTheme({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const html = document.documentElement;
    let current: string | null = null;
    let leave = 0;

    const apply = (theme: string | null) => {
      if (theme === current) return;
      current = theme;
      for (const k of PROJECT_THEME_KEYS) html.style.removeProperty(k);
      if (!theme) return;
      for (const decl of theme.split(";")) {
        const i = decl.indexOf(":");
        if (i > 0) html.style.setProperty(decl.slice(0, i), decl.slice(i + 1));
      }
    };
    const isDark = () =>
      html.classList.contains("dark") ||
      html.dataset.theme === "dark" ||
      (!html.dataset.theme &&
        !html.classList.contains("light") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const themeOf = (el: Element | null) => {
      if (!el) return null;
      return isDark()
        ? el.getAttribute("data-dark-theme") || el.getAttribute("data-theme")
        : el.getAttribute("data-theme");
    };

    let currentEl: HTMLElement | null = null;

    // Retain color between adjacent rows (borders, gaps) to prevent flickering.
    const onOver = (e: PointerEvent) => {
      window.clearTimeout(leave);
      const el = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-theme]",
      );
      currentEl = el ?? null;
      if (el) apply(themeOf(el));
    };
    const onLeave = () => {
      leave = window.setTimeout(() => {
        currentEl = null;
        apply(null);
      }, 120);
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>(
        "[data-theme]",
      );
      currentEl = el ?? null;
      apply(themeOf(el ?? null));
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!root.contains(e.relatedTarget as Node | null)) {
        currentEl = null;
        apply(null);
      }
    };
    const onThemeChange = () => {
      if (currentEl) apply(themeOf(currentEl));
    };

    root.addEventListener("pointerover", onOver);
    root.addEventListener("pointerleave", onLeave);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("focusout", onFocusOut);
    window.addEventListener("wu:theme-change", onThemeChange);

    return () => {
      window.clearTimeout(leave);
      root.removeEventListener("pointerover", onOver);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      window.removeEventListener("wu:theme-change", onThemeChange);
      apply(null);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
