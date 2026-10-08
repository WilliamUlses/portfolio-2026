const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

type Props = {
  slug: string;
  alt?: string;
  className?: string;
  priority?: boolean;
};

// Pure CSS theme-responsive thumbnails: strictly synchronised with the website theme
// without hydration delays or client timing desync.
export function JournalThumbnail({
  slug,
  alt = "",
  className,
  priority = false,
}: Props) {
  return (
    <>
      {/* biome-ignore lint/performance/noImgElement: direct Chromium generated thumbnail with pure CSS theme reactivity */}
      <img
        src={`/thumbnails/${slug}-dark.png`}
        alt={alt}
        width={OG_WIDTH}
        height={OG_HEIGHT}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${className ?? ""} journalThumbDark`}
      />
      {/* biome-ignore lint/performance/noImgElement: direct Chromium generated thumbnail with pure CSS theme reactivity */}
      <img
        src={`/thumbnails/${slug}-light.png`}
        alt={alt}
        width={OG_WIDTH}
        height={OG_HEIGHT}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`${className ?? ""} journalThumbLight`}
      />
    </>
  );
}
