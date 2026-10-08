import { NextResponse } from "next/server";
import { renderLiquidGlassThumbnail } from "@/seo/render-pure-dark";
import { requireAdmin } from "@/server/session";

// Endpoint de prévisualisation en direct de la miniature Liquid Glass (Dark ou Light Cobalt).
// Rend au pixel près l'image via Chromium Playwright pour garantir une fidélité 100% exacte.
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const title =
      searchParams.get("title") || "Réfraction optique|*en verre liquide*";
    const theme = searchParams.get("theme") === "light" ? "light" : "dark";

    const buffer = await renderLiquidGlassThumbnail(title, theme);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de rendu";
    return new NextResponse(message, { status: 500 });
  }
}
