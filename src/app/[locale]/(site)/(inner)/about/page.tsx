import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { AboutVisual } from "@/components/site/home/AboutMotion";
import contactStyles from "@/components/site/home/Contact.module.css";
import { CopyEmail } from "@/components/site/home/CopyEmail";
import { JsonLd } from "@/components/site/JsonLd";
import { MonogramFallback } from "@/components/site/MonogramFallback";
import { MotionTitle } from "@/components/site/MotionTitle";
import { ProcessTimeline } from "@/components/site/ProcessTimeline";
import { StackLogo } from "@/components/site/StackLogo";
import { SOCIAL_NAMES } from "@/components/site/social-names";
import { parseDisplay } from "@/content/display-text";
import { getProfile } from "@/content/profile";
import { STACK_SKILLS, stack } from "@/content/stack";
import { href } from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { getCvUrl } from "@/lib/cv";
import { identityJsonLd } from "@/seo/identity";
import { pageMetadata } from "@/seo/metadata";
import { getSiteSettings } from "@/server/queries";
import styles from "./about.module.css";
import { Journey } from "./Journey";

// About page: intro statement, career journey timeline, stack tools, and availability/contact.
export async function generateMetadata(): Promise<Metadata> {
  const [{ locale, dict }, settings] = await Promise.all([
    getLocaleContext(),
    getSiteSettings(),
  ]);
  return pageMetadata({
    page: "about",
    locale,
    title: dict.about.title,
    siteName: settings.name,
    description: dict.about.description,
  });
}

export default async function AboutPage() {
  const { locale, dict } = await getLocaleContext();
  const settings = await getSiteSettings();
  const cvUrl = getCvUrl();
  const profile = getProfile(locale);
  const t = dict.about;
  const statement = parseDisplay(profile.about.statement).flat();
  const availability = parseDisplay(t.availabilityStatement).flat();

  return (
    <div className={styles.page}>
      <JsonLd data={identityJsonLd(settings, locale)} />

      {/* Intro */}
      <section className={styles.intro}>
        <div className={styles.visual}>
          <AboutVisual
            fallback={
              <MonogramFallback
                priority
                sizes="(min-width: 768px) 40vw, 80vw"
              />
            }
          />
        </div>
        <div className={styles.text}>
          <p className={styles.label}>{t.title}</p>
          <MotionTitle className={styles.statement}>
            {statement.map((seg) =>
              seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
            )}
          </MotionTitle>
          <p className={styles.lede}>{profile.about.intro}</p>
          <dl className={styles.facts}>
            {profile.about.facts.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Timeline */}
      <Journey steps={profile.journey} label={t.timeline} />

      {/* Process phases (2.2) */}
      <ProcessTimeline steps={profile.processSteps} sectionLabel={t.process} />

      {/* Tools */}
      <section className={styles.tools} aria-labelledby="outils">
        <header className={styles.head}>
          <h2 id="outils" className={styles.label}>
            {t.tools}
          </h2>
          <span className={styles.count}>
            {String(stack.length).padStart(2, "0")}
          </span>
        </header>
        {STACK_SKILLS.map((skill) => {
          const tools = stack.filter((tool) => tool.skill === skill.key);
          if (tools.length === 0) return null;
          return (
            <div key={skill.key} className={styles.skill}>
              <h3 className={styles.skillName}>
                {skill.label[locale]}
                <sup>{tools.length}</sup>
              </h3>
              <ul className={styles.toolGrid}>
                {tools.map((tool) => (
                  <li
                    key={tool.name}
                    className={styles.tool}
                    style={
                      tool.logo.kind === "brand" && tool.logo.color
                        ? ({ "--brand": tool.logo.color } as CSSProperties)
                        : undefined
                    }
                  >
                    <span className={styles.toolLogo}>
                      <StackLogo
                        logo={tool.logo}
                        pictogramClassName={styles.pictogram}
                      />
                    </span>
                    <span className={styles.toolName}>{tool.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* Availability */}
      <section className={styles.availability} aria-labelledby="disponibilite">
        <h2 id="disponibilite" className={styles.label}>
          {t.availability}
        </h2>
        <p className={styles.availStatement}>
          {availability.map((seg) =>
            seg.fat ? <b key={seg.text}>{seg.text}</b> : seg.text,
          )}
        </p>
        <ul className={contactStyles.links}>
          <li>
            <Link
              href={href("contact", locale)}
              className={`${contactStyles.pill} ${styles.primary}`}
            >
              <span>
                {t.contact}
                <span aria-hidden="true"> ↗</span>
              </span>
            </Link>
          </li>
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
                  {t.cvButton}
                  <span aria-hidden="true"> ↓</span>
                </span>
              </a>
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
