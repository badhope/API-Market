## Summary

One or two sentences. Why this change exists. Fixes #issue (if any).

## What changed

- Bullet list of user-visible changes.
- Note any new env vars, dependencies, or migration steps.
- Mention the resulting commit on `main` if the PR is stacked.

## Verification

Local checks I ran (the CI runs the same set — see [ci.yml](.github/workflows/ci.yml)):

```bash
make format       # ruff format
make lint         # ruff + ESLint
make typecheck    # mypy strict
make test         # pytest
```

For frontend-only changes:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build      # catches any Next.js-specific breakage
```

## Deployment / data impact

- [ ] No impact on the deployed site
- [ ] Impact on the deployed site (explain below)
- [ ] Touches `data/api_market.db` — needs `make db-reset` and a re-deploy
- [ ] Touches `frontend/public/data/*` — will re-trigger `pages.yml`

## Privacy checklist

- [ ] No `.env` / secrets / tokens added
- [ ] No new tracked files larger than 1 MB
- [ ] `privacy-guard` workflow expected to pass
