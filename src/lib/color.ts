// WCAG 2.x relative luminance and contrast calculations.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r = 0, g = 0, b = 0] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

// Brand color palette constants
export const INK = "#0E0E10";
export const PAPER = "#F2F1EC";
export const COBALT = "#1E2BFF";

/** WCAG AA minimum contrast ratio for regular body text. */
export const AA_TEXT = 4.5;

/**
 * Determines whether dark (ink) or light (paper) text provides higher contrast
 * on the given background color.
 */
export function bestTextOn(background: string): {
  text: "ink" | "paper";
  ratio: number;
  ink: number;
  paper: number;
} {
  const ink = contrastRatio(INK, background);
  const paper = contrastRatio(PAPER, background);
  return ink >= paper
    ? { text: "ink", ratio: ink, ink, paper }
    : { text: "paper", ratio: paper, ink, paper };
}

// Generates contrast-safe project palette: pastel background from accent color,
// with luminance adjusted to meet WCAG AA standards (>= 3:1 for large text, >= 4.5:1 for body).

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const toHex = (channels: number[]) =>
  `#${channels
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(c)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`.toUpperCase();

/** Interpolates linearly between hex color `a` and `b` by factor `t` (where 1 = a). */
export function mixHex(a: string, b: string, t: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return toHex(x.map((c, i) => c * t + (y[i] ?? 0) * (1 - t)));
}

/** Generates a soft pastel background tint from an accent hex color. */
export function pastelOf(accent: string): string {
  return mixHex(accent, "#FBFBFD", 0.11);
}

function toHsl(hex: string): [number, number, number] {
  const [r = 0, g = 0, b = 0] = rgb(hex).map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h =
    max === r
      ? ((g - b) / d) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];
  return toHex([r, g, b].map((v) => (v + m) * 255));
}

/**
 * Returns `color` if it satisfies `min` contrast ratio against `background`,
 * otherwise iteratively darkens luminance along the same hue until sufficient.
 */
export function readableOn(
  color: string,
  background: string,
  min: number,
): string {
  if (contrastRatio(color, background) >= min) return color.toUpperCase();
  const [h, s, l] = toHsl(color);
  for (let k = l; k > 0; k -= 0.01) {
    const candidate = fromHsl(h, Math.min(1, s * 1.15), k);
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return "#000000";
}

export type SelectionColors = {
  background: string;
  title: string;
  text: string;
  dot: string;
};

export function selectionColors(accent: string): SelectionColors {
  const background = pastelOf(accent);
  return {
    background,
    title: readableOn(accent, background, 3),
    text: readableOn(accent, background, AA_TEXT),
    dot: readableOn(accent, "#FFFFFF", AA_TEXT),
  };
}

/** Formats hex color as CSS `rgb(r g b / alpha)`. */
export function withAlpha(hex: string, alpha: number): string {
  const [r = 0, g = 0, b = 0] = rgb(hex).map(Math.round);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** Computes CSS custom property string for a project color scheme. */
export function projectThemeCss(accent: string): string {
  return Object.entries(projectThemeVars(accent))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}

export const PROJECT_THEME_KEYS = [
  "--bg",
  "--fg",
  "--fg-80",
  "--fg-60",
  "--fg-15",
  "--accent",
  "--glass-fg",
  "--project-title",
] as const;

export function projectThemeVars(accent: string): Record<string, string> {
  const c = selectionColors(accent);
  const vars: Record<(typeof PROJECT_THEME_KEYS)[number], string> = {
    "--bg": c.background,
    "--fg": c.text,
    // Solid text color for secondary copy to maintain >= 4.5:1 contrast
    "--fg-80": c.text,
    "--fg-60": withAlpha(c.text, 0.62),
    "--fg-15": withAlpha(c.text, 0.18),
    "--accent": c.text,
    "--glass-fg": c.text,
    "--project-title": c.title,
  };
  return vars;
}

/** Generates a dark graphite background tint from an accent hex color. */
export function darkTintOf(accent: string): string {
  return mixHex(accent, "#121215", 0.12);
}

/**
 * Returns `color` if it satisfies `min` contrast ratio against `background`,
 * otherwise iteratively lightens luminance along the same hue until sufficient.
 */
export function readableLightOn(
  color: string,
  background: string,
  min: number,
): string {
  if (contrastRatio(color, background) >= min) return color.toUpperCase();
  const [h, s, l] = toHsl(color);
  for (let k = l; k < 1; k += 0.01) {
    const candidate = fromHsl(h, Math.min(1, s * 1.15), k);
    if (contrastRatio(candidate, background) >= min) return candidate;
  }
  return "#FFFFFF";
}

export function selectionDarkColors(accent: string): SelectionColors {
  const background = darkTintOf(accent);
  return {
    background,
    title: readableLightOn(accent, background, 3),
    text: readableLightOn(accent, background, AA_TEXT),
    dot: readableLightOn(accent, "#121215", AA_TEXT),
  };
}

export function projectDarkThemeVars(accent: string): Record<string, string> {
  const c = selectionDarkColors(accent);
  const vars: Record<(typeof PROJECT_THEME_KEYS)[number], string> = {
    "--bg": c.background,
    "--fg": c.text,
    "--fg-80": c.text,
    "--fg-60": withAlpha(c.text, 0.62),
    "--fg-15": withAlpha(c.text, 0.18),
    "--accent": c.text,
    "--glass-fg": c.text,
    "--project-title": c.title,
  };
  return vars;
}

export function projectDarkThemeCss(accent: string): string {
  return Object.entries(projectDarkThemeVars(accent))
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
}
