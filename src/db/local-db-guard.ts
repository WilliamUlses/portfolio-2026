// Shared guard (drizzle.config.ts, scripts): outside Vercel, the local database must be
// a working Neon branch — "dev" (development) or "e2e" (testing).
// `vercel env pull` overwrites .env.local with PRODUCTION URLs and removes the marker.
export type LocalBranch = "dev" | "e2e";

export function assertLocalDevDatabase(
  tool: string,
  allowed: readonly LocalBranch[] = ["dev"],
): LocalBranch {
  if (process.env.VERCEL) {
    throw new Error(`${tool}: execution on Vercel refused.`);
  }
  const branch = process.env.LOCAL_DB_BRANCH;
  if (!allowed.includes(branch as LocalBranch)) {
    throw new Error(
      `${tool} refused: LOCAL_DB_BRANCH must be ${allowed.join(" or ")} ` +
        `(currently: ${branch ?? "missing"}).`,
    );
  }
  return branch as LocalBranch;
}
