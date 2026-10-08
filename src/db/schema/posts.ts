import {
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { Block } from "@/content/blocks";
import { locale, projectStatus } from "./enums";
import { media } from "./media";

// Journal (blog) articles — Roadmap V2 3.2. Same block content model as projects.
export const posts = pgTable(
  "posts",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    /** Short topic shared by both languages (e.g. "WebGL", "Next.js") */
    topic: text("topic"),
    status: projectStatus("status").notNull().default("draft"),
    coverMediaId: text("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    thumbnailTitle: text("thumbnail_title"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("posts_slug_uq").on(t.slug),
    index("posts_status_published_idx").on(t.status, t.publishedAt),
  ],
);

export const postTranslations = pgTable(
  "post_translations",
  {
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt").notNull().default(""),
    blocks: jsonb("blocks").$type<Block[]>().notNull().default([]),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.locale] })],
);
