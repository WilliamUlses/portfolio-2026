import { pgEnum } from "drizzle-orm/pg-core";

export const locale = pgEnum("locale", ["fr", "en"]);
export const projectStatus = pgEnum("project_status", [
  "draft",
  "published",
  "archived",
]);
export const mediaKind = pgEnum("media_kind", ["image", "video", "svg"]);
