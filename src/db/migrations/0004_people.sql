CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"github_url" text,
	"linkedin_url" text,
	"website_url" text,
	"photo_media_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_people" (
	"project_id" text NOT NULL,
	"person_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"role_fr" text DEFAULT '' NOT NULL,
	"role_en" text DEFAULT '' NOT NULL,
	CONSTRAINT "project_people_project_id_person_id_pk" PRIMARY KEY("project_id","person_id")
);
--> statement-breakpoint
ALTER TABLE "people" ADD CONSTRAINT "people_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_people" ADD CONSTRAINT "project_people_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_people" ADD CONSTRAINT "project_people_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_people_person_idx" ON "project_people" USING btree ("person_id");