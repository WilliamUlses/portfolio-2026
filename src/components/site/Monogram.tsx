// Monogram SVG mark: circle + geometric W + dot. Inherits currentColor; aria-hidden by default.
export function Monogram({
  size = 26,
  className,
  title,
}: {
  size?: number;
  className?: string;
  /** Accessible label when the monogram functions as a standalone image. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <circle
        cx="50"
        cy="50"
        r="41"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
      />
      <path
        fill="currentColor"
        d="M24.25 34 33.25 66h9l4.5-16 4.5 16h9l9-32h-9l-4.5 16-4.5-16h-9l-4.5 16-4.5-16Z"
      />
      <circle cx="71.25" cy="61.5" r="4.5" fill="currentColor" />
    </svg>
  );
}
