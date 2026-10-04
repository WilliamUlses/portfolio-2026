import {
  boolean,
  index,
  integer,
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
import { categories, tags } from "./taxonomies";

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    client: text("client"),
    year: integer("year").notNull(),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    accentColor: text("accent_color").notNull().default("#FF4A1C"),
    status: projectStatus("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    coverMediaId: text("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    previewMediaId: text("preview_media_id").references(() => media.id, {
      onDelete: "set null",
    }), // hover preview video
    ogMediaId: text("og_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    externalUrl: text("external_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("projects_slug_uq").on(t.slug),
    index("projects_status_order_idx").on(t.status, t.sortOrder),
  ],
);

export const projectTranslations = pgTable(
  "project_translations",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    role: text("role"),
    summary: text("summary").notNull(),
    blocks: jsonb("blocks").$type<Block[]>().notNull().default([]),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.locale] })],
);

export const projectTags = pgTable(
  "project_tags",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.tagId] })],
);

export const slugRedirects = pgTable("slug_redirects", {
  fromSlug: text("from_slug").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
