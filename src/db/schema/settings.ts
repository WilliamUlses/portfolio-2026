import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { SiteSettings } from "@/content/settings";

export const siteSettings = pgTable("site_settings", {
  id: text("id").primaryKey().default("singleton"),
  data: jsonb("data").$type<SiteSettings>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
