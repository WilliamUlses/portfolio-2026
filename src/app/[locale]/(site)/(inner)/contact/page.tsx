import type { Metadata } from "next";
import { BookingButton } from "@/components/site/BookingButton";
import { ContactForm } from "@/components/site/ContactForm";
import contactStyles from "@/components/site/home/Contact.module.css";
import { CopyEmail } from "@/components/site/home/CopyEmail";
import { MotionTitle } from "@/components/site/MotionTitle";
import { SOCIAL_NAMES } from "@/components/site/social-names";
import { parseDisplay } from "@/content/display-text";
import { getLocaleContext } from "@/i18n/server";
import { getCvUrl } from "@/lib/cv";
import { pageMetadata } from "@/seo/metadata";
import { getSiteSettings } from "@/server/queries";
import styles from "./contact.module.css";

// Contact page: animated statement header, contact details list, and interactive contact form.
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  return pageMetadata({
    page: "contact",
    locale,
    title: dict.contact.title,
    siteName: settings.name,
    description: dict.contact.description,
  });
}

export default async function ContactPage() {
  const { locale, dict } = await getLocaleContext();
  const settings = await getSiteSettings();
  const cvUrl = getCvUrl();
  const t = dict.contact;
  const statement = parseDisplay(t.statement).flat();
  const socials = Object.entries(settings.socials);

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <p className={styles.label}>{t.title}</p>
        <MotionTitle className={styles.statement}>
          {statement.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </MotionTitle>
        <p className={styles.lede}>{t.intro}</p>
      </header>

      <div className={styles.body}>
        <dl className={styles.details}>
          <div>
            <dt>{t.emailLabel}</dt>
            <dd>
              <a className={styles.email} href={`mailto:${settings.email}`}>
                {settings.email}
              </a>
              <CopyEmail
                email={settings.email}
                label={dict.home.copyEmail}
                copied={dict.home.copied}
              />
            </dd>
          </div>
          <div>
            <dt>{t.responseLabel}</dt>
            <dd>{t.responseValue}</dd>
          </div>
          <div>
            <dt>{t.availabilityLabel}</dt>
            <dd>{t.availabilityValue}</dd>
          </div>
          <div>
            <dt>{t.elsewhere}</dt>
            <dd>
              <ul className={contactStyles.links}>
                <li>
                  <BookingButton
                    label={t.bookCall}
                    locale={locale}
                    dict={dict.booking}
                    className={contactStyles.pill}
                    showIcon
                  />
                </li>
                {socials.map(([key, url]) => (
                  <li key={key}>
                    <a
                      className={contactStyles.pill}
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
                {cvUrl ? (
                  <li>
                    <a
                      className={contactStyles.pill}
                      href={cvUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>
                        {t.cv}
                        <span aria-hidden="true"> ↓</span>
                      </span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </dd>
          </div>
        </dl>

        <section className={styles.form} aria-labelledby="formulaire">
          <h2 id="formulaire" className={styles.formTitle}>
            {t.form.formTitle}
          </h2>
          <ContactForm
            locale={locale}
            labels={t.form}
            email={settings.email}
            bookingDict={dict.booking}
          />
        </section>
      </div>
    </div>
  );
}
