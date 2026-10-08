import Image from "next/image";
import type { CSSProperties } from "react";
import { thumbHashToDataURL } from "thumbhash";
import type { PublicMedia } from "@/server/queries";

// Unified storefront media component handling images, SVGs, and videos with ThumbHash blur placeholders.

function placeholder(m: PublicMedia): CSSProperties {
  if (m.thumbhash) {
    try {
      const bytes = Uint8Array.from(atob(m.thumbhash), (c) => c.charCodeAt(0));
      return {
        backgroundImage: `url(${thumbHashToDataURL(bytes)})`,
        backgroundSize: "cover",
      };
    } catch {
      // Fallback to dominant color if ThumbHash decoding fails
    }
  }
  return m.dominantColor ? { backgroundColor: m.dominantColor } : {};
}

export function Media({
  media,
  sizes,
  preload = false,
}: {
  media: PublicMedia;
  /** Responsive display size descriptor (e.g. "100vw") */
  sizes: string;
  /** High priority preload flag for LCP hero image */
  preload?: boolean;
}) {
  const style = placeholder(media);
  if (media.kind === "video") {
    return (
      <video
        src={media.url}
        poster={media.poster?.url}
        width={media.width}
        height={media.height}
        muted
        loop
        playsInline
        controls
        preload="none"
        aria-label={media.alt || undefined}
        style={style}
      />
    );
  }
  if (media.kind === "svg") {
    return (
      // biome-ignore lint/performance/noImgElement: direct SVG image rendering
      <img
        src={media.url}
        alt={media.alt}
        width={media.width}
        height={media.height}
        loading={preload ? "eager" : "lazy"}
        style={style}
      />
    );
  }
  return (
    <Image
      src={media.url}
      alt={media.alt}
      width={media.width}
      height={media.height}
      sizes={sizes}
      preload={preload}
      fetchPriority={preload ? "high" : undefined}
      style={style}
    />
  );
}
