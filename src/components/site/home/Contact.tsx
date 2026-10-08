import { parseDisplay } from "@/content/display-text";
import type { SiteSettings } from "@/content/settings";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { ContactForm } from "../ContactForm";
import { SOCIAL_NAMES } from "../social-names";
import styles from "./Contact.module.css";
import { CopyEmail } from "./CopyEmail";

// Home contact section: statement, response delay, social links, and embedded contact form.
export function Contact({
  settings,
  locale,
  dict,
}: {
  settings: SiteSettings;
  locale: Locale;
  dict: Dictionary;
}) {
  const statement = parseDisplay(dict.home.contactStatement).flat();
  return (
    <section className={styles.section} aria-labelledby="contact-home">
      <div className={styles.aside}>
        <h2 id="contact-home" className={styles.label}>
          {dict.home.contactLabel}
        </h2>
        <p className={styles.statement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        <p className={styles.lede}>{dict.home.contactLede}</p>
        <ul className={styles.links}>
          <li>
            <CopyEmail
              email={settings.email}
              label={dict.home.copyEmail}
              copied={dict.home.copied}
            />
          </li>
          {Object.entries(settings.socials).map(([key, url]) => (
            <li key={key}>
              <a
                className={styles.pill}
                href={url}
                rel="me noopener noreferrer"
                target="_blank"
              >
                <span>
                  {SOCIAL_NAMES[key] ?? key}
                  <span aria-hidden="true"> ↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.form}>
        <ContactForm
          locale={locale}
          labels={dict.contact.form}
          email={settings.email}
          bookingDict={dict.booking}
        />
      </div>
    </section>
  );
}
