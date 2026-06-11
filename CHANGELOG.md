# Changelog

All notable changes to this project are recorded here. Versions follow
[Semantic Versioning](https://semver.org/).

## [6.0.0] — 2026-06-11

### Removed

- Entire Python backend (`backend/`, ~2000 lines). FastAPI, SQLAlchemy,
  Pydantic, slowapi, Redis caching, the whole thing. None of it
  shipped in the GitHub Pages build, which is the only supported
  deploy target.
- `data/api_market.db` (SQLite + FTS5). Replaced by text files in
  `data/categories/<id>/`.
- `scripts/migrate_to_sqlite.py`, `scripts/cleanup_database.py`,
  `scripts/validate_data.py`, `pipeline/collector.py`.
- Dockerfile, docker-compose, `docs/deploy-render.md`, `Makefile`,
  `pyproject.toml`, `uv.lock`, `.python-version`, `.gitleaks.toml`.
- `daily-update.yml` cron pipeline (was a Python collector).
  Replaced by an on-PR `Validate Data` workflow.

### Added

- `frontend/scripts/build-data.ts` — single-file TypeScript build
  that reads `data/categories/*/apis.jsonl`, validates each record
  with Zod, emits `frontend/public/data/*.json` and a pre-built
  Orama search index. No database. No Python.
- `frontend/src/schemas/{api,category}.ts` — Zod contracts as the
  single source of truth for record shape. Frontend imports the
  inferred types directly.
- `data/categories/<id>/meta.toml` — per-category metadata
  (display name, icon, blurb, sort order).
- `data/categories/<id>/apis.jsonl` — per-category record list, one
  API per line, JSON Lines, Git-diff friendly.
- Client-side search via `@orama/orama` (WASM in-browser, with a
  pre-built `orama.json` index so first ⌘K is a fetch, not a
  rebuild).
- New CI jobs: `Lint & Typecheck`, `Build (data + frontend)`,
  `Security Scan (CodeQL)`. CodeQL scope narrowed to `frontend/src/`
  since there's no Python surface left.

### Changed

- Build pipeline is now **Node only**. Two commands:
  `npm run build:data && next build`. No `uv`, no `pip`, no `docker`.
- `pages.yml` is ~60% smaller: it just runs the Node build, exports
  the static site, and pushes to `gh-pages`.
- `frontend/src/lib/search.ts` rewrote on top of Orama; old
  tokenize/rankApis scoring removed.
- `frontend/src/lib/data-server.ts` simplified to read
  pre-sorted/pre-paginated JSON snapshots directly off disk.
- Data format on the wire: `all.json` / `top.json` are now flat
  arrays (was `{ items, total, page, ... }` for compatibility with
  the old FastAPI paginated response).

## [5.0.1] — 2026-05-XX

- Frontend redesign: new "Editorial Codex" aesthetic — paper,
  serif, hairline rules, vermillion accent.
- Removed dead `frontend/src/components/ui/*` and
  `frontend/src/components/wiki/shared.tsx`.
- README rewritten in English / Chinese / Japanese.

## [5.0.0] — 2026-04-XX

- FastAPI backend, Next.js frontend, daily-update cron.
