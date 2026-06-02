# Contributing to API-Market

Thank you for your interest in API-Market! This document explains how to
contribute to the project.

## Project Overview

API-Market is a curated, quality-scored directory of public APIs. Data is
aggregated from the following upstream sources and refreshed daily:

- [public-apis/public-apis](https://github.com/public-apis/public-apis)
- [APIs-guru/openapi-directory](https://github.com/APIs-guru/openapi-directory)
- [keploy/public-apis-collection](https://github.com/keploy/public-apis-collection)

## How to Contribute

### Reporting a data issue

If an API entry is wrong, missing, or outdated, please **open an issue**
with the API name and a link to the upstream source. The daily-update
workflow will pick up changes from upstream repositories.

### Improving the platform

- **Bug fixes & features**: open a Pull Request against `main`.
- **Frontend**: `frontend/src/` (Next.js 14, TypeScript, Tailwind v4)
- **Backend**: `backend/api_market/` (FastAPI, SQLAlchemy 2.0 async)
- **Pipeline**: `pipeline/collector.py`

Before submitting a PR, please run:

```bash
make format
make lint
make typecheck
make test
```

## Development Setup

```bash
# Install dependencies
make dev

# Initialize the database
make db-init

# Start the backend
make run

# Start the frontend (in another terminal)
cd frontend && npm install && npm run dev
```

## Coding Conventions

- Python: ruff format + ruff lint + mypy strict (see `pyproject.toml`)
- TypeScript: ESLint + Prettier (see `frontend/.eslintrc.json`)
- Commit messages: `type: short description` (e.g. `fix: ...`, `feat: ...`)

## License

By contributing, you agree that your contributions will be licensed under
the MIT License. See [LICENSE](./LICENSE) for details.
