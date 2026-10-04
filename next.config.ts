import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security-headers";

const config: NextConfig = {
  cacheComponents: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
        search: "",
      },
    ],
    deviceSizes: [640, 960, 1280, 1600, 1920, 2560],
    imageSizes: [96, 160, 320, 480],
    qualities: [60, 75, 90],
    minimumCacheTTL: 60 * 60 * 24 * 365, // immutable assets
  },
  poweredByHeader: false,
  devIndicators: { position: "top-right" },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          dev: process.env.NODE_ENV === "development",
          preview: process.env.VERCEL_ENV === "preview",
          https: process.env.VERCEL === "1",
          reportOnly: process.env.CSP_REPORT_ONLY === "true",
        }),
      },
    ];
  },
};

export default config;
