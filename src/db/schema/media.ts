import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { locale, mediaKind } from "./enums";

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  kind: mediaKind("kind").notNull(),
  url: text("url").notNull(),
  pathname: text("pathname").notNull(),
  mimeType: text("mime_type").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  thumbhash: text("thumbhash"),
  dominantColor: text("dominant_color"),
  posterMediaId: text("poster_media_id"), // video -> poster image
  durationMs: integer("duration_ms"),
  originalName: text("original_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mediaTranslations = pgTable(
  "media_translations",
  {
    mediaId: text("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    altText: text("alt_text").notNull(),
  },
  (t) => [primaryKey({ columns: [t.mediaId, t.locale] })],
);
