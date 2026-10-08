import { eq } from "drizzle-orm";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { projects } from "@/db/schema";
import { isLocale } from "@/i18n/config";
import { href } from "@/i18n/routes";
import { getAdminSession } from "@/server/session";

// Project preview route: GET /api/draft?id=...&locale=...
// Requires active admin session; destination URL is constructed from the database slug to prevent open redirects.
export async function GET(request: Request): Promise<Response> {
  if (!(await getAdminSession())) {
    return new Response("Unauthorized", { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const locale = params.get("locale");
  if (!id || !isLocale(locale)) {
    return new Response("Invalid parameters", { status: 400 });
  }
  const [project] = await db
    .select({ slug: projects.slug })
    .from(projects)
    .where(eq(projects.id, id));
  if (!project) return new Response("Project not found", { status: 404 });

  (await draftMode()).enable();
  redirect(href("project", locale, { slug: project.slug }));
}
