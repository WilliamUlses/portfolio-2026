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
    heroSub: ["Développeur créatif & directeur artistique", "[ Paris ]"],
    heroFoot: ["[ Approche ]", "Paris — Octobre 2026"],
    steps: [
      {
        label: "[ 01 — Structurer ]",
        title: "Le code|avant le *décor*.",
        detail:
          "Architecture logicielle, modèle de données et logique serveur pensés dès le départ.",
      },
      {
        label: "[ 02 — Dessiner ]",
        title: "De la *DA*|aux maquettes.",
        detail:
          "Direction artistique, typographie, design system et maquettes interactives.",
      },
      {
        label: "[ 03 — Animer ]",
        title: "Du mouvement|au *pixel*.",
        detail:
          "Front-end réactif, shaders WebGL et interactions soignées, sans compromis sur la vitesse.",
      },
    ],
    expertise: [
      {
        title: "Design d'interface",
        text: "Comprendre les besoins réels, structurer l'information et dessiner des parcours évidents.",
        tools: "Recherche · Figma · Wireframes",
      },
      {
        title: "Design system",
        text: "Bâtir des bibliothèques de composants cohérentes, documentées et pensées pour durer.",
        tools: "Tokens · Typographie · Accessibilité",
      },
      {
        title: "Prototypage",
        text: "Concevoir des prototypes interactifs sous Figma et en code pour tester le rythme avant de développer.",
        tools: "Figma · Code · Motion",
      },
      {
        title: "Front-end moderne",
        text: "Développer des interfaces fidèles aux maquettes, accessibles et rapides sur tous les écrans.",
        tools: "Next.js · TypeScript · React · Tailwind",
      },
      {
        title: "Code créatif & 3D",
        text: "Intégrer des shaders GLSL, des scènes Three.js et des animations fluides sans ralentir le navigateur.",
        tools: "Three.js · GLSL · GSAP · WebGL",
      },
    ],
    about: {
      statement:
        "Du design d'interface au code *créatif*, je conçois des sites et des outils pensés dans le moindre détail.",
      intro: "",
      facts: [
        { label: "Rôle", value: "Développeur créatif & directeur artistique" },
        { label: "Basé à", value: "Paris, France" },
        { label: "Formation", value: "Master direction artistique" },
        {
          label: "Services",
          value: "Direction artistique, front-end, WebGL",
        },
      ],
    },
    journey: [
      {
        year: 2026,
        period: "2024 — 2026",
        title: "Master direction artistique",
        place: "Formation",
        text: "Approfondissement de la direction artistique, de la typographie et de la création d'expériences web interactives.",
      },
      {
        year: 2021,
        period: "2021 — 2024",
        title: "Bachelor webdesign",
        place: "Formation",
        text: "Apprentissage des fondamentaux du design d'interface, du prototypage et du développement front-end.",
      },
      {
        year: 2018,
        period: "2018 — 2021",
        title: "DUT MMI & bac STI2D",
        place: "Formation",
        text: "Découverte des métiers du web : programmation, design graphique, vidéo et culture technique.",
      },
    ],
    processSteps: [
      {
        index: "01",
        label: "[ 01 — Cadrage ]",
        duration: "1 — 2 sem.",
        title: "Poser le cadre.",
        text: "Échanger sur vos enjeux, cerner les contraintes techniques et définir un plan d'action réaliste.",
      },
      {
        index: "02",
        label: "[ 02 — Design ]",
        duration: "2 — 3 sem.",
        title: "Dessiner l'interface.",
        text: "Définir la typographie, composer la palette, élaborer les maquettes et prototyper les parcours clés.",
      },
      {
        index: "03",
        label: "[ 03 — Développement ]",
        duration: "3 — 6 sem.",
        title: "Bâtir l'application.",
        text: "Rédiger un code propre et maintenable : Next.js, TypeScript, animations sur mesure et bases de données.",
      },
      {
        index: "04",
        label: "[ 04 — Finitions ]",
        duration: "1 — 2 sem.",
        title: "Peaufiner les détails.",
        text: "Tester sur différents écrans et navigateurs, optimiser les temps de chargement et vérifier l'accessibilité.",
      },
      {
        index: "05",
        label: "[ 05 — Mise en ligne ]",
        duration: "Continu",
        title: "Déployer et accompagner.",
        text: "Mise en production automatisée, configuration du domaine, indexation SEO et accompagnement pour la prise en main.",
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
        label: "[ 01 — Structure ]",
        title: "Code|before the *surface*.",
        detail:
          "Software architecture, data models and server logic designed from day one.",
      },
      {
        label: "[ 02 — Craft ]",
        title: "From *art direction*|to mockups.",
        detail:
          "Visual identity, typography, design systems and interactive prototypes.",
      },
      {
        label: "[ 03 — Animate ]",
        title: "Motion|down to the *pixel*.",
        detail:
          "Responsive front-end, WebGL shaders and polished interactions without slowing down the page.",
      },
    ],
    expertise: [
      {
        title: "Interface design",
        text: "Understanding real user needs, structuring information and designing intuitive flows.",
        tools: "Research · Figma · Wireframes",
      },
      {
        title: "Design systems",
        text: "Building consistent, documented component libraries that scale cleanly over time.",
        tools: "Tokens · Typography · Accessibility",
      },
      {
        title: "Prototyping",
        text: "Interactive Figma and code prototypes to test feel and interactions before full build.",
        tools: "Figma · Code · Motion",
      },
      {
        title: "Modern front-end",
        text: "Building interfaces true to design, accessible and lightning fast across all devices.",
        tools: "Next.js · TypeScript · React · Tailwind",
      },
      {
        title: "Creative coding & 3D",
        text: "Integrating GLSL shaders, Three.js scenes and smooth motion without hurting page speed.",
        tools: "Three.js · GLSL · GSAP · WebGL",
      },
    ],
    about: {
      statement:
        "From interface design to *creative* code, I build websites and web apps crafted down to every detail.",
      intro: "",
      facts: [
        { label: "Role", value: "Creative developer & art director" },
        { label: "Based in", value: "Paris, France" },
        { label: "Education", value: "Master's in art direction" },
        {
          label: "Services",
          value: "Art direction, front-end, WebGL",
        },
      ],
    },
    journey: [
      {
        year: 2026,
        period: "2024 — 2026",
        title: "Master's in art direction",
        place: "Education",
        text: "Deepening art direction, typography and interactive web experiences.",
      },
      {
        year: 2021,
        period: "2021 — 2024",
        title: "Bachelor's in web design",
        place: "Education",
        text: "Core training in interface design, prototyping and front-end development.",
      },
      {
        year: 2018,
        period: "2018 — 2021",
        title: "DUT MMI & STI2D baccalaureate",
        place: "Education",
        text: "Foundations in digital crafts: programming, graphic design, video and web culture.",
      },
    ],
    processSteps: [
      {
        index: "01",
        label: "[ 01 — Scoping ]",
        duration: "1 — 2 wks",
        title: "Frame the project.",
        text: "Discussing your goals, mapping technical constraints and setting a realistic roadmap.",
      },
      {
        index: "02",
        label: "[ 02 — Design ]",
        duration: "2 — 3 wks",
        title: "Shape the visual identity.",
        text: "Selecting typography, building colour systems, designing mockups and prototyping key flows.",
      },
      {
        index: "03",
        label: "[ 03 — Build ]",
        duration: "3 — 6 wks",
        title: "Engineer the product.",
        text: "Writing clean, typed and testable code: Next.js, TypeScript, custom motion and databases.",
      },
      {
        index: "04",
        label: "[ 04 — Polish ]",
        duration: "1 — 2 wks",
        title: "Refine every detail.",
        text: "Testing across real devices and browsers, shaving loading times and verifying accessibility.",
      },
      {
        index: "05",
        label: "[ 05 — Ship ]",
        duration: "Ongoing",
        title: "Deploy & handover.",
        text: "Automated deployment, domain routing, technical SEO and guidance on using the product.",
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
