import type { CSSProperties } from "react";
import { stack } from "@/content/stack";

// Filter out tools dedicated solely to the about page.
const homeStack = stack.filter((tool) => tool.home !== false);

import type { Dictionary } from "@/i18n/get-dictionary";
import { StackLogo } from "../StackLogo";
import styles from "./Stack.module.css";
import { StackMotion } from "./StackMotion";

// Home stack showcase: sticky section header with interactive tool items that emphasize font weight
// and brand colors as they cross viewport center. Includes screen-reader accessible list counterpart.

export function Stack({ dict }: { dict: Dictionary }) {
  return (
    <section className={styles.section} aria-labelledby="stack">
      <div className={styles.aside}>
        <h2 id="stack" className={styles.label}>
          {dict.home.stack}
        </h2>
        <p className={styles.lede}>{dict.home.stackLede}</p>
      </div>
      <ul className="sr-only">
        {homeStack.map((tool) => (
          <li key={tool.name}>{tool.name}</li>
        ))}
      </ul>
      <StackMotion>
        <ul className={styles.list} aria-hidden="true">
          {homeStack.map((tool) => (
            <li
              key={tool.name}
              className={styles.item}
              data-item
              style={
                tool.logo.kind === "brand" && tool.logo.color
                  ? ({ "--brand": tool.logo.color } as CSSProperties)
                  : undefined
              }
            >
              <span className={styles.logo}>
                <StackLogo
                  logo={tool.logo}
                  pictogramClassName={styles.pictogram}
                />
              </span>
              <span className={styles.name}>{tool.name}</span>
            </li>
          ))}
        </ul>
      </StackMotion>
    </section>
  );
}
