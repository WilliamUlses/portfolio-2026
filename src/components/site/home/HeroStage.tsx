"use client";

import type { ShaderMount } from "@paper-design/shaders";
import { type ReactNode, useEffect, useRef, useSyncExternalStore } from "react";
import { ease, gsap, ScrollTrigger } from "@/motion/gsap";
import type { Light } from "@/motion/webgl/fluted-glass";
import styles from "./Hero.module.css";

// Pinned scroll-driven transition from full-viewport hero into the approach card:
//  1. Fullscreen cobalt backdrop shrinks to card dimensions; fluted glass overlay fades in;
//     hero typography scales down and fades out.
//  2. Sequential step reveals inside card (staggered line masks, progress bar, counter,
//     and progressive flute refraction shift).
// Graceful degradation: under prefers-reduced-motion or mobile viewports, sequence is disabled
// and static hero / approach sections render sequentially.

/** Target card bounding inset relative to hero viewport. */
const CARD = { top: 0.14, right: 1 / 6, bottom: 0.14, left: 1 / 6, radius: 12 };
/** Light sources positioned in right portion; calm left area reserved for text contrast. */
const LIGHTS: Light[] = [
  { x: 0.64, y: 0.3, r: 0.3, color: "rgba(159,243,255,.55)" },
  { x: 0.78, y: 0.74, r: 0.25, color: "rgba(255,122,217,.45)" },
];
const DARK_LIGHTS: Light[] = [
  { x: 0.64, y: 0.3, r: 0.35, color: "rgba(92,110,255,.65)" },
  { x: 0.78, y: 0.74, r: 0.3, color: "rgba(159,243,255,.35)" },
  { x: 0.45, y: 0.55, r: 0.25, color: "rgba(215,90,255,.25)" },
];
const CALM = 0.53;

const SEQ_QUERY =
  "(min-width: 768px) and (prefers-reduced-motion: no-preference)";
const subscribe = (onChange: () => void) => {
  const mq = window.matchMedia(SEQ_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};
const seqAllowed = () => window.matchMedia(SEQ_QUERY).matches;
const noSeqOnServer = () => false;

export function HeroStage({
  children,
  menu,
}: {
  children: ReactNode;
  menu: ReactNode;
}) {
  const pinRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const allowed = useSyncExternalStore(subscribe, seqAllowed, noSeqOnServer);

  useEffect(() => {
    const pin = pinRef.current;
    const stage = stageRef.current;
    const panel = panelRef.current;
    const glassLayer = glassRef.current;
    if (!allowed || !pin || !stage || !panel || !glassLayer) return;

    let disposed = false;
    let shader: ShaderMount | null = null;
    const cleanups: (() => void)[] = [];

    const teardown = () => {
      disposed = true;
      for (const c of cleanups.reverse()) c();
      cleanups.length = 0;
      shader?.dispose();
      shader = null;
      glassLayer.querySelector("[data-shader]")?.replaceChildren();
      delete stage.dataset.seq;
      delete stage.dataset.glass;
      panel.style.clipPath = "";
      glassLayer.style.opacity = "";
      gsap.set(
        stage.querySelectorAll("[data-hero], [data-prog], [data-fill]"),
        {
          clearProps: "all",
        },
      );
      gsap.set(stage.querySelectorAll("[data-line] > span"), {
        clearProps: "all",
      });
    };

    // Scroll sequence setup
    stage.dataset.seq = "on";
    const P = { top: 0, right: 0, bottom: 0, left: 0, radius: 0, glass: 0 };
    const G = { shift: 0 };
    // Only invoke setUniforms when shift changes to prevent redundant render passes.
    // Minimum non-zero opacity keeps canvas ready on GPU to eliminate frame drop on start.
    let drawnShift = Number.NaN;
    const push = () => {
      panel.style.clipPath = `inset(${P.top * 100}% ${P.right * 100}% ${P.bottom * 100}% ${P.left * 100}% round ${P.radius}px)`;
      glassLayer.style.opacity = String(Math.max(P.glass, 0.002));
      if (shader && G.shift !== drawnShift) {
        drawnShift = G.shift;
        shader.setUniforms({ u_shift: G.shift });
      }
    };
    push();

    const hero = stage.querySelector<HTMLElement>("[data-hero]");
    const steps = [...stage.querySelectorAll<HTMLElement>("[data-step]")];
    const stepLines = steps.map((st) =>
      st.querySelectorAll<HTMLElement>("[data-line] > span"),
    );
    const fills = [...stage.querySelectorAll<HTMLElement>("[data-fill]")];
    const count = stage.querySelector<HTMLElement>("[data-count]");
    const prog = stage.querySelector<HTMLElement>("[data-prog]");
    const total = String(steps.length).padStart(2, "0");
    const setCount = (i: number) => {
      if (count) count.textContent = `${String(i).padStart(2, "0")} / ${total}`;
    };
    for (const lines of stepLines) gsap.set(lines, { yPercent: 110 });
    gsap.set(fills, { scaleX: 0, transformOrigin: "left" });
    if (prog) gsap.set(prog, { autoAlpha: 0 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: push,
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=300%",
        scrub: 1,
        pin: true,
        invalidateOnRefresh: true,
      },
    });
    // 1. Shrink full cobalt to card bounds; reveal glass layer.
    tl.to(
      hero ?? {},
      { autoAlpha: 0, scale: 0.94, duration: 0.55, ease: "power2.in" },
      0,
    )
      .to(P, { ...CARD, duration: 1.4, ease: ease.zoom }, 0)
      .to(P, { glass: 1, duration: 1.1, ease: "power1.inOut" }, 0.3)
      // 2. Sequential steps.
      .to(prog, { autoAlpha: 1, duration: 0.3 }, "-=.2")
      .to(
        stepLines[0] ?? [],
        { yPercent: 0, duration: 0.6, stagger: 0.1, ease: ease.soft },
        "<",
      )
      .to(fills[0] ?? {}, { scaleX: 1, duration: 1.1 }, "<");
    for (let i = 1; i < steps.length; i++) {
      tl.to({}, { duration: 0.35 })
        .to(stepLines[i - 1] ?? [], {
          yPercent: -110,
          duration: 0.45,
          stagger: 0.05,
          ease: "power2.in",
        })
        .to(G, { shift: i * 0.35, duration: 1, ease: ease.soft }, "<")
        .call(setCount, [i + 1], "<+=.4")
        .call(setCount, [i], "<-=.01")
        .to(
          stepLines[i] ?? [],
          { yPercent: 0, duration: 0.6, stagger: 0.1, ease: ease.soft },
          "-=.55",
        )
        .to(fills[i] ?? {}, { scaleX: 1, duration: 1.1 }, "<");
    }
    tl.to({}, { duration: 0.6 });
    cleanups.push(() => {
      tl.scrollTrigger?.kill();
      tl.kill();
    });
    ScrollTrigger.refresh();

    // Optional WebGL glass layer; CSS fallbacks apply when unsupported.
    const mountGlass = async () => {
      if (!matchMedia("(min-width: 768px)").matches) return;
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl2") ?? probe.getContext("webgl"))) return;
      const lib = await import("@/motion/webgl/fluted-glass");
      if (disposed) return;
      const host = glassLayer.querySelector<HTMLElement>("[data-shader]");
      if (!host) return;
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
            stage.clientWidth,
            stage.clientHeight,
            dark ? DARK_LIGHTS : LIGHTS,
            CALM,
            dark ? "#111424" : "#1E2BFF",
            dark ? "rgba(17,20,36,.9)" : "rgba(22,32,210,.9)",
          ),
        );
      };
      const img = await texture();
      if (disposed) return;
      shader = lib.mountFlutedGlass(host, img, {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      });
      if (!shader) return;
      stage.dataset.glass = "on";
      drawnShift = Number.NaN;
      push();
      const onLost = () => {
        shader?.dispose();
        shader = null;
        host.replaceChildren();
        delete stage.dataset.glass;
      };
      for (const c of host.querySelectorAll("canvas"))
        c.addEventListener("webglcontextlost", onLost, { once: true });

      const updateTexture = async () => {
        const next = await texture();
        if (!disposed && shader) shader.setUniforms({ u_image: next });
      };

      let timer = 0;
      const onResize = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(updateTexture, 200);
      };
      window.addEventListener("resize", onResize);
      window.addEventListener("wu:theme-change", updateTexture);
      cleanups.push(() => {
        window.clearTimeout(timer);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("wu:theme-change", updateTexture);
      });
    };
    mountGlass().catch((err: unknown) => {
      // If WebGL fails, sequence proceeds with CSS flute fallback.
      console.error("[glass]", err);
    });

    return teardown;
  }, [allowed]);

  // Keep menu outside pinned element to maintain fixed viewport positioning.
  return (
    <>
      <header ref={pinRef} className={styles.pin} data-bg="dark">
        <div ref={stageRef} className={styles.stage}>
          <div ref={panelRef} className={styles.panel}>
            <div
              ref={glassRef}
              className={styles.glassLayer}
              aria-hidden="true"
            >
              <div data-shader className={styles.shader} />
            </div>
          </div>
          {children}
        </div>
      </header>
      {menu}
    </>
  );
}
