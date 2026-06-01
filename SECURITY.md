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
