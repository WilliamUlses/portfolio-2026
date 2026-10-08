import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { parseDisplay } from "@/content/display-text";

// 1200x630 Open Graph image generation using next/og and Satori.
// Features glass-textured background with static fonts (Archivo and Hanken Grotesk).

export const OG_SIZE = { width: 1200, height: 630 } as const;

const PAPER = "#f2f1ec";
const SEO_DIR = join(process.cwd(), "src/seo");

// Cached assets loaded once on first generation request
let assetsPromise: ReturnType<typeof loadAssets> | undefined;
async function loadAssets() {
  const [thin, fat, text, glass, monogram] = await Promise.all([
    readFile(join(SEO_DIR, "fonts/archivo-thin.woff")),
    readFile(join(SEO_DIR, "fonts/archivo-fat.woff")),
    readFile(join(SEO_DIR, "fonts/hanken-grotesk-400.woff")),
    readFile(join(SEO_DIR, "og-glass.jpg")),
    readFile(join(process.cwd(), "public/images/monogramme-verre-dark.png")),
  ]);
  return {
    fonts: [
      { name: "Archivo Thin", data: thin, weight: 400 as const },
      { name: "Archivo Fat", data: fat, weight: 400 as const },
      { name: "Hanken Grotesk", data: text, weight: 400 as const },
    ].map((f) => ({ ...f, style: "normal" as const })),
    glass: `data:image/jpeg;base64,${glass.toString("base64")}`,
    monogram: `data:image/png;base64,${monogram.toString("base64")}`,
  };
}
const assets = () => (assetsPromise ??= loadAssets());

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

/** Fetches Blob image or local public image and converts to 1200x630 JPEG data URL */
async function blobImageAsJpeg(url: string): Promise<string | null> {
  try {
    let buffer: Buffer;
    if (url.startsWith("/")) {
      const diskPath = join(process.cwd(), "public", url.replace(/^\//, ""));
      buffer = await readFile(diskPath);
    } else {
      if (!BLOB_HOST.test(new URL(url).hostname)) return null;
      const res = await fetch(url);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    }
    const jpeg = await sharp(buffer)
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 90 })
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

/** Journal article card: Authentic Liquid Glass slab, 3D optical crystal monogram, Archivo Thin / Fat title */
export async function ogArticle({
  title,
}: {
  title: string;
  section?: string;
  topic?: string | null;
  meta?: string;
  domain?: string;
}): Promise<ImageResponse> {
  const { fonts, glass, monogram } = await assets();
  const lines = parseDisplay(title);
  const hasFormatting = title.includes("*");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        backgroundColor: "#08090d",
        fontFamily: "Hanken Grotesk",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: Satori SVG rendering context */}
      <img
        src={glass}
        width={OG_SIZE.width}
        height={OG_SIZE.height}
        alt=""
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.16,
        }}
      />
      {/* Cobalt atmospheric glow */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: 150,
          width: 800,
          height: 800,
          borderRadius: 400,
          backgroundImage:
            "radial-gradient(circle, rgba(30, 43, 255, 0.28) 0%, rgba(8, 9, 13, 0) 70%)",
        }}
      />
      {/* Liquid Glass Plate */}
      <div
        style={{
          position: "relative",
          width: 1080,
          height: 510,
          borderRadius: 36,
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          boxShadow:
            "inset 0 1px 1px rgba(255, 255, 255, 0.4), inset 2px 0 6px rgba(255, 90, 60, 0.15), inset -2px 0 6px rgba(30, 43, 255, 0.25), 0 28px 64px rgba(0, 0, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          padding: 56,
          gap: 52,
        }}
      >
        {/* Monogram on the left */}
        <div
          style={{
            width: 360,
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 340,
              height: 340,
              borderRadius: 170,
              backgroundImage:
                "radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(30, 43, 255, 0.12) 50%, rgba(0,0,0,0) 70%)",
            }}
          />
          {/* biome-ignore lint/performance/noImgElement: Satori SVG rendering context */}
          <img
            src={monogram}
            width={360}
            height={360}
            alt=""
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* Title on the right */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            color: "#f2f1ec",
          }}
        >
          {hasFormatting ? (
            lines.map((line) => {
              const lineKey = line.map((s) => s.text).join("-");
              return (
                <div
                  key={lineKey}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    fontSize: title.length > 36 ? 68 : 82,
                    lineHeight: 0.94,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {line.map((seg) => (
                    <span
                      key={`${seg.text}-${seg.fat}`}
                      style={{
                        fontFamily: seg.fat ? "Archivo Fat" : "Archivo Thin",
                        color: seg.fat
                          ? "#ffffff"
                          : "rgba(242, 241, 236, 0.95)",
                        marginRight: "0.22em",
                      }}
                    >
                      {seg.text}
                    </span>
                  ))}
                </div>
              );
            })
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: title.length > 36 ? 68 : 82,
                lineHeight: 0.94,
              }}
            >
              <span
                style={{
                  fontFamily: "Archivo Thin",
                  letterSpacing: "-0.04em",
                  color: "rgba(242, 241, 236, 0.95)",
                }}
              >
                {title}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>,
    { ...OG_SIZE, fonts },
  );
}
