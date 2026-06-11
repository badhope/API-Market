# Frontend

Next.js 16 (App Router) static site for API-Market. Reads the JSON
snapshots committed under `public/data/`. No backend at any point in
the build or run cycle.

## Setup

```bash
npm install --legacy-peer-deps
npm run build:data    # regenerate public/data/* from data/categories/*
npm run dev           # http://localhost:3000
```

The `build:data` step is also wired as a `prebuild` hook, so
`npm run build` regenerates data automatically.

## Layout

```
src/
  app/                 App Router pages: home, search, categories, stats, api/[id]
  components/
    codex/             the design system ("Editorial Codex")
    layout/            header, footer, providers
  schemas/             Zod contracts (api, category)
  lib/                 data-server, search (Orama), format, code-gen, links
  types/               backward-compatible re-exports of the schema types
  scripts/             (one level up) build-data.ts

public/data/           generated at build time; committed for local dev
```

## Build

```bash
npm run build               # = build:data + next build → .next/
STATIC_EXPORT=true npm run build   # static export → out/  (used by Pages)
```

The Pages workflow sets `STATIC_EXPORT=true` automatically. The
`out/` directory is the deployed artifact; it's pushed to the
`gh-pages` branch by `actions-gh-pages`.

## Checks

```bash
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
```

CI runs both. See the [main README](../README.md) for the full project
overview and the data-contribution guide.
