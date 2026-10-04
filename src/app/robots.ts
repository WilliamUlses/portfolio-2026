import type { MetadataRoute } from "next";
import { isIndexable, siteUrl } from "@/seo/site";

// robots.txt configuration: disallows crawling unless production site is publicly open
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
