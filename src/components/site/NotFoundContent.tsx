import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { href } from "@/i18n/routes";
import contactStyles from "./home/Contact.module.css";
import { MotionTitle } from "./MotionTitle";
import styles from "./NotFoundContent.module.css";

// 404 page content: decorative backdrop code, animated entrance title, and navigation links.
export function NotFoundContent({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const t = dict.notFound;
  return (
    <div className={styles.page}>
      <p className={styles.code} aria-hidden="true">
        4<b>0</b>4
      </p>
      <div className={styles.text}>
        <p className={styles.label}>{t.label}</p>
        <MotionTitle className={styles.title} weight>
          {t.title}
        </MotionTitle>
        <p className={styles.lede}>{t.text}</p>
        <ul className={contactStyles.links}>
          <li>
            <Link
              href={href("projects", locale)}
              className={`${contactStyles.pill} ${styles.primary}`}
            >
              <span>
                {t.back}
                <span aria-hidden="true"> ↗</span>
              </span>
            </Link>
          </li>
          <li>
            <Link href={href("home", locale)} className={contactStyles.pill}>
              <span>{t.home}</span>
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
