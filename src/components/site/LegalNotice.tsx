"use client";

import { useEffect, useId, useState } from "react";
import type { Dictionary } from "@/i18n/get-dictionary";
import styles from "./LegalNotice.module.css";

interface LegalNoticeProps {
  dict: Dictionary;
}

export function LegalNotice({ dict }: LegalNoticeProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {dict.footer.legal}
      </button>

      {open && (
        <div className={styles.backdrop}>
          <button
            type="button"
            className={styles.backdropHit}
            onClick={() => setOpen(false)}
            aria-label={dict.legal.close}
            tabIndex={-1}
          />
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <div className={styles.header}>
              <h2 id={titleId} className={styles.title}>
                {dict.legal.title}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label={dict.legal.close}
              >
                {dict.legal.close}
              </button>
            </div>

            <div className={styles.body}>
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  {dict.legal.editorTitle}
                </h3>
                <p className={styles.sectionText}>{dict.legal.editorText}</p>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  {dict.legal.hostingTitle}
                </h3>
                <p className={styles.sectionText}>{dict.legal.hostingText}</p>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>{dict.legal.ipTitle}</h3>
                <p className={styles.sectionText}>{dict.legal.ipText}</p>
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  {dict.legal.privacyTitle}
                </h3>
                <p className={styles.sectionText}>{dict.legal.privacyText}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
