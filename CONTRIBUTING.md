# Contributing

A short guide for humans who want to send a PR.

## Flow

1. **Open an issue first** for non-trivial changes. I don't want you
   to spend a Saturday on something I would have asked you to do
   differently.
2. Fork, branch, edit, push, open the PR.
3. CI runs `npm run build:data` and `npm run build`. A bad record
   fails the build with the line number.
4. Merge after one review (or two, for anything touching schemas or
   the search pipeline).

## Editing data

The catalog lives in `data/categories/<id>/apis.jsonl`. One API per
line. The full schema is in
[`frontend/src/schemas/api.ts`](frontend/src/schemas/api.ts). Common
mistakes:

- URL not starting with `http://` or `https://` → rejected
- `quality_grade` not in `A B C D F` → rejected
- `last_verified` not `YYYY-MM-DD` → rejected
- `tags` not comma-separated → silently empty (not rejected, fix it
  before the PR)

To verify your edit before pushing:

```bash
cd frontend
npm run build:data
# If the output says "read N/N API records across M categories" you're
# good. If it errors, fix the offending line and try again.
```

## Editing the schema

The Zod schema is the contract. If you add a field, also update
`toApiView()` in the same file so consumers see it. If the field is
shown in the UI, add a row in the meta table on `app/api/[id]/page.tsx`.

## Style

- Plain English. No emoji, no AI-flavoured prose.
- One sentence per line where it helps reviewers.
- Don't add dependencies without explaining why.
- Don't refactor surrounding code in a feature PR.

## Commit messages

Subject, blank line, body. No "feat:" or "fix:" prefixes. If the
commit closes an issue, write `Closes #N` in the body.

## License

By contributing, you agree your contribution is licensed under the
same MIT terms as the rest of the project. See [`LICENSE`](./LICENSE).
