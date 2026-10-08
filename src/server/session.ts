import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

// Session enforcement for protected admin layouts, server actions, and API routes.
export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Returns session or null for API routes (enables 401 handling) */
export async function getAdminSession() {
  return auth.api.getSession({ headers: await headers() });
}
