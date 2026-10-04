// Checks if database is available during build (CI builds can run without database secrets)
export function databaseAvailable(): boolean {
  return !(
    process.env.SKIP_ENV_VALIDATION === "true" && !process.env.DATABASE_URL
  );
}
