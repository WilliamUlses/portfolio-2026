CREATE TABLE "contact_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ip_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "contact_attempts_ip_created_idx" ON "contact_attempts" USING btree ("ip_hash","created_at");