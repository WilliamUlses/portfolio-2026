import { z } from "zod";
import "./zod-fr";

// Global site settings schema stored in database site_settings table.
const localeSettings = z.object({
  tagline: z.string(),
  positioning: z.tuple([z.string(), z.string()]),
  bio: z.string(),
  seoDefaultDescription: z.string(),
});

export const SiteSettings = z.object({
  name: z.string().min(1),
  email: z.email(),
  availability: z.enum(["open", "limited", "closed"]),
  socials: z.record(z.string(), z.url({ protocol: /^https$/ })), // HTTPS links only
  i18n: z.object({ fr: localeSettings, en: localeSettings }),
});

export type SiteSettings = z.infer<typeof SiteSettings>;
