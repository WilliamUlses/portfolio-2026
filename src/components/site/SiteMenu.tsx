"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { href } from "@/i18n/routes";
import { glassMapUrl } from "@/motion/glass-map";
import { onScrollProgress } from "@/motion/scroll-progress";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileDrawer } from "./MobileDrawer";
import { Monogram } from "./Monogram";
import styles from "./SiteMenu.module.css";
import { ThemeSwitcher } from "./ThemeSwitcher";

// Fixed bottom navigation: expands as hero bar on home, shrinks to liquid glass pill on scroll.

export type MenuLabels = {
  label: string;
  projects: string;
  projectsCount: string;
  about: string;
  contact: string;
  contactShort: string;
  language: string;
  home: string;
  theme: string;
  dark: string;
  light: string;
  menu: string;
  close: string;
};

const HERO_EXIT = 0.12;
const PILL_GAP = 2;
const PILL_PAD = 6;
// Glass refraction and chromatic aberration parameters
const GLASS = {
  radius: 18,
  bezel: 18,
  lateral: 0.55,
  jitter: 0.35,
  scale: { r: 38, g: 37, b: 34.5 },
  soften: { before: 0.6, after: 0.3 },
};

const RING_R = 16.5;
const RING_C = 2 * Math.PI * RING_R;

export function SiteMenu({
  locale,
  labels,
  projectCount,
  variant,
}: {
  locale: Locale;
  labels: MenuLabels;
  projectCount: number;
  variant: "hero" | "page";
}) {
  const pathname = usePathname();
  const listRef = useRef<HTMLUListElement>(null);
  // Circular scroll progress indicator around monogram
  const ringRef = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    return onScrollProgress((p) => {
      ring.style.strokeDashoffset = String(RING_C * (1 - p));
    });
  }, []);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mode, setMode] = useState<"bar" | "pill">(
    variant === "hero" ? "bar" : "pill",
  );
  const other: Locale = locale === "fr" ? "en" : "fr";

  // Close mobile drawer on route change
  const currentPathRef = useRef(pathname);
  useEffect(() => {
    if (currentPathRef.current !== pathname) {
      currentPathRef.current = pathname;
      setIsDrawerOpen(false);
    }
  }, [pathname]);

  // Transition bar to pill when scrolling past hero threshold
  useEffect(() => {
    if (variant !== "hero") return;
    const update = () =>
      setMode(window.scrollY > window.innerHeight * HERO_EXIT ? "pill" : "bar");
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [variant]);

  // Compute natural width of pill items to animate width
  useLayoutEffect(() => {
    const list = listRef.current;
    const nav = list?.parentElement;
    if (!list || !nav) return;
    const measure = () => {
      const items = [...list.children] as HTMLElement[];
      const visible = items.filter(
        (li) => li.getBoundingClientRect().width > 0,
      );
      const w =
        visible.reduce((sum, li) => sum + li.getBoundingClientRect().width, 0) +
        PILL_GAP * Math.max(0, visible.length - 1) +
        PILL_PAD * 2;
      nav.style.setProperty("--pill-w", `${Math.ceil(w)}px`);
      setPill((p) => {
        const next = { w: Math.ceil(w), h: nav.offsetHeight };
        return p && p.w === next.w && p.h === next.h ? p : next;
      });
    };
    measure();
    void document.fonts.ready.then(measure);
    const ro = new ResizeObserver(measure);
    for (const li of list.children) ro.observe(li);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Liquid glass refraction via SVG displacement filter (Chromium only)
  const [glass, setGlass] = useState(false);
  const [pill, setPill] = useState<{ w: number; h: number } | null>(null);
  const [map, setMap] = useState("");
  useEffect(() => {
    const brands =
      (
        navigator as Navigator & {
          userAgentData?: { brands: { brand: string }[] };
        }
      ).userAgentData?.brands ?? [];
    setGlass(brands.some((b) => b.brand === "Chromium"));
  }, []);
  useEffect(() => {
    if (glass && pill)
      setMap(
        glassMapUrl(
          pill.w,
          pill.h,
          GLASS.radius,
          GLASS.bezel,
          GLASS.lateral,
          GLASS.jitter,
          Math.min(window.devicePixelRatio || 1, 2),
        ),
      );
  }, [glass, pill]);

  const current = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`) ? "page" : undefined;
  const projects = href("projects", locale);
  const about = href("about", locale);

  return (
    <>
      <nav
        aria-label={labels.label}
        className={styles.menu}
        data-mode={mode}
        data-glass={glass && map ? "" : undefined}
      >
        {glass && map && pill ? (
          <GlassFilter map={map} width={pill.w} height={pill.h} />
        ) : null}
        <ul ref={listRef} className={styles.list}>
          <li>
            <Link
              href={href("home", locale)}
              className={`${styles.item} ${styles.mark}`}
              aria-label={labels.home}
              data-transition-label={labels.home}
            >
              <Monogram size={26} />
              <svg
                className={styles.markRing}
                viewBox="0 0 36 36"
                aria-hidden="true"
                focusable="false"
              >
                <circle
                  ref={ringRef}
                  cx="18"
                  cy="18"
                  r={RING_R}
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C}
                />
              </svg>
            </Link>
          </li>
          <li>
            <Link
              href={projects}
              className={styles.item}
              data-transition-label={labels.projects}
              aria-current={current(projects)}
            >
              {labels.projects}
              <sup aria-hidden="true">{projectCount}</sup>
              <span className="sr-only">
                {" "}
                ({projectCount} {labels.projectsCount})
              </span>
            </Link>
          </li>
          <li className={styles.desktopOnly}>
            <Link
              href={about}
              className={styles.item}
              data-transition-label={labels.about}
              aria-current={current(about)}
            >
              {labels.about}
            </Link>
          </li>
          <li className={`${styles.lang} ${styles.desktopOnly}`}>
            <LanguageSwitcher
              className={styles.item}
              target={other}
              label={labels.language}
              text={other.toUpperCase()}
            />
          </li>
          <li className={styles.desktopOnly}>
            <ThemeSwitcher
              className={styles.item}
              labels={{
                theme: labels.theme,
                dark: labels.dark,
                light: labels.light,
              }}
            />
          </li>
          <li>
            <Link
              href={href("contact", locale)}
              className={`${styles.item} ${styles.cta}`}
              data-transition-label={labels.contact}
              aria-current={current(href("contact", locale))}
            >
              <span className={styles.ctaDesktop}>{labels.contact}</span>
              <span className={styles.ctaMobile}>{labels.contactShort}</span>
              <Arrow />
            </Link>
          </li>
          <li className={styles.mobileOnly}>
            <button
              type="button"
              className={`${styles.item} ${styles.menuTrigger}`}
              onClick={() => setIsDrawerOpen((open) => !open)}
              aria-label={isDrawerOpen ? labels.close : labels.menu}
              aria-expanded={isDrawerOpen}
              aria-haspopup="dialog"
            >
              <span
                className={styles.burgerIcon}
                data-open={isDrawerOpen}
                aria-hidden="true"
              >
                <span />
                <span />
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        locale={locale}
        labels={labels}
        projectCount={projectCount}
      />
    </>
  );
}

/**
 * Liquid glass effect: displaces background through map per RGB channel, recombining for dispersion.
 */
function GlassFilter({
  map,
  width,
  height,
}: {
  map: string;
  width: number;
  height: number;
}) {
  const only = (r: number, g: number, b: number) =>
    `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`;
  const channels = [
    { key: "r", scale: GLASS.scale.r, matrix: only(1, 0, 0) },
    { key: "g", scale: GLASS.scale.g, matrix: only(0, 1, 0) },
    { key: "b", scale: GLASS.scale.b, matrix: only(0, 0, 1) },
  ];
  return (
    <svg className={styles.defs} aria-hidden="true" focusable="false">
      <filter
        id="menu-glass"
        x="0"
        y="0"
        width={width}
        height={height}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feImage
          href={map}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="none"
          result="map"
        />
        <feGaussianBlur
          in="SourceGraphic"
          stdDeviation={GLASS.soften.before}
          result="soft"
        />
        {channels.map((c) => [
          <feDisplacementMap
            key={`d${c.key}`}
            in="soft"
            in2="map"
            scale={c.scale}
            xChannelSelector="R"
            yChannelSelector="G"
            result={`d${c.key}`}
          />,
          <feColorMatrix
            key={c.key}
            in={`d${c.key}`}
            values={c.matrix}
            result={c.key}
          />,
        ])}
        <feComposite
          in="r"
          in2="g"
          operator="arithmetic"
          k2="1"
          k3="1"
          result="rg"
        />
        <feComposite
          in="rg"
          in2="b"
          operator="arithmetic"
          k2="1"
          k3="1"
          result="rgb"
        />
        <feGaussianBlur in="rgb" stdDeviation={GLASS.soften.after} />
      </filter>
    </svg>
  );
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width="0.8em"
      height="0.8em"
      aria-hidden="true"
    >
      <path
        d="M4 12 12 4M5.5 4H12v6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="square"
      />
    </svg>
  );
}
