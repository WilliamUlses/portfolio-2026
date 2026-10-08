import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { parseDisplay } from "@/content/display-text";

const nodeRequire = createRequire(import.meta.url);

async function getChromium() {
  try {
    const pw = nodeRequire("@playwright/test");
    return pw.chromium;
  } catch {
    throw new Error(
      "Playwright Chromium is only available in local studio environment.",
    );
  }
}

// Authentic Liquid Glass renderer (Dark #08090D and Light Cobalt #0029FF) with fluted glass backdrop.
// Uses real backdrop-filter, mix-blend-mode and physical caustics via Chromium Playwright.

let cachedAssets: {
  thinFont: string;
  fatFont: string;
  hankenFont: string;
  glassRibbed: string;
  glassMonogram: string;
} | null = null;

async function loadRendererAssets() {
  if (cachedAssets) return cachedAssets;
  const ROOT = process.cwd();
  const [thinFont, fatFont, hankenFont, glassRibbed, glassMonogram] =
    await Promise.all([
      readFile(join(ROOT, "src/seo/fonts/archivo-thin.woff")).then((b) =>
        b.toString("base64"),
      ),
      readFile(join(ROOT, "src/seo/fonts/archivo-fat.woff")).then((b) =>
        b.toString("base64"),
      ),
      readFile(join(ROOT, "src/seo/fonts/hanken-grotesk-400.woff")).then((b) =>
        b.toString("base64"),
      ),
      readFile(join(ROOT, "src/seo/og-glass.jpg")).then((b) =>
        b.toString("base64"),
      ),
      readFile(join(ROOT, "public/images/monogramme-verre-dark.png")).then(
        (b) => b.toString("base64"),
      ),
    ]);

  cachedAssets = {
    thinFont,
    fatFont,
    hankenFont,
    glassRibbed,
    glassMonogram,
  };
  return cachedAssets;
}

export async function renderLiquidGlassThumbnail(
  title: string,
  theme: "dark" | "light" = "dark",
): Promise<Buffer> {
  const assets = await loadRendererAssets();
  const lines = parseDisplay(title);
  const hasFormatting = title.includes("*");

  let titleHtml = "";
  if (hasFormatting) {
    titleHtml = lines
      .map((line) => {
        const parts = line
          .map((seg) => {
            const cls = seg.fat ? "title-fat" : "title-thin";
            return `<span class="${cls}">${seg.text}</span>`;
          })
          .join(" ");
        return `<div>${parts}</div>`;
      })
      .join("");
  } else {
    titleHtml = `<div class="title-thin">${title}</div>`;
  }

  const isDark = theme === "dark";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: "Archivo Thin"; src: url("data:font/woff;base64,${assets.thinFont}") format("woff"); font-weight: 400; font-style: normal; }
    @font-face { font-family: "Archivo Fat"; src: url("data:font/woff;base64,${assets.fatFont}") format("woff"); font-weight: 800; font-style: normal; }
    @font-face { font-family: "Hanken Grotesk"; src: url("data:font/woff;base64,${assets.hankenFont}") format("woff"); font-weight: 400; font-style: normal; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: ${isDark ? "#08090d" : "#0029FF"};
      color: #ffffff;
      font-family: "Hanken Grotesk", sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .bg-ribbed {
      position: absolute;
      inset: 0;
      background-image: url("data:image/jpeg;base64,${assets.glassRibbed}");
      background-size: cover;
      opacity: ${isDark ? "0.18" : "0.45"};
      mix-blend-mode: luminosity;
      filter: ${isDark ? "none" : "contrast(1.25)"};
    }
    .bg-glow {
      position: absolute;
      top: -15%;
      left: 10%;
      width: 800px;
      height: 800px;
      background: ${
        isDark
          ? "radial-gradient(circle, rgba(30, 43, 255, 0.25) 0%, rgba(8, 9, 13, 0) 70%)"
          : "radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(0, 41, 255, 0) 70%)"
      };
      pointer-events: none;
    }
    .glass-plate {
      position: relative;
      width: 1080px;
      height: 510px;
      border-radius: 36px;
      background: ${
        isDark
          ? "linear-gradient(135deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.015) 100%)"
          : "linear-gradient(135deg, rgba(255, 255, 255, 0.20) 0%, rgba(255, 255, 255, 0.06) 100%)"
      };
      backdrop-filter: blur(28px) saturate(1.8);
      -webkit-backdrop-filter: blur(28px) saturate(1.8);
      border: 1px solid ${isDark ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.35)"};
      box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, ${isDark ? "0.4" : "0.7"}),
        inset 2px 0 6px -2px rgba(255, 90, 60, ${isDark ? "0.15" : "0.2"}),
        inset -2px 0 6px -2px rgba(30, 43, 255, ${isDark ? "0.25" : "0.1"}),
        ${
          isDark
            ? "0 28px 64px -16px rgba(0, 0, 0, 0.9)"
            : "0 28px 64px -16px rgba(0, 15, 120, 0.6)"
        };
      padding: 56px;
      display: flex;
      align-items: center;
      gap: 52px;
      z-index: 10;
    }
    .mono-box {
      flex: 0 0 360px;
      height: 360px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mono-glow {
      position: absolute;
      inset: 10px;
      background: ${
        isDark
          ? "radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(30, 43, 255, 0.12) 50%, rgba(0,0,0,0) 70%)"
          : "radial-gradient(circle, rgba(255, 255, 255, 0.35) 0%, rgba(0, 41, 255, 0.15) 50%, rgba(0,0,0,0) 70%)"
      };
      filter: blur(24px);
    }
    .mono-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: drop-shadow(0 18px 36px ${
        isDark ? "rgba(0, 0, 0, 0.75)" : "rgba(0, 18, 140, 0.6)"
      }) brightness(1.2) contrast(1.05);
    }
    .title-box {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .title-thin {
      font-family: "Archivo Thin";
      font-size: 82px;
      line-height: 0.94;
      letter-spacing: -0.04em;
      color: rgba(255, 255, 255, 0.95);
    }
    .title-fat {
      font-family: "Archivo Fat";
      font-size: 82px;
      line-height: 0.94;
      letter-spacing: -0.045em;
      color: #ffffff;
      font-weight: 800;
      text-shadow: ${isDark ? "none" : "0 4px 20px rgba(0, 18, 140, 0.4)"};
    }
  </style></head><body>
    <div class="bg-ribbed"></div>
    <div class="bg-glow"></div>
    <div class="glass-plate">
      <div class="mono-box">
        <div class="mono-glow"></div>
        <img src="data:image/png;base64,${assets.glassMonogram}" class="mono-img" alt="" />
      </div>
      <div class="title-box">
        ${titleHtml}
      </div>
    </div>
  </body></html>`;

  const chromium = await getChromium();
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "networkidle" });
  const buffer = await page.screenshot({
    type: "png",
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });
  await browser.close();

  return buffer;
}

export const renderPureDarkThumbnail = (title: string) =>
  renderLiquidGlassThumbnail(title, "dark");
