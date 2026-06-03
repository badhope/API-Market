# Changelog

All notable changes to API-Market. Newest first.

## Unreleased

- `GET /api/stats` now reads from a single SQL aggregate + the grade
  histogram (down from 8 separate round-trips).
- `X-Request-Id` middleware: every response carries the id used in
  request logs so 4xx/5xx can be correlated.
- 4xx and 422 errors are wrapped to `{error, detail, ...}` for
  consistent client handling.
- `scripts/{pipeline,validate,validate/,tests,requirements.txt,
  github_pull_request.sh,README.md}` removed — those were the v3/v4
  data pipeline leftovers; v5 uses `pipeline/collector.py` and
  `scripts/{migrate_to_sqlite,validate_data}.py`.
- `data/api_market.db` is tracked (~8.7 MB) so the GitHub Pages build
  can ship a static export.
- Rate limiter is now wired correctly (shared `Limiter` attached to
  `app.state.limiter` + a `RateLimitExceeded` handler).
- XSS hardening: URLs are URL-scheme-allow-listed in
  `scripts/migrate_to_sqlite.py` and the frontend's `safeHref`.

## 5.0.0 — initial release

FastAPI + Next.js 14 rewrite. 14,405 APIs across 44 categories, FTS5
search, Docker stack (FastAPI + Nginx), and a static GitHub Pages
build that ships the full dataset to the browser.
