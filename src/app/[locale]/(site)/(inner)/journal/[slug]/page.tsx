import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JournalThumbnail } from "@/components/site/JournalThumbnail";
import { JsonLd } from "@/components/site/JsonLd";
import { MotionTitle } from "@/components/site/MotionTitle";
import { formatPostDate } from "@/content/post-date";
import { Blocks } from "@/content/render";
import { href } from "@/i18n/routes";
import { getLocaleContext } from "@/i18n/server";
import { identityJsonLd } from "@/seo/identity";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/seo/jsonld";
import { pageMetadata, rssAlternates } from "@/seo/metadata";
import { OG_SIZE } from "@/seo/og";
import { siteUrl } from "@/seo/site";
import {
  getPostBySlug,
  getPublishedPostSlugs,
  getSiteSettings,
} from "@/server/queries";
import styles from "../journal.module.css";

// Journal article (Roadmap V2 3.2): case-study layout — sticky meta column on the
// left, title + excerpt + cover + blocks on the right, older/newer navigation.

const NO_POST = "aucun-article";
export async function generateStaticParams() {
  const slugs = await getPublishedPostSlugs();
  return (slugs.length ? slugs : [NO_POST]).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/journal/[slug]">): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([
    params,
    getLocaleContext(),
  ]);
  const [post, settings] = await Promise.all([
    getPostBySlug(slug, locale),
    getSiteSettings(),
  ]);
  if (!post) return {};
  const meta = pageMetadata({
    page: "post",
    locale,
    slug: post.slug,
    title: post.seoTitle || post.title,
    siteName: settings.name,
    description: post.seoDescription || post.excerpt,
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authorName: settings.name,
      authorUrl: siteUrl(),
      section: post.topic,
      tags: post.topic ? [post.topic] : [],
    },
  });
  return {
    ...meta,
    alternates: { ...meta.alternates, types: rssAlternates() },
  };
}

export default async function PostPage({
  params,
}: PageProps<"/[locale]/journal/[slug]">) {
  const [{ slug }, { locale, dict }] = await Promise.all([
    params,
    getLocaleContext(),
  ]);
  const [post, settings] = await Promise.all([
    getPostBySlug(slug, locale),
    getSiteSettings(),
  ]);
  if (!post) notFound();
  const t = dict.journal;
  const p = dict.project;
  const base = siteUrl();
  const url = `${base}${href("post", locale, { slug: post.slug })}`;
  const blogUrl = `${base}${href("journal", locale)}`;
  const jsonLd = [
    ...identityJsonLd(settings, locale),
    blogPostingJsonLd({
      headline: post.title,
      description: post.seoDescription || post.excerpt,
      url,
      siteUrl: base,
      blogUrl,
      authorName: settings.name,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      image: { url: `${url}/opengraph-image`, ...OG_SIZE },
      section: post.topic,
      wordCount: post.words,
      minutes: post.minutes,
      inLanguage: locale,
    }),
    breadcrumbJsonLd([
      { name: dict.nav.home, url: `${base}${href("home", locale)}` },
      { name: t.title, url: blogUrl },
      { name: post.title, url },
    ]),
  ];

  return (
    <article className={styles.article}>
      <JsonLd data={jsonLd} />
      <aside className={styles.meta}>
        <Link href={href("journal", locale)} className={styles.back}>
          <span aria-hidden="true">← </span>
          {t.all}
        </Link>
        <dl className={styles.facts}>
          <div>
            <dt>{t.published}</dt>
            <dd>
              <time dateTime={post.publishedAt.toISOString()}>
                {formatPostDate(post.publishedAt, locale)}
              </time>
            </dd>
          </div>
          {post.topic ? (
            <div>
              <dt>{t.topic}</dt>
              <dd>{post.topic}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t.reading}</dt>
            <dd>{post.minutes} min</dd>
          </div>
        </dl>
      </aside>

      <div className={styles.content}>
        <div className={styles.cover} data-shared-target>
          <JournalThumbnail slug={post.slug} alt={post.title} priority />
        </div>
        <p className={styles.label}>{t.title}</p>
        <MotionTitle className={styles.postTitle}>{post.title}</MotionTitle>
        {post.excerpt ? (
          <p className={styles.postExcerpt}>{post.excerpt}</p>
        ) : null}
        <Blocks
          blocks={post.blocks}
          media={post.media}
          labels={{
            stats: p.stats,
            credits: p.credits,
            embed: {
              vimeo: p.embedVimeo,
              youtube: p.embedYoutube,
              figma: p.embedFigma,
            },
          }}
        />

        {post.newer || post.older ? (
          <nav className={styles.pager} aria-label={t.all}>
            {post.older ? (
              <Link
                href={href("post", locale, { slug: post.older.slug })}
                className={styles.pagerLink}
                data-shared-scope
                data-transition-label={post.older.title}
                aria-label={`${t.older} : ${post.older.title}`}
                rel="prev"
              >
                <span className={styles.pagerLabel}>← {t.older}</span>
                <div className={styles.pagerThumb}>
                  <JournalThumbnail slug={post.older.slug} alt="" />
                </div>
              </Link>
            ) : (
              <span />
            )}
            {post.newer ? (
              <Link
                href={href("post", locale, { slug: post.newer.slug })}
                className={`${styles.pagerLink} ${styles.pagerNext}`}
                data-shared-scope
                data-transition-label={post.newer.title}
                aria-label={`${t.newer} : ${post.newer.title}`}
                rel="next"
              >
                <span className={styles.pagerLabel}>{t.newer} →</span>
                <div className={styles.pagerThumb}>
                  <JournalThumbnail slug={post.newer.slug} alt="" />
                </div>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </article>
  );
}
