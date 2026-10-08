import type { Profile } from "@/content/profile";
import type { Dictionary } from "@/i18n/get-dictionary";
import { DisplayTitle } from "../DisplayTitle";
import { FlutedPanel, type Light } from "../FlutedPanel";
import styles from "./Approach.module.css";

// Static 3-step approach card: cobalt base with fluted glass overlay and contrast calm zone.
const CARD_LIGHTS: Light[] = [
  { x: 0.7, y: 0.25, r: 0.42, color: "rgba(159,243,255,.55)" },
  { x: 0.88, y: 0.8, r: 0.36, color: "rgba(255,122,217,.45)" },
];

export function Approach({
  profile,
  dict,
}: {
  profile: Profile;
  dict: Dictionary;
}) {
  const total = String(profile.steps.length).padStart(2, "0");
  return (
    <section
      id="approche"
      className={styles.section}
      aria-label={dict.home.steps}
    >
      <FlutedPanel
        className={styles.card}
        lights={CARD_LIGHTS}
        calm={0.55}
        data-bg="dark"
      >
        <ol className={styles.steps}>
          {profile.steps.map((step) => (
            <li key={step.label}>
              <p className={styles.label}>{step.label}</p>
              <h2 className={styles.title}>
                <DisplayTitle
                  source={step.title}
                  lineClassName={styles.line}
                  fatClassName=""
                />
              </h2>
              <p className={styles.detail}>{step.detail}</p>
            </li>
          ))}
        </ol>
        <div className={styles.progress} aria-hidden="true">
          {profile.steps.map((s) => (
            <span key={s.label} className={styles.seg} />
          ))}
          <span className={styles.count}>
            {total} / {total}
          </span>
        </div>
      </FlutedPanel>
    </section>
  );
}
