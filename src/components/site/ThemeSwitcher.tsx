"use client";

import { useEffect, useState } from "react";

export type ThemeLabels = {
  theme: string;
  dark: string;
  light: string;
};

export const THEME_COOKIE = "wu-theme";

export function ThemeSwitcher({
  className,
  labels,
}: {
  className?: string;
  labels: ThemeLabels;
}) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const currentIsDark =
      root.classList.contains("dark") ||
      root.dataset.theme === "dark" ||
      (!root.dataset.theme &&
        !root.classList.contains("light") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDark(currentIsDark);

    const onMediaChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(THEME_COOKIE)) {
        setIsDark(e.matches);
        if (e.matches) {
          root.classList.add("dark");
          root.dataset.theme = "dark";
        } else {
          root.classList.remove("dark");
          root.dataset.theme = "light";
        }
      }
    };

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", onMediaChange);
    return () => mq.removeEventListener("change", onMediaChange);
  }, []);

  const toggle = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);
    const root = document.documentElement;
    const nextTheme = nextIsDark ? "dark" : "light";

    if (nextIsDark) {
      root.classList.add("dark");
      root.classList.remove("light");
      root.dataset.theme = "dark";
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      root.dataset.theme = "light";
    }

    try {
      localStorage.setItem(THEME_COOKIE, nextTheme);
      // biome-ignore lint/suspicious/noDocumentCookie: non-sensitive theme preference cookie read before hydration
      document.cookie = `${THEME_COOKIE}=${nextTheme}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Storage unavailable in private browsing mode
    }

    window.dispatchEvent(
      new CustomEvent("wu:theme-change", { detail: { theme: nextTheme } }),
    );
  };

  const actionLabel = !mounted
    ? labels.theme
    : isDark
      ? labels.light
      : labels.dark;

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label={actionLabel}
      title={actionLabel}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        {isDark ? (
          // Sun icon when currently dark (clicking turns light)
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </>
        ) : (
          // Moon icon when currently light (clicking turns dark)
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        )}
      </svg>
    </button>
  );
}
