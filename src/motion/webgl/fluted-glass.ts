"use client";

import {
  flutedGlassFragmentShader,
  GlassDistortionShapes,
  GlassGridShapes,
  getShaderColorFromString,
  ShaderFitOptions,
  ShaderMount,
} from "@paper-design/shaders";

// Fluted glass WebGL shader implementation using Paper Shaders
export const OWNER_GLASS = {
  colorBack: "#00000000",
  colorShadow: "#000000",
  colorHighlight: "#ffffff",
  size: 0.81,
  shadows: 0.4,
  highlights: 0,
  shape: "lines",
  angle: 0,
  distortionShape: "prism",
  distortion: 0.75,
  shift: 0,
  stretch: 0,
  blur: 0.25,
  edges: 0.5,
  margin: 0.1,
  grainMixer: 0,
  grainOverlay: 0,
} as const;

export type GlassMargins = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

// Max pixels rendered (caps high-DPI canvas to avoid GPU memory overhead)
const MAX_PIXELS = 2560 * 1440;

/** Mounts fluted glass shader onto parent element */
export function mountFlutedGlass(
  parent: HTMLElement,
  image: HTMLImageElement,
  margins: GlassMargins,
): ShaderMount | null {
  try {
    const g = OWNER_GLASS;
    return new ShaderMount(
      parent,
      flutedGlassFragmentShader,
      {
        u_image: image,
        u_colorBack: getShaderColorFromString(g.colorBack),
        u_colorShadow: getShaderColorFromString(g.colorShadow),
        u_colorHighlight: getShaderColorFromString(g.colorHighlight),
        u_shadows: g.shadows,
        u_size: g.size,
        u_angle: g.angle,
        u_distortion: g.distortion,
        u_shift: g.shift,
        u_blur: g.blur,
        u_edges: g.edges,
        u_stretch: g.stretch,
        u_distortionShape: GlassDistortionShapes[g.distortionShape],
        u_highlights: g.highlights,
        u_shape: GlassGridShapes[g.shape],
        u_marginLeft: margins.left,
        u_marginRight: margins.right,
        u_marginTop: margins.top,
        u_marginBottom: margins.bottom,
        u_grainMixer: g.grainMixer,
        u_grainOverlay: g.grainOverlay,
        u_fit: ShaderFitOptions.cover,
        u_scale: 1,
        u_rotation: 0,
        u_offsetX: 0,
        u_offsetY: 0,
        u_originX: 0.5,
        u_originY: 0.5,
        u_worldWidth: 0,
        u_worldHeight: 0,
      },
      { premultipliedAlpha: false },
      0, // Zero speed: static render updated per scroll/interaction
      0,
      2,
      MAX_PIXELS,
      ["u_image"],
    );
  } catch {
    return null;
  }
}

/** Loads an image element from an Offscreen or HTML canvas */
export function canvasToImage(
  canvas: HTMLCanvasElement,
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL("image/png");
  });
}

/** Converts font-stretch CSS value to CanvasFontStretch keyword */
export function stretchKeyword(value: string): CanvasFontStretch {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return "normal";
  if (n >= 124) return "expanded";
  if (n >= 112) return "semi-expanded";
  if (n <= 88) return "semi-condensed";
  return "normal";
}

/** Radial light source configuration for background refraction */
export type Light = { x: number; y: number; r: number; color: string };

/**
 * Draws refractive background gradient canvas with optional calm/vignette area.
 */
export function lightsCanvas(
  width: number,
  height: number,
  lights: readonly Light[],
  calm = 0,
  bg = "#1E2BFF",
  calmColor = "rgba(22,32,210,.9)",
): HTMLCanvasElement {
  const W = Math.max(1, Math.round(width));
  const H = Math.max(1, Math.round(height));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  if (!ctx) return c;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const unit = Math.max(W, H);
  for (const l of lights) {
    const x = l.x * W;
    const y = l.y * H;
    const g = ctx.createRadialGradient(x, y, 0, x, y, l.r * unit);
    g.addColorStop(0, l.color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (calm > 0) {
    const g = ctx.createLinearGradient(0, 0, calm * W, 0);
    g.addColorStop(0, calmColor);
    g.addColorStop(0.5, calmColor.replace(/[\d.]+\)$/, "0.75)"));
    g.addColorStop(1, calmColor.replace(/[\d.]+\)$/, "0)"));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  return c;
}
