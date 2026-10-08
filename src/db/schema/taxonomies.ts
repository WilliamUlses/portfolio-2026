import { integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { locale } from "./enums";

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const categoryTranslations = pgTable(
  "category_translations",
  {
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
  },
  (t) => [primaryKey({ columns: [t.categoryId, t.locale] })],
);

export const tags = pgTable("tags", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
});

export const tagTranslations = pgTable(
  "tag_translations",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    locale: locale("locale").notNull(),
    name: text("name").notNull(),
  },
  (t) => [primaryKey({ columns: [t.tagId, t.locale] })],
);
