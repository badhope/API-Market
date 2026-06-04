# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 5.0.x   | :white_check_mark: |
| < 5.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in API-Market, please report it
privately to the maintainers via GitHub Security Advisories:

**https://github.com/badhope/API-Market/security/advisories/new**

Do **not** open a public issue for security vulnerabilities.

We will acknowledge reports within 72 hours and aim to publish a fix within
30 days for critical issues.

## Privacy & Data Handling

API-Market is an open-source data aggregator. The repository:

- Contains **no API keys, tokens, passwords, or credentials** in tracked files
- Uses `os.environ.get("GITHUB_TOKEN", "")` for optional GitHub API access
  (only required for higher rate limits during data collection)
- Runs a CI workflow `privacy-guard.yml` on every push and PR that:
  - Scans the working tree and git history for known secret patterns
  - Verifies `.env` files are gitignored
  - Rejects large data files (SQLite DB, JSON dumps) from being tracked
- See `.env.example` for a safe configuration template with no secrets

## Security Best Practices for Contributors

1. Never commit a `.env` file with real values - only `.env.example` templates
2. Use environment variables for all credentials, not hardcoded strings
3. Run `git diff --staged` before every commit to review changes
4. The CI `privacy-guard` job will fail the build if secrets are detected

## Attack Surface

The public site at `https://badhope.github.io/API-Market/` is a **pure
static export** of the Next.js app — no Node.js server, no API routes,
no middleware, no image optimizer runs at request time. The data is
pre-rendered to JSON files in `frontend/public/data/` at build time and
served as static assets by GitHub Pages. This dramatically narrows the
attack surface compared to a typical Next.js deployment:

| Next.js feature                          | In use here? | Why it doesn't matter here                                                                 |
|------------------------------------------|--------------|-------------------------------------------------------------------------------------------|
| Middleware / `middleware.ts`             | No           | There is no middleware file; Pages serves the pre-built HTML directly.                    |
| API routes / Route Handlers              | No           | Output is `output: "export"`; `app/api/*` is not generated.                                |
| Server Actions                           | No           | No `"use server"` directives in `frontend/src/`.                                          |
| `next/image` optimization API            | No           | [`next.config.mjs`](frontend/next.config.mjs) sets `images.unoptimized: true`.            |
| Server Components with dynamic IO        | No           | All pages are statically generated; data is read at build time, not request time.         |
| Rewrites / redirects at request time     | No           | Static export ships no server-side rewrite handler.                                       |
| WebSocket upgrades                       | No           | No custom server; GitHub Pages is HTTP/HTTPS only.                                        |

The 13 advisories currently reported by `npm audit` against
`next@14.2.35` (RSC cache poisoning, Server Components DoS, Image
Optimizer DoS, Middleware bypass, etc.) all require a live Next.js
server to exploit. Because the production deployment has none of those
components, the practical risk is limited to the supply-chain attack
surface of `npm install` itself, which is mitigated by:

- Pinning to a reproducible `frontend/package-lock.json`.
- Weekly `dependabot` PRs to surface new CVEs as they're published.
- A scheduled [`security-audit.yml`](.github/workflows/security-audit.yml)
  job that runs `npm audit --omit=dev` and `pip-audit` against the
  lockfile and fails the build on any `critical` finding.

The backend (FastAPI) is **not** exposed publicly. It runs only when
the Docker stack is deployed behind a private reverse proxy and is
designed to be a data-bulk service for self-hosters, not a public API.
Self-hosters should follow the same production hardening guidance as
any other FastAPI app: set `cors_origins` to a specific allowlist
(rather than `*`), run behind HTTPS, and keep `app_env=production`.
