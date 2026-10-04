// Pure functions generating schema.org structured data (Person, WebSite, CreativeWork, Breadcrumbs)

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
