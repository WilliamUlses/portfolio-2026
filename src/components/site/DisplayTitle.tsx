import { Fragment } from "react";
import { parseDisplay } from "@/content/display-text";

// Display typography renderer: wraps lines with data-line attributes for entrance reveal animations,
// applying bold/fat styling to marked segments.
export function DisplayTitle({
  source,
  lineClassName,
  fatClassName = "v-fat",
}: {
  source: string;
  lineClassName?: string;
  fatClassName?: string;
}) {
  return (
    <>
      {parseDisplay(source).map((line, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static parsed text structure
        <span key={i} className={lineClassName} data-line>
          <span>
            {line.map((seg, j) =>
              seg.fat ? (
                // biome-ignore lint/suspicious/noArrayIndexKey: static parsed text structure
                <b key={j} className={fatClassName}>
                  {seg.text}
                </b>
              ) : (
                // biome-ignore lint/suspicious/noArrayIndexKey: static parsed text structure
                <Fragment key={j}>{seg.text}</Fragment>
              ),
            )}
          </span>
        </span>
      ))}
    </>
  );
}
