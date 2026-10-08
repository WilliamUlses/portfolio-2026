ALTER TABLE "project_translations" ADD COLUMN "role" text;--> statement-breakpoint
-- Ajout manuel : recopie du rôle existant dans chaque traduction avant suppression.
UPDATE "project_translations" AS t SET "role" = p."role" FROM "projects" AS p WHERE t."project_id" = p."id";--> statement-breakpoint
ALTER TABLE "projects" DROP COLUMN "role";
