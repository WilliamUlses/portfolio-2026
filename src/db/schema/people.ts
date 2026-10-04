import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { media } from "./media";
import { projects } from "./projects";

// People and project collaborations
export const people = pgTable("people", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  githubUrl: text("github_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  photoMediaId: text("photo_media_id").references(() => media.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Role translated directly in columns for fixed bilingual schema
export const projectPeople = pgTable(
  "project_people",
  {
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    personId: text("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    roleFr: text("role_fr").notNull().default(""),
    roleEn: text("role_en").notNull().default(""),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.personId] }),
    index("project_people_person_idx").on(t.personId),
  ],
);
