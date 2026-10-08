// Pure functions generating schema.org structured data (Person, WebSite, CreativeWork, Blog, BlogPosting, Breadcrumbs)

type Json = Record<string, unknown>;

export function personJsonLd(p: {
  name: string;
  url: string;
  jobTitle?: string;
  image?: string;
  sameAs: string[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${p.url}/#person`,
    name: p.name,
    url: p.url,
    ...(p.jobTitle ? { jobTitle: p.jobTitle } : {}),
    ...(p.image ? { image: p.image } : {}),
    ...(p.sameAs.length ? { sameAs: p.sameAs } : {}),
  };
}

export function websiteJsonLd(w: {
  name: string;
  url: string;
  inLanguage: string[];
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: w.name,
    url: w.url,
    inLanguage: w.inLanguage,
    publisher: { "@id": `${w.url}/#person` },
  };
}

export function creativeWorkJsonLd(c: {
  name: string;
  description: string;
  url: string;
  siteUrl: string;
  creatorName: string;
  year: number;
  image?: string;
  keywords: string[];
  inLanguage: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: c.name,
    description: c.description,
    url: c.url,
    inLanguage: c.inLanguage,
    dateCreated: String(c.year),
    creator: {
      "@type": "Person",
      "@id": `${c.siteUrl}/#person`,
      name: c.creatorName,
    },
    ...(c.image ? { image: c.image } : {}),
    ...(c.keywords.length ? { keywords: c.keywords.join(", ") } : {}),
  };
}

type PostingInput = {
  headline: string;
  description: string;
  url: string;
  siteUrl: string;
  /** Journal index URL (Blog @id) */
  blogUrl: string;
  authorName: string;
  datePublished: Date;
  dateModified?: Date;
  image?: { url: string; width: number; height: number };
  section?: string | null;
  wordCount?: number;
  minutes?: number;
  inLanguage: string;
};

function posting(b: PostingInput): Json {
  return {
    "@type": "BlogPosting",
    "@id": `${b.url}#article`,
    headline: b.headline,
    description: b.description,
    url: b.url,
    mainEntityOfPage: { "@type": "WebPage", "@id": b.url },
    inLanguage: b.inLanguage,
    datePublished: b.datePublished.toISOString(),
    ...(b.dateModified ? { dateModified: b.dateModified.toISOString() } : {}),
    author: {
      "@type": "Person",
      "@id": `${b.siteUrl}/#person`,
      name: b.authorName,
      url: b.siteUrl,
    },
    publisher: { "@id": `${b.siteUrl}/#person` },
    isPartOf: { "@type": "Blog", "@id": `${b.blogUrl}#blog` },
    ...(b.image
      ? {
          image: {
            "@type": "ImageObject",
            url: b.image.url,
            width: b.image.width,
            height: b.image.height,
          },
        }
      : {}),
    ...(b.section ? { articleSection: b.section, keywords: b.section } : {}),
    ...(b.wordCount ? { wordCount: b.wordCount } : {}),
    ...(b.minutes ? { timeRequired: `PT${b.minutes}M` } : {}),
  };
}

export function blogPostingJsonLd(b: PostingInput): Json {
  return { "@context": "https://schema.org", ...posting(b) };
}

/** Journal index: Blog with its posts (summary form). */
export function blogJsonLd(b: {
  name: string;
  description: string;
  url: string;
  siteUrl: string;
  inLanguage: string;
  posts: Omit<
    PostingInput,
    "siteUrl" | "blogUrl" | "inLanguage" | "authorName"
  >[];
  authorName: string;
}): Json {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${b.url}#blog`,
    name: b.name,
    description: b.description,
    url: b.url,
    inLanguage: b.inLanguage,
    author: { "@id": `${b.siteUrl}/#person` },
    publisher: { "@id": `${b.siteUrl}/#person` },
    blogPost: b.posts.map((p) =>
      posting({
        ...p,
        siteUrl: b.siteUrl,
        blogUrl: b.url,
        inLanguage: b.inLanguage,
        authorName: b.authorName,
      }),
    ),
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): Json {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Serializes data for <script type="application/ld+json">, escaping script tag delimiters.
 */
export function serializeJsonLd(data: Json | Json[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
