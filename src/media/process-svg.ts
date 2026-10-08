import DOMPurify from "dompurify";
import { optimize } from "svgo/browser";
import { MAX_SVG_BYTES } from "./constants";
import { findUnsafeSvg } from "./svg-check";

// Client-side SVG sanitization: DOMPurify profile, SVGO optimization, and safety checks.
export type ProcessedSvg = { file: Blob; width: number; height: number };

function dimensions(svg: string): { width: number; height: number } {
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.documentElement;
  const num = (v: string | null) => {
    const n = v ? Number.parseFloat(v) : Number.NaN;
    return Number.isFinite(n) && n > 0 && !/%$/.test(v ?? "")
      ? Math.round(n)
      : null;
  };
  const vb = root
    .getAttribute("viewBox")
    ?.split(/[\s,]+/)
    .map(Number);
  const vbW =
    vb && vb.length === 4 && vb[2] && vb[2] > 0 ? Math.round(vb[2]) : null;
  const vbH =
    vb && vb.length === 4 && vb[3] && vb[3] > 0 ? Math.round(vb[3]) : null;
  return {
    width: num(root.getAttribute("width")) ?? vbW ?? 1024,
    height: num(root.getAttribute("height")) ?? vbH ?? 1024,
  };
}

export async function processSvg(source: File): Promise<ProcessedSvg> {
  if (source.size > MAX_SVG_BYTES) throw new Error("SVG exceeds 2MB limit");
  const raw = await source.text();

  const purify = DOMPurify();
  // Strip external links, allow only internal fragment anchors (#id)
  purify.addHook("uponSanitizeAttribute", (_node, data) => {
    if (
      (data.attrName === "href" || data.attrName === "xlink:href") &&
      !data.attrValue.trim().startsWith("#")
    ) {
      data.keepAttr = false;
    }
  });
  const sanitized = purify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject", "script"],
  });
  if (!sanitized.includes("<svg")) throw new Error("Invalid SVG file");

  const { data } = optimize(sanitized, { multipass: true });
  const problems = findUnsafeSvg(data);
  if (problems.length)
    throw new Error(`Rejected unsafe SVG: ${problems.join(", ")}`);

  return {
    file: new Blob([data], { type: "image/svg+xml" }),
    ...dimensions(data),
  };
}
