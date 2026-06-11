# API-Market

[![Deploy Pages](https://github.com/badhope/API-Market/actions/workflows/pages.yml/badge.svg)](https://github.com/badhope/API-Market/actions/workflows/pages.yml)
[![Validate](https://github.com/badhope/API-Market/actions/workflows/daily-update.yml/badge.svg)](https://github.com/badhope/API-Market/actions/workflows/daily-update.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Languages**: [English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md)

A curated directory of public APIs, presented as a fast static site. No
backend, no cookies, no tracking, no build server. The whole thing is
text files in git and a static export on GitHub Pages.

## What is it

A searchable index of public APIs — what it does, how to call it, what
the auth model is, and whether it's worth your time. A–F grade on a
handful of quality signals (HTTPS, CORS, description, source). Built
from plain JSON Lines and a small TypeScript build script.

**Live**: <https://badhope.github.io/API-Market/>

## Layout

```
data/
  sources.json              upstream registry (display name, license)
  categories/<id>/
    meta.toml               display_name, blurb, icon
    apis.jsonl              one API per line, Zod-validated at build

frontend/
  src/
    app/                    Next.js 16 App Router
    components/codex/       the design system ("Editorial Codex")
    schemas/                Zod contracts (the source of truth)
    lib/                    data, search, formatters
    scripts/build-data.ts   data → static JSONs + Orama index
  public/data/              build output (committed for local dev)

.github/workflows/
  pages.yml                 build + deploy on push to main
  daily-update.yml          validate on PRs that touch data/
```

That's it. No `backend/`, no `docker/`, no `scripts/`. The 14,000-API
catalog the project used to maintain has been retired in favour of a
curated, contributor-driven model — see "Adding APIs" below.

## Run it locally

```bash
cd frontend
npm install --legacy-peer-deps
npm run build:data    # generate public/data/*.json from data/
npm run dev           # http://localhost:3000
```

One command per step. The build script is also wired in as a
`prebuild` hook, so `npm run build` regenerates data automatically.

## How the data gets from git to the page

```
  data/categories/<id>/apis.jsonl
            │
            │  Zod validates every line
            ▼
  frontend/scripts/build-data.ts
            │
            ├─► stats.json / categories.json / featured.json
            ├─► top.json / all.json / category/<id>.json
            └─► orama.json (pre-built Orama search index)
            │
            │  next build picks up public/data/*
            ▼
  frontend/out/    (the static export)
            │
            ▼
  gh-pages branch
```

Search runs **in the browser** against the pre-built Orama index. No
server, no FTS5, no SQL — the WASM-backed Orama engine does full-text
search with typo tolerance, faceting, and language-specific stemmers
(client-side, on demand).

## Adding APIs

The cleanest contribution: edit a `data/categories/<id>/apis.jsonl`
file, add a line, open a PR. Example entry:

```jsonl
{"id":"open-meteo","name":"Open-Meteo","url":"https://api.open-meteo.com/v1/forecast","description":"Free weather forecast API for any location. No API key required.","auth":"none","https":true,"cors":true,"source":"open-meteo","tags":"forecast,free,no-key,global","quality_score":95,"quality_grade":"A","last_verified":"2026-06-01"}
```

Field reference lives in [`frontend/src/schemas/api.ts`](frontend/src/schemas/api.ts).
The build will reject the PR with a precise error if anything is off
(wrong URL scheme, unknown grade, malformed tags, etc.).

### Adding a new category

1. `mkdir -p data/categories/<kebab-id>`
2. Create `data/categories/<id>/meta.toml`:
   ```toml
   [meta]
   id = "music"
   display_name = "Music"
   icon = "mus"
   blurb = "Streaming, metadata, lyrics, and audio analysis."
   order = 5
   ```
3. Create `data/categories/<id>/apis.jsonl` with at least one record.
4. Open a PR. CI runs the build and the static site gets a new chapter
   automatically.

## Quality scoring

Heuristic, fast, transparent. The score is a number 0–100 and a
letter grade A–F. Editors can set `quality_grade` directly; otherwise
it's derived from `quality_score` at build time. Don't overthink it —
this is a hint, not a contract.

The build script enforces a few invariants and derives the rest:

- `tags` is a comma-separated string in source, split into `string[]`
  in output (matches what the UI expects)
- `category_id` is implied by the directory name; redundant in the
  file but kept in the schema for safety
- `source_url` falls back to the source registry when not given
- `created_at` / `updated_at` are stamped at build time

## Stack

- **Next.js 16** (App Router, Turbopack, static export)
- **TypeScript 5** strict
- **Tailwind v4** (new `@theme` directive, hand-rolled design tokens)
- **Zod 3** for runtime + compile-time data contracts
- **Orama 3** (WASM in-browser search)
- **smol-toml** for category metadata
- **tsx** to run the TS build script without a separate compile step

Zero Python. Zero Docker. Zero runtime services.

## License

MIT. See [LICENSE](LICENSE).

API data is aggregated from public sources; check each provider's
terms before commercial use.
