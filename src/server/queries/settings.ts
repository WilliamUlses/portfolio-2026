import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { SiteSettings } from "@/content/settings";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";
import { tags } from "../cache-tags";
import { databaseAvailable } from "./db-available";

// Site settings queries (author info, availability, social links, localized copy)

// Default fallback settings used when database is unreachable or table is uninitialized
const DEFAULT_SETTINGS: SiteSettings = {
  name: "William Ulses",
  email: "contact@williamulses.fr",
  availability: "open",
  socials: {
    github: "https://github.com/WilliamUlses",
    linkedin: "https://www.linkedin.com/in/william-ulses-85a817230",
  },
  i18n: {
    fr: {
      tagline: "Développeur créatif et directeur artistique",
      positioning: ["", ""],
      bio: "",
      seoDefaultDescription: "",
    },
    en: {
      tagline: "Creative developer and art director",
      positioning: ["", ""],
      bio: "",
      seoDefaultDescription: "",
    },
  },
};

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheLife("max");
  cacheTag(tags.settings);
  if (!databaseAvailable()) return DEFAULT_SETTINGS;
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, "singleton"));
  if (!row) {
    console.warn(
      "[settings] Missing site_settings record, using default values",
    );
    return DEFAULT_SETTINGS;
  }
  return SiteSettings.parse(row.data);
}
