import type { Profile } from "@/content/profile";
import type { SiteSettings } from "@/content/settings";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getCvUrl } from "@/lib/cv";
import { BookingButton } from "./BookingButton";
import styles from "./Footer.module.css";
import { FooterWordmark } from "./FooterWordmark";
import { LegalNotice } from "./LegalNotice";
import { SOCIAL_NAMES } from "./social-names";

// Copyright year evaluated at module load
const YEAR = new Date().getFullYear();

// Storefront footer signature with social links, metadata, and oversized wordmark.
export function Footer({
  settings,
  profile,
  dict,
  locale,
}: {
  settings: SiteSettings;
  profile: Profile;
  dict: Dictionary;
  locale: Locale;
}) {
  const [first, ...rest] = settings.name.split(" ");
  const cvUrl = getCvUrl();
  return (
    <footer className={styles.footer} data-bg="dark">
      <div className={styles.info}>
        <div>
          <span className={styles.key}>{dict.footer.socials}</span>
          <ul>
            <li>
              <BookingButton
                label={dict.footer.bookCall}
                locale={locale}
                dict={dict.booking}
                className={styles.bookCallBtn}
                showIcon
              />
            </li>
            {Object.entries(settings.socials).map(([key, url]) => (
              <li key={key}>
                <a href={url} rel="me noopener noreferrer" target="_blank">
                  {SOCIAL_NAMES[key] ?? key}
                </a>
              </li>
            ))}
            {cvUrl ? (
              <li>
                <a
                  href={cvUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {dict.footer.cv}
                  <span aria-hidden="true"> ↓</span>
                </a>
              </li>
            ) : null}
          </ul>
        </div>
        <p>
          <span className={styles.key}>{dict.footer.basedIn}</span>
          {profile.footer.basedIn}
        </p>
        <p>
          <span className={styles.key}>{dict.footer.availability}</span>
          {profile.footer.availability}
        </p>
        <div className={styles.end}>
          <span className={styles.key}>©{YEAR}</span>
          <a href="#top">{dict.footer.backToTop}</a>
          <LegalNotice dict={dict} />
        </div>
      </div>
      <FooterWordmark first={first ?? ""} last={rest.join(" ")} />
    </footer>
  );
}
