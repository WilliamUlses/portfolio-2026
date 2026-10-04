"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Locale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/config";
import { href, switchLocalePath } from "@/i18n/routes";
import { glassMapUrl } from "@/motion/glass-map";
import styles from "./MobileDrawer.module.css";
import { Monogram } from "./Monogram";
import { Arrow, type MenuLabels } from "./SiteMenu";
import { THEME_COOKIE, type ThemeLabels } from "./ThemeSwitcher";

// Liquid glass parameters matching the floating navigation bar with optical blur diffusion
const GLASS = {
  radius: 30,
  bezel: 26,
  lateral: 0.55,
  jitter: 0.35,
  scale: { r: 42, g: 39, b: 35 },
  soften: { before: 16, after: 6 },
};

export function MobileDrawer({
  isOpen,
  onClose,
  locale,
  labels,
  projectCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  locale: Locale;
  labels: MenuLabels;
  projectCount: number;
}) {
  const pathname = usePathname();
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [glass, setGlass] = useState(false);
  const [modalSize, setModalSize] = useState<{ w: number; h: number } | null>(
    null,
  );
  const [map, setMap] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close instantly when page navigation begins to show curtain transition cleanly
  useEffect(() => {
    const onNavStart = () => {
      onClose();
    };
    window.addEventListener("wu:nav-start", onNavStart);
    return () => window.removeEventListener("wu:nav-start", onNavStart);
  }, [onClose]);

  // Detect Chromium for displacement filter support
  useEffect(() => {
    const brands =
      (
        navigator as Navigator & {
          userAgentData?: { brands: { brand: string }[] };
        }
      ).userAgentData?.brands ?? [];
    setGlass(brands.some((b) => b.brand === "Chromium"));
  }, []);

  // Lock scrolling unconditionally across desktop and touch devices
  useEffect(() => {
    if (!isOpen) return;

    // Signal Lenis smooth scroll to pause
    window.dispatchEvent(new CustomEvent("wu:modal-open"));
    document.documentElement.dataset.drawerOpen = "true";
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Block wheel events outside modal
    const onWheel = (e: WheelEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    // Block touch gestures outside modal (iOS scroll leak)
    const onTouchMove = (e: TouchEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.dispatchEvent(new CustomEvent("wu:modal-close"));
      delete document.documentElement.dataset.drawerOpen;
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [isOpen]);

  // Measure modal using offsetWidth/offsetHeight to ignore any transform: scale
  useLayoutEffect(() => {
    if (!isOpen) return;
    const modal = modalRef.current;
    if (!modal) return;
    const measure = () => {
      // Use offsetWidth/offsetHeight which are unscaled layout dimensions
      const w = modal.offsetWidth;
      const h = modal.offsetHeight;
      if (w > 0 && h > 0) {
        setModalSize((prev) =>
          prev && prev.w === w && prev.h === h ? prev : { w, h },
        );
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(modal);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isOpen]);

  // Generate displacement map when size or chromium status changes
  useEffect(() => {
    if (glass && modalSize) {
      setMap(
        glassMapUrl(
          modalSize.w,
          modalSize.h,
          GLASS.radius,
          GLASS.bezel,
          GLASS.lateral,
          GLASS.jitter,
          Math.min(window.devicePixelRatio || 1, 2),
        ),
      );
    }
  }, [glass, modalSize]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const homePath = href("home", locale);
  const projectsPath = href("projects", locale);
  const aboutPath = href("about", locale);
  const contactPath = href("contact", locale);

  // Exact matching for homepage so that subpaths like /fr/a-propos do not activate Home
  const isHome =
    pathname === homePath ||
    pathname === `${homePath}/` ||
    pathname === "/" ||
    pathname === "";

  const current = (path: string) => {
    if (path === homePath) {
      return isHome ? "page" : undefined;
    }
    if (isHome) {
      return undefined;
    }
    return pathname === path || pathname.startsWith(`${path}/`)
      ? "page"
      : undefined;
  };

  const homeTitle = locale === "fr" ? "Accueil" : "Home";

  const navLinks = [
    {
      title: homeTitle,
      href: homePath,
      label: labels.home,
    },
    {
      title: labels.projects,
      href: projectsPath,
      label: labels.projects,
      badge: projectCount,
    },
    {
      title: labels.about,
      href: aboutPath,
      label: labels.about,
    },
    {
      title: labels.contactShort || labels.contact,
      href: contactPath,
      label: labels.contact,
    },
  ];

  if (!mounted) return null;

  return createPortal(
    <div
      className={styles.overlay}
      data-open={isOpen}
      role="dialog"
      aria-modal="true"
      aria-label={labels.menu}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={styles.backdrop}
        onClick={onClose}
        aria-label={labels.close}
        tabIndex={isOpen ? 0 : -1}
      />

      <div
        ref={modalRef}
        className={styles.modal}
        data-glass={glass && map ? "" : undefined}
      >
        {glass && map && modalSize ? (
          <DrawerGlassFilter
            map={map}
            width={modalSize.w}
            height={modalSize.h}
          />
        ) : null}

        {/* Header bar with Monogram & Close button */}
        <div className={styles.topBar}>
          <div className={styles.brand}>
            <Monogram size={28} />
            <div className={styles.brandText}>
              <span className={styles.brandName}>William Ulses</span>
              <span className={styles.brandTag}>[ {labels.menu} ]</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label={labels.close}
            tabIndex={isOpen ? 0 : -1}
          >
            ✕
          </button>
        </div>

        {/* Clean page navigation links (pure Apple aesthetic) */}
        <nav aria-label={labels.label}>
          <ul className={styles.navList}>
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={styles.navLink}
                  aria-current={current(item.href)}
                  data-transition-label={item.label}
                  onClick={onClose}
                  tabIndex={isOpen ? 0 : -1}
                >
                  <span>{item.title}</span>
                  {item.badge !== undefined ? (
                    <span className={styles.navBadge}>{item.badge}</span>
                  ) : (
                    <Arrow className={styles.navArrow} />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Apple Control Center Grid */}
        <div className={styles.controlsGrid}>
          {/* Language tile with Apple switch flanked by French & English flags */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <span className={styles.controlTitle}>Langue</span>
            </div>
            <AppleLanguageToggle
              pathname={pathname}
              locale={locale}
              onClose={onClose}
              tabIndex={isOpen ? 0 : -1}
            />
          </div>

          {/* Theme tile with Apple UI Kit Toggle Switch */}
          <div className={styles.controlCard}>
            <div className={styles.controlHeader}>
              <span className={styles.controlTitle}>{labels.theme}</span>
            </div>
            <AppleThemeToggle
              labels={{
                theme: labels.theme,
                dark: labels.dark,
                light: labels.light,
              }}
              tabIndex={isOpen ? 0 : -1}
            />
          </div>
        </div>

        {/* Footer info */}
        <div className={styles.footerDirect}>
          <a
            href="mailto:contact@williamulses.fr"
            className={styles.directEmail}
            tabIndex={isOpen ? 0 : -1}
          >
            contact@williamulses.fr ↗
          </a>
          <span>Paris, FR</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Liquid glass refraction filter for the modal card:
 * Displaces background through displacement map per RGB channel, recombining for physical chromatic dispersion.
 */
function DrawerGlassFilter({
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
        id="drawer-glass"
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

/**
 * Apple UI Kit Switch Toggle for Dark/Light mode flanked by Sun & Moon icons
 */
function AppleThemeToggle({
  labels,
  tabIndex,
}: {
  labels: ThemeLabels;
  tabIndex?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const root = document.documentElement;
    const currentIsDark =
      root.classList.contains("dark") || root.dataset.theme === "dark";
    setIsDark(currentIsDark);
  }, []);

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
    const root = document.documentElement;
    const nextTheme = dark ? "dark" : "light";

    if (dark) {
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
    } catch {}

    window.dispatchEvent(
      new CustomEvent("wu:theme-change", { detail: { theme: nextTheme } }),
    );
  };

  const toggle = () => setTheme(!isDark);

  const actionLabel = !mounted
    ? labels.theme
    : isDark
      ? labels.light
      : labels.dark;

  return (
    <div className={styles.toggleRowWithSides}>
      {/* Light option: Sun icon */}
      <button
        type="button"
        className={styles.sideOption}
        data-active={!isDark}
        onClick={() => setTheme(false)}
        aria-label={labels.light}
        title={labels.light}
        tabIndex={tabIndex}
      >
        <span className={styles.sideIcon}>
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </span>
      </button>

      {/* Center Apple iOS Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        className={styles.appleSwitch}
        data-checked={isDark}
        onClick={toggle}
        aria-label={actionLabel}
        title={actionLabel}
        tabIndex={tabIndex}
      >
        <span className={styles.appleSwitchThumb} aria-hidden="true" />
      </button>

      {/* Dark option: Moon icon */}
      <button
        type="button"
        className={styles.sideOption}
        data-active={isDark}
        onClick={() => setTheme(true)}
        aria-label={labels.dark}
        title={labels.dark}
        tabIndex={tabIndex}
      >
        <span className={styles.sideIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </span>
      </button>
    </div>
  );
}

/**
 * Apple UI Kit Switch Toggle for Language flanked by French & English flags
 */
function AppleLanguageToggle({
  pathname,
  locale,
  onClose,
  tabIndex,
}: {
  pathname: string;
  locale: Locale;
  onClose: () => void;
  tabIndex?: number;
}) {
  const isEn = locale === "en";
  const frHref = switchLocalePath(pathname, "fr");
  const enHref = switchLocalePath(pathname, "en");

  const setLocalePref = (loc: Locale) => {
    // biome-ignore lint/suspicious/noDocumentCookie: non-sensitive preference cookie read by proxy
    document.cookie = `${LOCALE_COOKIE}=${loc}; path=/; max-age=31536000; samesite=lax`;
    onClose();
  };

  return (
    <div className={styles.toggleRowWithSides}>
      {/* French option */}
      <Link
        href={frHref}
        className={styles.sideOption}
        data-active={!isEn}
        onClick={() => setLocalePref("fr")}
        aria-label="Français"
        title="Français"
        tabIndex={tabIndex}
      >
        <span className={styles.flagIcon} aria-hidden="true">
          🇫🇷
        </span>
      </Link>

      {/* Center Apple iOS Switch */}
      <Link
        href={isEn ? frHref : enHref}
        role="switch"
        aria-checked={isEn}
        className={styles.appleSwitch}
        data-checked={isEn}
        onClick={() => setLocalePref(isEn ? "fr" : "en")}
        aria-label={isEn ? "Passer en Français" : "Switch to English"}
        title={isEn ? "Passer en Français" : "Switch to English"}
        tabIndex={tabIndex}
      >
        <span className={styles.appleSwitchThumb} aria-hidden="true" />
      </Link>

      {/* English option */}
      <Link
        href={enHref}
        className={styles.sideOption}
        data-active={isEn}
        onClick={() => setLocalePref("en")}
        aria-label="English"
        title="English"
        tabIndex={tabIndex}
      >
        <span className={styles.flagIcon} aria-hidden="true">
          🇬🇧
        </span>
      </Link>
    </div>
  );
}
