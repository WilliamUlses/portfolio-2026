import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE } from "@/i18n/config";
import { decide } from "@/i18n/decide";
import { href } from "@/i18n/routes";
import { isPublishedPostSlug } from "@/server/queries/post-slug";
import { lookupProjectSlug } from "@/server/queries/project-slug";

// Edge routing proxy:
// - /admin: optimistic check for session cookie (authoritative check done by requireAdmin())
// - Storefront: locale prefix, translated segments, 404 handling, maintenance mode when SITE_OPEN != "true"
// - Project slug redirects (308 permanent redirect for renamed projects)

// Custom 404 handling: fetches the pre-rendered localized 404 page and returns it with a true HTTP 404 status.
const INTERNAL_404_HEADER = "x-portfolio-404";
const NOT_FOUND_PAGE = /^\/(fr|en)\/introuvable$/;
const PROJECT_PAGE = /^\/(fr|en)\/projects\/([^/]+)$/;
const POST_PAGE = /^\/(fr|en)\/journal\/([^/]+)$/;
// Next.js draft mode cookie (draftMode().enable() called in /api/draft)
const PREVIEW_COOKIE = "__prerender_bypass";
// OpenGraph dynamic images served with internal route paths
const OG_IMAGE =
  /^\/(fr|en)(\/(projects|journal)\/[a-z0-9-]+)?\/(opengraph|twitter)-image(-[\w-]+)?$/;

async function serveNotFound(request: NextRequest, to: string) {
  const page = await fetch(new URL(to, request.url), {
    headers: {
      [INTERNAL_404_HEADER]: "1",
      cookie: request.headers.get("cookie") ?? "",
    },
  });
  return new NextResponse(await page.text(), {
    status: 404,
    headers: {
      "content-type":
        page.headers.get("content-type") ?? "text/html; charset=utf-8",
    },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname !== "/admin/login" && !getSessionCookie(request)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // Internal 404 subrequest: serve directly to prevent rewrite loops
  if (
    request.headers.get(INTERNAL_404_HEADER) === "1" &&
    NOT_FOUND_PAGE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (OG_IMAGE.test(pathname)) return NextResponse.next();

  const preview = request.cookies.has(PREVIEW_COOKIE);
  const decision = decide({
    pathname,
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
    // In preview mode, allow admin to access site even when SITE_OPEN is false
    siteOpen: process.env.SITE_OPEN === "true" || preview,
  });

  // Project slug resolution: redirect renamed slugs (308), serve 404 if missing/unpublished
  const internal =
    decision.type === "rewrite" && !decision.status
      ? decision.to
      : decision.type === "next"
        ? pathname
        : null;
  const project = internal ? PROJECT_PAGE.exec(internal) : null;
  const [, projectLocale, projectSlug] = project ?? [];
  if (!preview && projectSlug && isLocale(projectLocale)) {
    const found = await lookupProjectSlug(projectSlug);
    if (found.kind === "moved") {
      const to = new URL(
        href("project", projectLocale, { slug: found.slug }),
        request.url,
      );
      to.search = request.nextUrl.search;
      return NextResponse.redirect(to, 308);
    }
    if (found.kind === "missing") {
      return serveNotFound(request, `/${projectLocale}/introuvable`);
    }
  }

  // Journal post: unknown or unpublished slug → real 404
  const post = internal ? POST_PAGE.exec(internal) : null;
  const [, postLocale, postSlug] = post ?? [];
  if (
    postSlug &&
    isLocale(postLocale) &&
    !(await isPublishedPostSlug(postSlug))
  ) {
    return serveNotFound(request, `/${postLocale}/introuvable`);
  }

  // Preserve URL search params across redirects and rewrites
  const withQuery = (to: string) => {
    const url = new URL(to, request.url);
    url.search = request.nextUrl.search;
    return url;
  };
  switch (decision.type) {
    case "redirect":
      return NextResponse.redirect(withQuery(decision.to), decision.status);
    case "rewrite":
      return decision.status === 404
        ? serveNotFound(request, decision.to)
        : NextResponse.rewrite(withQuery(decision.to));
    default:
      return NextResponse.next();
  }
}

export const config = {
  // Match all request paths except API routes, Next.js internal assets, and static files
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
