# William Ulses — Portfolio 2026

[![CI](https://github.com/WilliamUlses/portfolio-2026/actions/workflows/ci.yml/badge.svg)](https://github.com/WilliamUlses/portfolio-2026/actions/workflows/ci.yml)

Mon portfolio, avec son propre back-office pour gérer les projets sans toucher au code.
Site : [williamulses.fr](https://williamulses.fr)

## Ce qu'il y a dedans

**Vitrine** (FR / EN)
- Accueil, index des projets (liste, grille, filtres), études de cas, À propos, Contact
- Études de cas construites en blocs : texte, images, galeries, vidéos, citations,
  chiffres clés, crédits, embeds
- Fonds animés en shaders, défilement fluide
- SEO : sitemap, données structurées, images Open Graph générées par page

**Admin** (`/admin`)
- Éditeur de projets par blocs (glisser-déposer, texte riche, copie FR → EN)
- Médiathèque : upload direct vers le stockage, vidéos avec poster auto, SVG nettoyés,
  détection des médias inutilisés
- Brouillons, publication, redirections automatiques quand un slug change
- Connexion par passkey ou mot de passe + double authentification (TOTP)

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict |
| Style | Tailwind CSS v4 · CSS Modules · shadcn/ui + Radix (admin) |
| Animation | GSAP · Lenis · Three.js · Paper Shaders |
| Données | Neon Postgres · Drizzle ORM (migrations appliquées au build) |
| Médias | Vercel Blob (OIDC) · Sharp · ThumbHash pour les placeholders · SVGO + DOMPurify |
| Éditeur | Tiptap · dnd-kit |
| Auth | Better Auth (passkeys, 2FA) |
| E-mail | Resend (formulaire de contact) |
| Validation | Zod |
| Outillage | pnpm · Biome · GitHub Actions |
| Hébergement | Vercel |

## Lancer en local

```bash
nvm use                      # Node 24
corepack enable pnpm
pnpm install
cp .env.example .env.local   # base Neon, store Blob, secret Better Auth, clé Resend
pnpm db:migrate
pnpm dev
```

## Vérifier

```bash
pnpm verify                  # Biome + types + build
```

## Licences
Code : MIT. Contenus et identité visuelle : tous droits réservés
(voir [LICENSE-CONTENT.md](LICENSE-CONTENT.md)).
