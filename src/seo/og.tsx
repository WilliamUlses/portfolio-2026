import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

// 1200x630 Open Graph image generation using next/og and Satori.
// Features glass-textured background with static fonts (Archivo and Hanken Grotesk).

export const OG_SIZE = { width: 1200, height: 630 } as const;

const PAPER = "#f2f1ec";
const SEO_DIR = join(process.cwd(), "src/seo");

// Cached assets loaded once on first generation request
let assetsPromise: ReturnType<typeof loadAssets> | undefined;
async function loadAssets() {
  const [thin, fat, text, glass] = await Promise.all([
    readFile(join(SEO_DIR, "fonts/archivo-thin.woff")),
    readFile(join(SEO_DIR, "fonts/archivo-fat.woff")),
    readFile(join(SEO_DIR, "fonts/hanken-grotesk-400.woff")),
    readFile(join(SEO_DIR, "og-glass.jpg")),
  ]);
  return {
    fonts: [
      { name: "Archivo Thin", data: thin, weight: 400 as const },
      { name: "Archivo Fat", data: fat, weight: 400 as const },
      { name: "Hanken Grotesk", data: text, weight: 400 as const },
    ].map((f) => ({ ...f, style: "normal" as const })),
    glass: `data:image/jpeg;base64,${glass.toString("base64")}`,
  };
}
const assets = () => (assetsPromise ??= loadAssets());

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

/** Fetches Blob image and converts to 1200x630 JPEG data URL */
async function blobImageAsJpeg(url: string): Promise<string | null> {
  try {
    if (!BLOB_HOST.test(new URL(url).hostname)) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Full-bleed Open Graph card using a custom uploaded image */
export async function ogFromImage(url: string): Promise<ImageResponse | null> {
  const src = await blobImageAsJpeg(url);
  if (!src) return null;
  return new ImageResponse(
    // biome-ignore lint/performance/noImgElement: Satori SVG rendering context
    <img src={src} width={OG_SIZE.width} height={OG_SIZE.height} alt="" />,
    { ...OG_SIZE, fonts: (await assets()).fonts },
  );
}

/** Default branded Open Graph card with typography layout */
export async function ogCard({
  kicker,
  thin,
  fat,
  subtitle,
  domain,
}: {
  kicker: string;
  thin?: string;
  fat: string;
  subtitle?: string;
  domain: string;
}): Promise<ImageResponse> {
  const { fonts, glass } = await assets();
  const long = (thin ?? "").length + fat.length > 22;
  const size = long ? 72 : 112;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#1e2bff",
        color: PAPER,
        fontFamily: "Hanken Grotesk",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: Satori SVG rendering context */}
      <img
        src={glass}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        alt=""
        style={{ position: "absolute", top: 0, left: 0 }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 72px 56px",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, opacity: 0.9 }}>
          {`[ ${kicker} ]`}
        </div>
        <div
          style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "baseline",
              fontSize: size,
              lineHeight: 0.95,
              letterSpacing: "-0.045em",
            }}
          >
            {thin ? (
              <span
                style={{ fontFamily: "Archivo Thin", marginRight: "0.22em" }}
              >
                {thin}
              </span>
            ) : null}
            <span style={{ fontFamily: "Archivo Fat" }}>{fat}</span>
          </div>
          {subtitle ? (
            <div
              style={{
                marginTop: 28,
                fontSize: 30,
                lineHeight: 1.25,
                opacity: 0.92,
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 18,
            borderTop: "1px solid rgba(242,241,236,0.45)",
            fontSize: 22,
            opacity: 0.9,
          }}
        >
          <span>{domain}</span>
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}
