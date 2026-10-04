import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { assertLocalDevDatabase } from "./src/db/local-db-guard";

// Load local environment and verify target branch when running outside deployment environment
if (!process.env.VERCEL) {
  config({ path: ".env.local", quiet: true });
  assertLocalDevDatabase("drizzle-kit", ["dev", "e2e"]);
}

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("Missing DATABASE_URL");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./src/db/migrations",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
