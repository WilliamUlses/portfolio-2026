"use client";

import { useEffect, useRef } from "react";

// Injects scoped CSS variables for project theme, toggling media query on unmount to prevent style leak.
export function ProjectTheme({ css }: { css: string }) {
  const ref = useRef<HTMLStyleElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.media = "all";
    return () => {
      el.media = "not all";
    };
  }, []);
  return <style ref={ref}>{css}</style>;
}
