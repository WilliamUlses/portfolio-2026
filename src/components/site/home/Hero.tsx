import type { Profile } from "@/content/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { DisplayTitle } from "../DisplayTitle";
import { menuLabels } from "../menu-labels";
import { SiteMenu } from "../SiteMenu";
import styles from "./Hero.module.css";
import { HeroScrollIndicator } from "./HeroScrollIndicator";
import { HeroStage } from "./HeroStage";

// Home hero layout: oversized typography on cobalt backdrop with pinned menu bar.
// On desktop, HeroStage animates the cobalt background into the approach card with step reveals.
export function Hero({
  locale,
  dict,
  siteName,
  profile,
  projectCount,
}: {
  locale: Locale;
  dict: Dictionary;
  siteName: string;
  profile: Profile;
  projectCount: number;
}) {
  const [first, ...rest] = siteName.split(" ");
  const total = String(profile.steps.length).padStart(2, "0");
  return (
    <HeroStage
      menu={
        <SiteMenu
          locale={locale}
          labels={menuLabels(dict)}
          projectCount={projectCount}
          variant="hero"
        />
      }
    >
      <div className={styles.hero} data-hero>
        <div className={styles.body}>
          <h1 className={styles.name}>
            <span className={styles.first}>{first}</span>{" "}
            <span className={styles.last}>{rest.join(" ")}</span>
          </h1>
          <p className={styles.sub}>
            <span>{profile.heroSub[0]}</span>
            <span>{profile.heroSub[1]}</span>
          </p>
          <HeroScrollIndicator
            label={dict.home.discoverWork || dict.home.scroll}
          />
        </div>
        {/* Baseline separator above pinned menu */}
        <div className={styles.rule} aria-hidden="true" />
      </div>

      {/* Step card overlay displayed during desktop scroll sequence */}
      <div className={styles.block}>
        <ol className={styles.steps} aria-label={dict.home.steps}>
          {profile.steps.map((step) => (
            <li key={step.label} className={styles.step} data-step>
              <p className={styles.label}>
                <span className={styles.line} data-line>
                  <span>{step.label}</span>
                </span>
              </p>
              <h2 className={styles.title}>
                <DisplayTitle
                  source={step.title}
                  lineClassName={styles.line}
                  fatClassName=""
                />
              </h2>
              <p className={styles.detail}>
                <span className={styles.line} data-line>
                  <span>{step.detail}</span>
                </span>
              </p>
            </li>
          ))}
        </ol>
        <div className={styles.progress} data-prog aria-hidden="true">
          {profile.steps.map((s) => (
            <span key={s.label} className={styles.seg}>
              <i data-fill />
            </span>
          ))}
          <span className={styles.count} data-count>
            01 / {total}
          </span>
        </div>
      </div>
    </HeroStage>
  );
}
