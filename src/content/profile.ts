import type { Locale } from "@/i18n/config";

// Editorial copy and static profile content for storefront sections.
// Display typography titles use `*word*` to mark bold/wide styling, and `|` for line breaks.

export type Profile = {
  /** Hero subtitle strings */
  heroSub: [string, string];
  /** Hero footer metadata */
  heroFoot: [string, string];
  /** Methodology steps */
  steps: { label: string; title: string; detail: string }[];
  /** Expertise areas */
  expertise: { title: string; text: string; tools: string }[];
  /** About section content */
  about: {
    statement: string;
    intro: string;
    facts: { label: string; value: string; href?: string }[];
  };
  /** Career and education journey items */
  journey: {
    year: number;
    period: string;
    title: string;
    place: string;
    text: string;
  }[];
  /** Project process phases (2.2 — Process / Timeline) */
  processSteps: {
    index: string;
    label: string;
    duration: string;
    title: string;
    text: string;
  }[];
  /** Toolkit filters and tools */
  toolkit: {
    filters: { key: "all" | "design" | "dev" | "3d"; label: string }[];
    items: {
      name: string;
      category: "design" | "dev" | "3d";
      meta: string;
      use: string;
    }[];
  };
  /** Lab visual items */
  lab: string[];
  /** Testimonial quote */
  quote: { text: string; author: string; placeholder: boolean };
  /** Footer metadata */
  footer: { basedIn: string; availability: string };
};

const toolkitItems = (l: Locale): Profile["toolkit"]["items"] => {
  const since = l === "fr" ? "depuis" : "since";
  const t = (
    name: string,
    category: "design" | "dev" | "3d",
    kind: string,
    year: number,
    use: [string, string],
  ) => ({
    name,
    category,
    meta: `${kind} — ${since} ${year}`,
    use: use[l === "fr" ? 0 : 1],
  });
  return [
    t("Figma", "design", "Design", 2018, [
      "Maquettes, prototypes, design systems",
      "Mockups, prototypes, design systems",
    ]),
    t("Affinity", "design", "Design", 2025, [
      "Identité, vectoriel, retouche",
      "Identity, vector, retouching",
    ]),
    t("Framer", "design", "Design", 2021, [
      "Prototypes animés",
      "Animated prototypes",
    ]),
    t("FigJam", "design", "Design", 2020, [
      "Ateliers et cartographie",
      "Workshops and mapping",
    ]),
    t("Next.js", "dev", "Dev", 2021, [
      "Sites et applications",
      "Sites and applications",
    ]),
    t("React", "dev", "Dev", 2020, [
      "Interfaces et composants",
      "Interfaces and components",
    ]),
    t("TypeScript", "dev", "Dev", 2021, [
      "Code typé et fiable",
      "Typed, reliable code",
    ]),
    t("Tailwind", "dev", "Dev", 2021, [
      "Styles et design tokens",
      "Styles and design tokens",
    ]),
    t("PostgreSQL", "dev", "Dev", 2022, [
      "Données et back-office",
      "Data and back office",
    ]),
    t("Vercel", "dev", "Dev", 2021, [
      "Déploiement et CDN",
      "Deployment and CDN",
    ]),
    t("Git", "dev", "Dev", 2019, [
      "Versionnage et revue",
      "Versioning and review",
    ]),
    t("Blender", "3d", "3D", 2024, [
      "Rendus et assets en verre",
      "Renders and glass assets",
    ]),
    t("GSAP", "3d", "Motion", 2020, [
      "Animations et scroll",
      "Animation and scroll",
    ]),
    t("Three.js", "3d", "3D", 2023, ["3D temps réel", "Real-time 3D"]),
    t("GLSL", "3d", "3D", 2024, ["Shaders sur mesure", "Custom shaders"]),
    t("Resolve", "3d", "Motion", 2022, [
      "Montage et étalonnage",
      "Editing and grading",
    ]),
  ];
};

const profiles: Record<Locale, Profile> = {
  fr: {
    heroSub: ["Creative developer & directeur artistique", "[ Paris ]"],
    heroFoot: ["[ Approche ]", "Paris — Octobre 2026"],
    steps: [
      {
        label: "[ 01 — Architecturer ]",
        title: "Les *fondations*|avant l'écran.",
        detail: "Backend, bases de données, API : pensés en amont.",
      },
      {
        label: "[ 02 — Concevoir ]",
        title: "De la *DA*|aux maquettes.",
        detail: "Direction artistique, design system, prototypes.",
      },
      {
        label: "[ 03 — Faire connaître ]",
        title: "Du code|au *marché*.",
        detail: "SEO, performance, marketing.",
      },
    ],
    expertise: [
      {
        title: "Design produit",
        text: "Transformer un besoin flou en parcours clair, testé auprès de vrais utilisateurs.",
        tools: "Recherche · Figma · Tests",
      },
      {
        title: "Design system",
        text: "Des composants et des règles qui tiennent quand le produit grandit.",
        tools: "Tokens · Documentation · Accessibilité",
      },
      {
        title: "Prototypage",
        text: "Valider une idée en quelques jours, pas en quelques semaines.",
        tools: "Figma · Code · Motion",
      },
      {
        title: "Front-end",
        text: "Livrer ce qui a été dessiné, au pixel et à la milliseconde près.",
        tools: "Next.js · TypeScript · GSAP · WebGL",
      },
      {
        title: "Interfaces IA",
        text: "Rendre l'IA compréhensible, contrôlable et vraiment utile.",
        tools: "Conversation · Agents · Évaluation",
      },
    ],
    about: {
      statement:
        "Je combine design radical et code *performant* pour créer des expériences digitales qui marquent les esprits.",
      intro:
        "Basé à Paris, je suis un développeur créatif obsédé par les détails. Je ne fais pas juste des sites web, je construis des univers. Mon approche est hybride : à la croisée de l'ingénierie logicielle rigoureuse et de la direction artistique.",
      facts: [
        { label: "Rôle", value: "Creative developer & directeur artistique" },
        { label: "Basé à", value: "Paris, France" },
        { label: "Formation", value: "Master direction artistique" },
        {
          label: "Services",
          value: "Creative development, UI/UX, direction technique",
        },
      ],
    },
    journey: [
      {
        year: 2026,
        period: "2024 — 2026",
        title: "Master direction artistique",
        place: "Formation",
        text: "Perfectionnement des compétences graphiques et techniques pour concevoir des expériences web immersives, à la croisée du code créatif et de l'identité visuelle.",
      },
      {
        year: 2021,
        period: "2021 — 2024",
        title: "Bachelor webdesign",
        place: "Formation",
        text: "Consolidation des fondamentaux du web et du design : architectures front-end, UX/UI et gestion de projets digitaux.",
      },
      {
        year: 2018,
        period: "2018 — 2021",
        title: "DUT MMI & bac STI2D",
        place: "Formation",
        text: "Découverte de l'écosystème numérique : premiers pas en développement web, design graphique et production multimédia.",
      },
    ],
    processSteps: [
      {
        index: "01",
        label: "[ Cadrage & Audit ]",
        duration: "1 — 2 sem.",
        title: "Comprendre avant de dessiner.",
        text: "Analyse du contexte, de la concurrence et des utilisateurs. Audit technique et DA de l'existant. Définition des objectifs mesurables.",
      },
      {
        index: "02",
        label: "[ Direction Artistique & UX ]",
        duration: "2 — 3 sem.",
        title: "Poser le langage visuel.",
        text: "Système de design complet : palette, typographie variable, grille, tokens. Maquettes Figma annotées, flux utilisateur validés.",
      },
      {
        index: "03",
        label: "[ Architecture & Développement ]",
        duration: "3 — 6 sem.",
        title: "Construire avec rigueur.",
        text: "Back-end, bases de données, API, front-end Next.js typé. Animations GSAP / WebGL, accessibilité, tests automatisés.",
      },
      {
        index: "04",
        label: "[ Optimisations & Recette ]",
        duration: "1 — 2 sem.",
        title: "Affiner jusqu'au détail.",
        text: "Lighthouse 95+, Core Web Vitals, recette complète sur appareils réels. Corrections, ajustements éditoriaux, formation si besoin.",
      },
      {
        index: "05",
        label: "[ Déploiement & Suivi ]",
        duration: "Continu",
        title: "Mettre en ligne & mesurer.",
        text: "CI/CD, mise en production sur Vercel, SEO technique, monitoring des performances et des erreurs. Suivi post-lancement.",
      },
    ],
    toolkit: {
      filters: [
        { key: "all", label: "Tout" },
        { key: "design", label: "Design" },
        { key: "dev", label: "Développement" },
        { key: "3d", label: "3D et motion" },
      ],
      items: toolkitItems("fr"),
    },
    lab: [
      "Verre cannelé",
      "Typo variable",
      "Trame",
      "Récursion",
      "Ondes",
      "Chiffres",
    ],
    quote: {
      text: "Un produit confus est devenu quelque chose que nos utilisateurs comprennent du premier coup.",
      author: "Prénom Nom — Poste, Entreprise",
      placeholder: true,
    },
    footer: {
      basedIn: "Paris, FR",
      availability: "CDI ou freelance",
    },
  },
  en: {
    heroSub: ["Creative developer & art director", "[ Paris ]"],
    heroFoot: ["[ Approach ]", "Paris — October 2026"],
    steps: [
      {
        label: "[ 01 — Architect ]",
        title: "The *foundations*|before the screen.",
        detail: "Backend, databases, APIs: designed upfront.",
      },
      {
        label: "[ 02 — Design ]",
        title: "From *art direction*|to mockups.",
        detail: "Art direction, design systems, prototypes.",
      },
      {
        label: "[ 03 — Grow ]",
        title: "From code|to *market*.",
        detail: "SEO, performance, marketing.",
      },
    ],
    expertise: [
      {
        title: "Product design",
        text: "Turning a fuzzy need into a clear journey, tested with real users.",
        tools: "Research · Figma · Testing",
      },
      {
        title: "Design systems",
        text: "Components and rules that hold up as the product grows.",
        tools: "Tokens · Documentation · Accessibility",
      },
      {
        title: "Prototyping",
        text: "Validating an idea in days, not weeks.",
        tools: "Figma · Code · Motion",
      },
      {
        title: "Front-end",
        text: "Shipping what was designed, down to the pixel and the millisecond.",
        tools: "Next.js · TypeScript · GSAP · WebGL",
      },
      {
        title: "AI interfaces",
        text: "Making AI understandable, controllable and genuinely useful.",
        tools: "Conversation · Agents · Evaluation",
      },
    ],
    about: {
      statement:
        "I combine bold design and *high-performance* code to create digital experiences people remember.",
      intro:
        "Based in Paris, I'm a creative developer obsessed with detail. I don't just build websites, I build worlds. My approach is hybrid: where rigorous software engineering meets art direction.",
      facts: [
        { label: "Role", value: "Creative developer & art director" },
        { label: "Based in", value: "Paris, France" },
        { label: "Education", value: "Master's in art direction" },
        {
          label: "Services",
          value: "Creative development, UI/UX, technical direction",
        },
      ],
    },
    journey: [
      {
        year: 2026,
        period: "2024 — 2026",
        title: "Master's in art direction",
        place: "Education",
        text: "Honing graphic and technical skills to design immersive web experiences, where creative coding meets visual identity.",
      },
      {
        year: 2021,
        period: "2021 — 2024",
        title: "Bachelor's in web design",
        place: "Education",
        text: "Strengthening web and design fundamentals: front-end architecture, UX/UI and digital project management.",
      },
      {
        year: 2018,
        period: "2018 — 2021",
        title: "DUT MMI & STI2D baccalaureate",
        place: "Education",
        text: "Discovering the digital ecosystem: first steps in web development, graphic design and multimedia production.",
      },
    ],
    processSteps: [
      {
        index: "01",
        label: "[ Scoping & Audit ]",
        duration: "1 — 2 wks",
        title: "Understand before designing.",
        text: "Context, competition and user analysis. Technical and design audit of the existing product. Definition of measurable goals.",
      },
      {
        index: "02",
        label: "[ Art Direction & UX ]",
        duration: "2 — 3 wks",
        title: "Set the visual language.",
        text: "Full design system: palette, variable type, grid, tokens. Annotated Figma mockups and validated user flows.",
      },
      {
        index: "03",
        label: "[ Architecture & Development ]",
        duration: "3 — 6 wks",
        title: "Build with rigour.",
        text: "Back-end, databases, APIs, typed Next.js front-end. GSAP / WebGL animations, accessibility, automated tests.",
      },
      {
        index: "04",
        label: "[ Optimisation & QA ]",
        duration: "1 — 2 wks",
        title: "Polish down to the detail.",
        text: "Lighthouse 95+, Core Web Vitals, full QA on real devices. Fixes, editorial adjustments, training if needed.",
      },
      {
        index: "05",
        label: "[ Launch & Monitoring ]",
        duration: "Ongoing",
        title: "Ship & measure.",
        text: "CI/CD, Vercel production deployment, technical SEO, performance and error monitoring. Post-launch support.",
      },
    ],
    toolkit: {
      filters: [
        { key: "all", label: "All" },
        { key: "design", label: "Design" },
        { key: "dev", label: "Development" },
        { key: "3d", label: "3D and motion" },
      ],
      items: toolkitItems("en"),
    },
    lab: [
      "Fluted glass",
      "Variable type",
      "Halftone",
      "Recursion",
      "Waves",
      "Numerals",
    ],
    quote: {
      text: "A confusing product became something our users understand at first glance.",
      author: "First Last — Role, Company",
      placeholder: true,
    },
    footer: {
      basedIn: "Paris, FR",
      availability: "Full-time or freelance",
    },
  },
};

export function getProfile(locale: Locale): Profile {
  return profiles[locale];
}
