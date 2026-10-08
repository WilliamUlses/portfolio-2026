import { Media } from "@/components/site/Media";
import type { PublicMedia } from "@/server/queries";
import { shotId } from "../block-media";
import type { Block } from "../blocks";
import { embedSrc } from "../embed";
import { anchorIds, docHeadings } from "../headings";
import styles from "./Blocks.module.css";
import { RichText } from "./RichText";

// Case study block renderer: exhaustive switch over typed block unions.
// H2 headings within rich text receive generated table-of-contents slug anchors.

export type BlockLabels = {
  stats: string;
  credits: string;
  embed: Record<"vimeo" | "youtube" | "figma", string>;
};

type Ctx = {
  media: Record<string, PublicMedia>;
  labels: BlockLabels;
  anchor: () => string | undefined;
  /** Anchor identifier for the next shot element */
  shot: () => string;
};

function Caption({ text }: { text?: string }) {
  return text ? (
    <figcaption className={styles.caption}>{text}</figcaption>
  ) : null;
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  switch (block.type) {
    case "text":
      return (
        <section className={styles.text} data-width={block.width}>
          <RichText doc={block.doc} anchor={ctx.anchor} />
        </section>
      );
    case "image": {
      const m = ctx.media[block.mediaId];
      if (!m) return null;
      return (
        <figure className={styles.figure} data-layout={block.layout}>
          <div className={styles.frame} id={ctx.shot()} data-shot>
            <Media
              media={m}
              sizes={
                block.layout === "contained"
                  ? "(min-width: 1024px) 66vw, 100vw"
                  : "100vw"
              }
            />
          </div>
          <Caption text={block.caption} />
        </figure>
      );
    }
    case "gallery": {
      const items = block.mediaIds.flatMap((id) => ctx.media[id] ?? []);
      if (items.length === 0) return null;
      return (
        <figure className={styles.figure} data-layout="full">
          {/* Gallery items displayed in stacked layout */}
          <ul className={styles.gallery}>
            {items.map((m) => (
              <li key={m.id} className={styles.frame} id={ctx.shot()} data-shot>
                <Media media={m} sizes="(min-width: 768px) 56vw, 100vw" />
              </li>
            ))}
          </ul>
          <Caption text={block.caption} />
        </figure>
      );
    }
    case "video": {
      const m = ctx.media[block.mediaId];
      if (!m) return null;
      return (
        <figure className={styles.figure} data-layout="full">
          <div className={styles.frame}>
            <Media media={m} sizes="100vw" />
          </div>
          <Caption text={block.caption} />
        </figure>
      );
    }
    case "quote":
      return (
        <figure className={styles.quote}>
          <blockquote>
            <p>{block.text}</p>
          </blockquote>
          {block.author ? <figcaption>{block.author}</figcaption> : null}
        </figure>
      );
    case "stats":
      return (
        <section className={styles.stats} aria-label={ctx.labels.stats}>
          <dl>
            {block.items.map((item) => (
              <div key={`${item.value}-${item.label}`}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "credits":
      if (block.items.length === 0) return null;
      return (
        <section className={styles.credits} id="credits">
          <h2>{ctx.labels.credits}</h2>
          <dl>
            {block.items.map((item) => (
              <div key={`${item.role}-${item.name}`}>
                <dt>{item.role}</dt>
                <dd>
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.name}
                    </a>
                  ) : (
                    item.name
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      );
    case "embed": {
      const src = embedSrc(block.provider, block.url);
      if (!src) return null;
      return (
        <figure className={styles.figure} data-layout="contained">
          <div className={styles.embed}>
            <iframe
              src={src}
              title={ctx.labels.embed[block.provider]}
              loading="lazy"
              allow="fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </figure>
      );
    }
    default: {
      const unhandled: never = block;
      return unhandled;
    }
  }
}

export function Blocks({
  blocks,
  media,
  labels,
}: {
  blocks: Block[];
  media: Record<string, PublicMedia>;
  labels: BlockLabels;
}) {
  // Sequential heading anchor IDs matching table of contents
  const ids = anchorIds(docHeadings(blocks));
  let next = 0;
  // Media shot indices matching shot preview rail
  let shot = 0;
  const ctx: Ctx = {
    media,
    labels,
    anchor: () => ids[next++],
    shot: () => shotId(shot++),
  };
  return (
    <div className={styles.blocks}>
      {blocks.map((block) => (
        <BlockView key={block.id} block={block} ctx={ctx} />
      ))}
    </div>
  );
}
