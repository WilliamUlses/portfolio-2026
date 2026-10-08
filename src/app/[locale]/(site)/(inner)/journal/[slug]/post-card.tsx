import { formatPostDate } from "@/content/post-date";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { ogArticle, ogFromImage } from "@/seo/og";
import { siteUrl } from "@/seo/site";
import { getPostBySlug } from "@/server/queries";

// Shared by opengraph-image and twitter-image. Per-article social card (also used as the journal list thumbnail): the uploaded
// cover when there is one, otherwise a branded fluted-glass card with the title.
export async function postCard(
  params: Promise<{ locale: string; slug: string }>,
) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "fr";
  const dict = getDictionary(locale);
  const post = await getPostBySlug(slug, locale);
  const domain = new URL(siteUrl()).host;
  if (!post) {
    return ogArticle({
      section: dict.journal.title,
      title: dict.journal.statement.replaceAll("*", ""),
      meta: "",
      domain,
    });
  }
  if (post.cover && post.cover.kind !== "video") {
    const fromCover = await ogFromImage(post.cover.url);
    if (fromCover) return fromCover;
  }
  const fromLocal = await ogFromImage(`/thumbnails/${slug}.png`);
  if (fromLocal) return fromLocal;
  return ogArticle({
    section: dict.journal.title,
    topic: post.topic,
    title: post.title,
    meta: `${formatPostDate(post.publishedAt, locale)} · ${post.minutes} min`,
    domain,
  });
}
