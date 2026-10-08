CREATE TYPE "public"."locale" AS ENUM('fr', 'en');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video', 'svg');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "media_kind" NOT NULL,
	"url" text NOT NULL,
	"pathname" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"thumbhash" text,
	"dominant_color" text,
	"poster_media_id" text,
	"duration_ms" integer,
	"original_name" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_translations" (
	"media_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"alt_text" text NOT NULL,
	CONSTRAINT "media_translations_media_id_locale_pk" PRIMARY KEY("media_id","locale")
);
--> statement-breakpoint
CREATE TABLE "project_tags" (
	"project_id" text NOT NULL,
	"tag_id" text NOT NULL,
	CONSTRAINT "project_tags_project_id_tag_id_pk" PRIMARY KEY("project_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "project_translations" (
	"project_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"summary" text NOT NULL,
	"blocks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_translations_project_id_locale_pk" PRIMARY KEY("project_id","locale")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"client" text,
	"year" integer NOT NULL,
	"role" text,
	"category_id" text,
	"accent_color" text DEFAULT '#FF4A1C' NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"cover_media_id" text,
	"preview_media_id" text,
	"og_media_id" text,
	"external_url" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slug_redirects" (
	"from_slug" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_translations" (
	"category_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "category_translations_category_id_locale_pk" PRIMARY KEY("category_id","locale")
);
--> statement-breakpoint
CREATE TABLE "tag_translations" (
	"tag_id" text NOT NULL,
	"locale" "locale" NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tag_translations_tag_id_locale_pk" PRIMARY KEY("tag_id","locale")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "media_translations" ADD CONSTRAINT "media_translations_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_translations" ADD CONSTRAINT "project_translations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_preview_media_id_media_id_fk" FOREIGN KEY ("preview_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_og_media_id_media_id_fk" FOREIGN KEY ("og_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slug_redirects" ADD CONSTRAINT "slug_redirects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_translations" ADD CONSTRAINT "category_translations_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag_translations" ADD CONSTRAINT "tag_translations_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_uq" ON "projects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "projects_status_order_idx" ON "projects" USING btree ("status","sort_order");