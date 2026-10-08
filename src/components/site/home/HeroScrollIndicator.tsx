"use client";

import { useEffect, useState } from "react";
import styles from "./HeroScrollIndicator.module.css";

export function HeroScrollIndicator({ label }: { label: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY > 24) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    // Scroll down past the initial hero view into the sequence / approach
    const targetY = window.innerHeight * 0.95;
    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      className={styles.indicatorPill}
      onClick={handleClick}
      data-scrolled={scrolled}
      aria-label={label}
      tabIndex={scrolled ? -1 : 0}
    >
      <span className={styles.text}>{label}</span>
      <span className={styles.arrow} aria-hidden="true">
        ↓
      </span>
    </button>
  );
}
