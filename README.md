# API-Market

**Languages**: [English](README.md) · [中文](README.zh.md) · [日本語](README.ja.md)

A searchable directory of 14,000+ public HTTP APIs. FastAPI backend, Next.js
14 frontend, SQLite FTS5 for full-text search. Ships as either a single Docker
stack or a fully static site on GitHub Pages (no backend needed for browsing).

## What it is

- Aggregates curated public API listings (public-apis, APIs.guru, etc.) into
  one SQLite database with FTS5 indexing.
- REST API for headless use: list, filter, paginate, full-text search.
- Static JSON dump of the whole catalog is built into `frontend/public/data/`
  at deploy time, so the GitHub Pages build does search and pagination in
  the browser with zero server cost.

## Quick start

Docker (full stack, includes Nginx reverse proxy):

```bash
git clone https://github.com/badhope/API-Market
cd API-Market
cp .env.example .env
docker compose up -d
# http://localhost
```

Local dev (backend only):

```bash
uv sync --extra dev                  # or: pip install -e ".[dev,pipeline]"
make db-init                          # one-time: build data/api_market.db
make run                              # uvicorn on :8080
```

Local dev (frontend):

```bash
cd frontend && pnpm install && pnpm dev
# http://localhost:3000
```

## Deploying to GitHub Pages

`pages.yml` builds the static site on every push to `main` and deploys it to
the `gh-pages` branch. The build needs `data/api_market.db` checked in (it
is) and writes `frontend/public/data/*.json` + `frontend/out/`. Nothing else
is required.

## API

| Method | Path                          | Notes                                        |
|--------|-------------------------------|----------------------------------------------|
| GET    | `/api`                        | List, paginate, sort, filter by grade/CORS   |
| GET    | `/api/search?q=`              | FTS5 search, relevance-ranked                |
| GET    | `/api/categories`             | Categories with api_count and avg quality    |
| GET    | `/api/category/{id}`          | APIs in a single category                    |
| GET    | `/api/stats`                  | Aggregate stats (cached 5 min)               |
| GET    | `/api/health`                 | `{status, version, uptime}`                  |

OpenAPI docs at `/docs` when `DEBUG=true`.

## Data

- 44 categories, ~14k APIs. Quality scored 0-100 (A-F) on a small set of
  signals (description length, https, cors, source). The score is a
  rough heuristic, not a guarantee.
- Daily update pipeline runs at 06:30 UTC via `.github/workflows/daily-update.yml`,
  validates the new dataset, and opens a PR if anything changed.

## Project layout

```
backend/         FastAPI service (api_market package + tests)
frontend/        Next.js 14 app, App Router, Tailwind v4
pipeline/        Async collector (httpx + tenacity)
scripts/         Data migration, validation, build_static_data
docker/          nginx.conf for the compose stack
data/            SQLite database (tracked; ~9.7 MB) + .gitkeep for collected/
```

## Development

```bash
make all              # ruff + mypy + pytest
make db-reset         # rebuild SQLite from a fresh JSON dump
```

Strict mypy on `backend/`, ruff format + lint on `backend/ pipeline/ scripts/`,
13 tests in `backend/tests/` covering the public API surface.

## License

MIT. See [LICENSE](LICENSE).

API data is aggregated from public sources; check each provider's terms
before commercial use.
