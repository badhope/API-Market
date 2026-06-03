# Frontend

Next.js 14 (App Router) client for API-Market. Renders either as a standalone
SSR app talking to the FastAPI backend, or as a static export served from
GitHub Pages (no backend required — see `pages.yml`).

## Setup

```bash
pnpm install
cp .env.example .env.local        # adjust NEXT_PUBLIC_API_URL if needed
pnpm dev                          # http://localhost:3000
```

## Layout

```
src/
  app/            App Router pages: home, search, categories, stats
  components/     api/, category/, home/, layout/, ui/
  i18n/           EN / ZH translation strings
  lib/            API client, constants, small utilities
  types/          shared interfaces
```

The home page and search page can run from either the live API or the
pre-baked JSON files in `public/data/`. The static export sets
`NEXT_PUBLIC_STATIC_EXPORT=1` (see `next.config.mjs`) and `pages.yml` writes
those JSON files from `data/api_market.db` at build time.

## Build

```bash
pnpm build           # SSR build → .next/
STATIC_EXPORT=1 pnpm build   # static export → out/   (used by Pages)
```

`pnpm lint` and `pnpm exec tsc --noEmit` are the only checks; CI runs them.
