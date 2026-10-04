"use client";

import { useState } from "react";
import styles from "./Contact.module.css";

// Copies email to clipboard with screen reader announcement and mailto fallback.
export function CopyEmail({
  email,
  label,
  copied,
}: {
  email: string;
  label: string;
  copied: string;
}) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={styles.pill}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setDone(true);
          window.setTimeout(() => setDone(false), 2400);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
    >
      <span aria-live="polite">{done ? copied : label}</span>
      <span className={styles.pillHint}>{email}</span>
    </button>
  );
}
