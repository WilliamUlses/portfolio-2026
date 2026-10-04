import type { ProjectPerson } from "@/server/queries";
import { Media } from "./Media";
import styles from "./ProjectPeople.module.css";

// Project collaborator roster displayed at end of case study
const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export function ProjectPeople({
  people,
  labels,
}: {
  people: ProjectPerson[];
  labels: { team: string; website: string };
}) {
  if (!people.length) return null;
  return (
    <section className={styles.team} aria-labelledby="equipe">
      <h2 id="equipe" className={styles.label}>
        {labels.team}
      </h2>
      <ul className={styles.list}>
        {people.map((p) => {
          const links = [
            ["GitHub", p.githubUrl],
            ["LinkedIn", p.linkedinUrl],
            [labels.website, p.websiteUrl],
          ].filter((l): l is [string, string] => Boolean(l[1]));
          return (
            <li key={p.id} className={styles.person}>
              <span className={styles.avatar} aria-hidden="true">
                {p.photo ? (
                  <Media media={{ ...p.photo, alt: "" }} sizes="64px" />
                ) : (
                  initials(p.name)
                )}
              </span>
              <span className={styles.who}>
                <span className={styles.name}>{p.name}</span>
                {p.role ? <span className={styles.role}>{p.role}</span> : null}
              </span>
              {links.length ? (
                <span className={styles.links}>
                  {links.map(([label, url]) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.pill}
                      aria-label={`${label} — ${p.name}`}
                    >
                      {label}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  ))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
