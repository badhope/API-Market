# Changelog

All notable changes to API-Market. Newest first.

## 5.0.0 — 2026-06-04

Initial public release.

**Highlights**
- 14,405 public APIs across 44 categories, quality-scored A–F.
- FTS5-powered search with safe-query escaping and per-IP rate limits.
- FastAPI backend with strict CORS, security headers, request-id
  correlation, and a `{error, detail}`-shaped error contract.
- Next.js 14 frontend that builds to a **pure static export** — the
  public site at <https://badhope.github.io/API-Market/> serves the
  full dataset to the browser with no runtime server.
- Docker Compose stack (FastAPI + Nginx) for self-hosters.
- Daily upstream-data refresh (06:30 UTC) that opens a PR if the
  dataset changes.
- Tri-lingual documentation: English (default), 中文, 日本語, with
  in-README language switcher.

**Security & privacy**
- `privacy-guard` workflow scans every push and PR for leaked tokens,
  .env files, and oversized data blobs.
- `security-audit` workflow runs `npm audit` + `pip-audit` weekly and
  fails on `critical` findings.
- CodeQL scans both Python and JavaScript / TypeScript under
  `security-extended` rules.
- Dependabot opens weekly PRs for npm, pip, and GitHub Actions.
- `data/api_market.db` (~9.3 MB) is the only large tracked file; all
  other large artefacts stay gitignored.

**Housekeeping**
- Standard MIT License + `NOTICE` file for upstream attribution.
- `CHANGELOG`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY` in place.
- Issue templates for bug reports, feature requests, and data issues.
- PR template aligned with the project's `make all` checks.
