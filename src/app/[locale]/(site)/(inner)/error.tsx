"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import contactStyles from "@/components/site/home/Contact.module.css";
import styles from "@/components/site/NotFoundContent.module.css";

// Storefront error boundary fallback UI
const TEXT = {
  fr: {
    label: "Erreur",
    title: "Quelque chose s'est mal passé",
    text: "La page n'a pas pu s'afficher. Réessayez, ou revenez à l'accueil.",
    retry: "Réessayer",
    home: "Retour à l'accueil",
  },
  en: {
    label: "Error",
    title: "Something went wrong",
    text: "This page couldn't be displayed. Try again, or go back to the home page.",
    retry: "Try again",
    home: "Back to home",
  },
};

export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { locale } = useParams<{ locale: string }>();
  const lang = locale === "en" ? "en" : "fr";
  const t = TEXT[lang];
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.page}>
      <p className={styles.code} aria-hidden="true">
        <b>!</b>
      </p>
      <div className={styles.text}>
        <p className={styles.label}>{t.label}</p>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.lede}>{t.text}</p>
        <ul className={contactStyles.links}>
          <li>
            <button
              type="button"
              onClick={() => retry()}
              className={`${contactStyles.pill} ${styles.primary}`}
            >
              <span>{t.retry}</span>
            </button>
          </li>
          <li>
            <Link href={`/${lang}`} className={contactStyles.pill}>
              <span>{t.home}</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
