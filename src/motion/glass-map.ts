// Displacement map generator for rounded glass plate (liquid glass effect).
// For SVG feDisplacementMap: R = horizontal offset, G = vertical offset, 128 = neutral (no offset).
// - Bezel: background is refracted inward towards edges.
// - Lateral: horizontal prism effect increasing towards sides.
// - Jitter: soft deterministic noise for glass surface irregularities.

/** Deterministic pseudo-random hash -> [0, 1[ */
function hash(ix: number, iy: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Smooth value noise (-1 -> 1) */
function smoothNoise(x: number, y: number, cell: number, seed: number) {
  const gx = x / cell;
  const gy = y / cell;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, seed);
  const b = hash(x0 + 1, y0, seed);
  const c = hash(x0, y0 + 1, seed);
  const d = hash(x0 + 1, y0 + 1, seed);
  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return (top + (bottom - top) * sy) * 2 - 1;
}

/** Two wide octaves of noise for subtle glass texture */
function glassNoise(x: number, y: number, seed: number) {
  return (
    smoothNoise(x, y, 52, seed) * 0.7 + smoothNoise(x, y, 24, seed + 7) * 0.3
  );
}

/** Normalized inward displacement (-1 -> 1) at given point on the plate */
export function glassOffset(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  bezel: number,
  lateral = 0,
  jitter = 0,
): { dx: number; dy: number } {
  const edge = bezelOffset(x, y, width, height, radius, bezel);
  if (edge === null) return { dx: 0, dy: 0 };
  // Prism effect across horizontal axis
  const u = (x - width / 2) / (width / 2);
  const side = -Math.sign(u) * Math.abs(u) ** 1.5 * lateral;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const nx = jitter ? glassNoise(x, y, 1) * jitter : 0;
  const ny = jitter ? glassNoise(x, y, 11) * jitter * 0.6 : 0;
  return { dx: clamp(edge.dx + side + nx), dy: clamp(edge.dy + ny) };
}

/** Bezel displacement lens; null outside rounded plate */
function bezelOffset(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  bezel: number,
): { dx: number; dy: number } | null {
  if (x < 0 || y < 0 || x > width || y > height) return null;
  const r = Math.min(radius, width / 2, height / 2);
  // Nearest point on inner rectangle
  const cx = Math.min(Math.max(x, r), width - r);
  const cy = Math.min(Math.max(y, r), height - r);
  let vx = x - cx;
  let vy = y - cy;
  let len = Math.hypot(vx, vy);
  // Straight edges (non-corner)
  if (len === 0) {
    const edges = [
      { d: x, vx: -1, vy: 0 },
      { d: width - x, vx: 1, vy: 0 },
      { d: y, vx: 0, vy: -1 },
      { d: height - y, vx: 0, vy: 1 },
    ];
    const near = edges.reduce((a, b) => (b.d < a.d ? b : a));
    vx = near.vx;
    vy = near.vy;
    len = 1;
    const depth = near.d;
    return strength(depth, bezel, vx, vy);
  }
  const depth = r - len; // distance to rounded corner
  if (depth < 0) return null;
  return strength(depth, bezel, vx / len, vy / len);
}

function strength(depth: number, bezel: number, nx: number, ny: number) {
  if (depth >= bezel) return { dx: 0, dy: 0 };
  const t = 1 - depth / bezel;
  const s = t * t; // stronger towards outer edge
  return { dx: -nx * s, dy: -ny * s };
}

/** Generates PNG data URL displacement map for a plate at specified device pixel density. */
export function glassMapUrl(
  width: number,
  height: number,
  radius: number,
  bezel: number,
  lateral = 0,
  jitter = 0,
  density = 1,
): string {
  const W = Math.max(1, Math.round(width * density));
  const H = Math.max(1, Math.round(height * density));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const { dx, dy } = glassOffset(
        (x + 0.5) / density,
        (y + 0.5) / density,
        width,
        height,
        radius,
        bezel,
        lateral,
        jitter,
      );
      const i = (y * W + x) * 4;
      img.data[i] = Math.round(128 + dx * 127);
      img.data[i + 1] = Math.round(128 + dy * 127);
      img.data[i + 2] = 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/png");
}
