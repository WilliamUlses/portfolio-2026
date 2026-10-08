import Link from "next/link";
import { parseDisplay } from "@/content/display-text";
import type { Profile } from "@/content/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { href } from "@/i18n/routes";
import { MonogramFallback } from "../MonogramFallback";
import styles from "./About.module.css";
import { AboutText, AboutVisual } from "./AboutMotion";

// Home about section: 3D glass monogram visual alongside profile statement, facts, and link to about page.
export function About({
  profile,
  dict,
  locale,
}: {
  profile: Profile;
  dict: Dictionary;
  locale: Locale;
}) {
  const { about } = profile;
  const statement = parseDisplay(about.statement).flat();
  return (
    <section className={styles.section} aria-labelledby="a-propos">
      <AboutVisual fallback={<MonogramFallback />} />
      <AboutText>
        <h2 id="a-propos" className={styles.label}>
          {dict.home.about}
        </h2>
        <p className={styles.statement} data-statement>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        {about.intro ? (
          <p className={styles.intro} data-rest>
            {about.intro}
          </p>
        ) : null}
        <dl className={styles.facts} data-rest>
          {about.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
        <Link href={href("about", locale)} className={styles.more} data-rest>
          {dict.home.moreAbout}
          <span aria-hidden="true"> →</span>
        </Link>
      </AboutText>
    </section>
  );
}
