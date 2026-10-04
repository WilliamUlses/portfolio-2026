"use client";

import type { ShaderMount } from "@paper-design/shaders";
import { type ReactNode, useEffect, useRef } from "react";
import type { Light } from "@/motion/webgl/fluted-glass";
import styles from "./FlutedPanel.module.css";

// Fluted glass surface over light composition.
// - WebGL rendering (Paper Shaders, loaded dynamically): single frame on mount/resize.
// - Fine pointer + no reduced motion: fluted refraction shifts smoothly with pointer.
// - Without WebGL (or before load): CSS fallback (cobalt backdrop, radial gradients, rendered flutes).

export type { Light };

const MOVE_QUERY =
  "(pointer: fine) and (prefers-reduced-motion: no-preference)";

export function FlutedPanel({
  lights,
  calm = 0,
  className,
  children,
  ...rest
}: {
  lights: readonly Light[];
  /** Left portion dimmed to preserve text contrast. */
  calm?: number;
  className?: string;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: lights are static for panel lifecycle
  useEffect(() => {
    const root = rootRef.current;
    const layer = layerRef.current;
    if (!root || !layer) return;
    // Desktop viewports only; mobile uses CSS fallback.
    if (!matchMedia("(min-width: 768px)").matches) return;
    const probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") ?? probe.getContext("webgl"))) return;

    let disposed = false;
    let glass: ShaderMount | null = null;
    const cleanups: (() => void)[] = [];
    const teardown = () => {
      disposed = true;
      for (const c of cleanups.reverse()) c();
      cleanups.length = 0;
      glass?.dispose();
      glass = null;
      layer.replaceChildren();
      delete root.dataset.glass;
    };

    const start = async () => {
      const lib = await import("@/motion/webgl/fluted-glass");
      if (disposed) return;
      const isDark = () =>
        document.documentElement.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark" ||
        (!document.documentElement.dataset.theme &&
          !document.documentElement.classList.contains("light") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      const texture = () => {
        const dark = isDark();
        return lib.canvasToImage(
          lib.lightsCanvas(
            root.clientWidth,
            root.clientHeight,
            lights,
            calm,
            dark ? "#111424" : "#1E2BFF",
            dark ? "rgba(17,20,36,.9)" : "rgba(22,32,210,.9)",
          ),
        );
      };
      const img = await texture();
      if (disposed) return;
      glass = lib.mountFlutedGlass(layer, img, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      });
      if (!glass) {
        teardown();
        return;
      }
      root.dataset.glass = "on";
      for (const canvas of layer.querySelectorAll("canvas"))
        canvas.addEventListener("webglcontextlost", teardown, { once: true });

      const updateTexture = async () => {
        const next = await texture();
        if (!disposed && glass) glass.setUniforms({ u_image: next });
      };

      // Generate new texture on resize to preserve light proportions.
      let timer = 0;
      let first = true;
      const ro = new ResizeObserver(() => {
        if (first) {
          first = false;
          return;
        }
        window.clearTimeout(timer);
        timer = window.setTimeout(updateTexture, 200);
      });
      ro.observe(root);
      window.addEventListener("wu:theme-change", updateTexture);
      cleanups.push(() => {
        window.clearTimeout(timer);
        window.removeEventListener("wu:theme-change", updateTexture);
        ro.disconnect();
      });

      // Pointer-tracking flute offset (damped lerp; idle when stationary).
      if (window.matchMedia(MOVE_QUERY).matches) {
        let target = 0;
        let shift = 0;
        let raf = 0;
        const tick = () => {
          shift += (target - shift) * 0.08;
          glass?.setUniforms({ u_shift: shift });
          raf =
            Math.abs(target - shift) > 0.0005 ? requestAnimationFrame(tick) : 0;
        };
        const onMove = (e: PointerEvent) => {
          target = (e.clientX / window.innerWidth - 0.5) * 0.5;
          if (!raf) raf = requestAnimationFrame(tick);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        cleanups.push(() => {
          window.removeEventListener("pointermove", onMove);
          cancelAnimationFrame(raf);
        });
      }
    };
    // Lazy mount when approaching viewport to avoid compiling shaders during initial load.
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        start().catch((err: unknown) => {
          // If shader or texture fails, CSS fallback remains visible.
          console.error("[glass]", err);
          teardown();
        });
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(root);
    cleanups.push(() => io.disconnect());
    return teardown;
  }, []);

  return (
    <div
      ref={rootRef}
      className={`${styles.panel} ${className ?? ""}`}
      {...rest}
    >
      <div ref={layerRef} className={styles.glass} aria-hidden="true" />
      {children}
    </div>
  );
}
