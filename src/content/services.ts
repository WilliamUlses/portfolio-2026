import type { Locale } from "@/i18n/config";

// Services page content (Roadmap V2 — 3.1): the 4 expertise pillars, one "chapter" each.
// `rows` feed the key/value detail table; `cases` lists project slugs (only published
// ones are rendered, in this order).

export type Service = {
  key: string;
  /** Short category label above the title */
  category: string;
  /** Display syntax: `*word*` = bold/wide, `|` = line break */
  title: string;
  /** Positioning sentence shown under the numeral */
  tagline: string;
  rows: { label: string; value: string }[];
  cases: string[];
};

const services: Record<Locale, Service[]> = {
  fr: [
    {
      key: "creative-development",
      category: "Code créatif",
      title: "Développement *créatif*",
      tagline:
        "Donner vie aux maquettes avec un code soigné : scènes WebGL, shaders sur mesure et animations fluides sans pénaliser la performance.",
      rows: [
        { label: "3D temps réel", value: "Three.js, scènes WebGL" },
        { label: "Shaders", value: "GLSL sur mesure et réfraction" },
        { label: "Animation", value: "GSAP, transitions au scroll" },
        { label: "Typographie", value: "Variable et réactive" },
        {
          label: "Livrables",
          value: "Composants animés, repli accessible",
        },
      ],
      cases: ["rap-timeline", "gradient-lab", "shadowlab", "ma-chambre-3d"],
    },
    {
      key: "art-direction",
      category: "Design",
      title: "Direction *artistique*|& UI/UX",
      tagline:
        "Concevoir des identités visuelles fortes et des interfaces claires, du premier croquis aux maquettes finales.",
      rows: [
        { label: "Identité", value: "Logo, typographie, palette de couleurs" },
        {
          label: "Design system",
          value: "Tokens, composants réutilisables, grille",
        },
        {
          label: "Parcours",
          value: "Architecture de l'information et ergonomie",
        },
        {
          label: "Prototypes",
          value: "Maquettes Figma interactives bureau et mobile",
        },
        {
          label: "Livrables",
          value: "Bibliothèque Figma, maquettes prêtes au dev",
        },
      ],
      cases: ["do-corp", "le-lien", "jo-paris-2024"],
    },
    {
      key: "software-architecture",
      category: "Ingénierie",
      title: "Architecture *logicielle*|& SaaS",
      tagline:
        "Bâtir des applications fiables et maintenables : modélisation de données, API robustes et back-offices intuitifs.",
      rows: [
        {
          label: "Applications",
          value: "Next.js 16, React, TypeScript strict",
        },
        { label: "Données", value: "PostgreSQL, sécurité par ligne (RLS)" },
        { label: "API", value: "REST et GraphQL typées" },
        { label: "Back-office", value: "Espaces d'administration sur mesure" },
        {
          label: "Livrables",
          value: "Schéma de données, back-office, documentation",
        },
      ],
      cases: [
        "detailing-fr",
        "do-corp-plateforme",
        "fd-pilot",
        "detailing-cms",
      ],
    },
    {
      key: "technical-direction",
      category: "Pilotage",
      title: "Direction *technique*|& performance",
      tagline:
        "Accompagner la réalisation de bout en bout : intégration continue, audits de performance et optimisation du référencement.",
      rows: [
        { label: "CI/CD", value: "Pipelines de test et déploiements continus" },
        {
          label: "Performance",
          value: "Core Web Vitals et scores Lighthouse 95+",
        },
        { label: "SEO", value: "Balisage technique, métadonnées, sitemap" },
        { label: "Qualité", value: "Revue de code et accessibilité" },
        {
          label: "Livrables",
          value: "Pipeline automatisé, rapport d'audit",
        },
      ],
      cases: ["detailing-fr", "freelance-os", "gitswitch"],
    },
  ],
  en: [
    {
      key: "creative-development",
      category: "Creative code",
      title: "Creative *development*",
      tagline:
        "Bringing designs to life with refined code: WebGL scenes, custom shaders and smooth motion without hurting page speed.",
      rows: [
        { label: "Real-time 3D", value: "Three.js, WebGL scenes" },
        { label: "Shaders", value: "Custom GLSL & refraction" },
        { label: "Animation", value: "GSAP, scroll interactions" },
        { label: "Typography", value: "Variable and responsive" },
        {
          label: "Deliverables",
          value: "Animated components, accessible fallback",
        },
      ],
      cases: ["rap-timeline", "gradient-lab", "shadowlab", "ma-chambre-3d"],
    },
    {
      key: "art-direction",
      category: "Design",
      title: "*Art direction*|& UI/UX",
      tagline:
        "Designing distinct visual identities and clear user interfaces, from initial concepts to final mockups.",
      rows: [
        { label: "Identity", value: "Logo, typography, colour palette" },
        { label: "Design system", value: "Tokens, reusable components, grid" },
        { label: "User flows", value: "Information architecture and UX" },
        {
          label: "Prototypes",
          value: "Interactive Figma mockups for mobile & desktop",
        },
        {
          label: "Deliverables",
          value: "Figma library, dev-ready mockups",
        },
      ],
      cases: ["do-corp", "le-lien", "jo-paris-2024"],
    },
    {
      key: "software-architecture",
      category: "Engineering",
      title: "*Software* architecture|& SaaS",
      tagline:
        "Laying dependable technical foundations: structured data models, clean APIs and intuitive back-offices.",
      rows: [
        { label: "Applications", value: "Next.js 16, strict TypeScript" },
        { label: "Data", value: "PostgreSQL, row-level security (RLS)" },
        { label: "APIs", value: "REST and GraphQL" },
        { label: "SaaS", value: "Multi-tenant, custom back offices" },
        {
          label: "Deliverables",
          value: "Data model, back office, documentation",
        },
      ],
      cases: [
        "detailing-fr",
        "do-corp-plateforme",
        "fd-pilot",
        "detailing-cms",
      ],
    },
    {
      key: "technical-direction",
      category: "Leadership",
      title: "*Technical* direction|& performance",
      tagline:
        "Ensuring speed, stability and search visibility: automated delivery pipelines, performance audits and technical SEO.",
      rows: [
        { label: "CI/CD", value: "Automated tests and deployments" },
        { label: "Performance", value: "Core Web Vitals, Lighthouse 95+" },
        { label: "SEO", value: "Technical metadata and sitemap" },
        { label: "Quality", value: "Code reviews and accessibility" },
        {
          label: "Deliverables",
          value: "CI/CD pipeline, audit report",
        },
      ],
      cases: ["detailing-fr", "freelance-os", "gitswitch"],
    },
  ],
};

export function getServices(locale: Locale): Service[] {
  return services[locale];
}
