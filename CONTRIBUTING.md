# Contributing to API-Market

Thanks for your interest in contributing! This guide will help you get started.

## How to Contribute

### 1. Adding or updating an API

The easiest way to contribute is to add or update API data directly.

**Step 1: Find the right category**

Browse `data/categories/` to find the appropriate category. Each category has:
- `meta.toml` — category metadata
- `apis.jsonl` — API records (one per line)

**Step 2: Edit the JSONL file**

Open `data/categories/<category-id>/apis.jsonl` and add or update a record:

```json
{"id":"example-api","name":"Example API","url":"https://api.example.com","description":"A brief description of what this API does","category_id":"example-category","auth":"none","https":true,"cors":true,"source":"manual","tags":"example,test","quality_score":85,"quality_grade":"B","status":"active","deprecated":false,"last_verified":"2026-01-15"}
```

**Required fields:**
- `id` — unique identifier (kebab-case, lowercase)
- `name` — display name
- `url` — API homepage or documentation URL
- `description` — brief description (aim for 80+ characters)
- `category_id` — must match the directory name
- `auth` — "none", "apiKey", "oauth2", or "xAuth"
- `https` — boolean (true if HTTPS is supported)
- `quality_score` — 0-100
- `quality_grade` — "A", "B", "C", "D", or "F"

**Optional fields:**
- `cors` — boolean or "unknown"
- `source` — source ID (e.g., "public-apis", "manual")
- `source_url` — upstream URL
- `tags` — comma-separated string
- `status` — "active" or "inactive"
- `deprecated` — boolean
- `last_verified` — ISO date string (YYYY-MM-DD)

**Step 3: Validate locally**

```bash
cd frontend
npm run build:data
```

This will validate your changes and rebuild the static JSON files.

**Step 4: Submit a PR**

Commit your changes and open a pull request. The CI will run validation automatically.

### 2. Adding a new category

If you want to add APIs that don't fit existing categories:

**Step 1: Create the category directory**

```bash
mkdir -p data/categories/your-category-id
```

**Step 2: Create meta.toml**

```toml
[meta]
id = "your-category-id"
display_name = "Your Category Name"
icon = "ycn"
blurb = "A brief description of this category."
order = 52
```

**Step 3: Create apis.jsonl**

Add at least one API record (see above).

**Step 4: Validate and submit**

```bash
cd frontend
npm run build:data
```

Then commit and open a PR.

### 3. Improving the frontend

The frontend is a Next.js 16 static site with TypeScript and Tailwind CSS.

**Setup:**

```bash
cd frontend
npm install
npm run dev
```

**Common tasks:**
- Add a new page: Create `src/app/<route>/page.tsx`
- Add a component: Create `src/components/<name>.tsx`
- Update styles: Edit `src/app/globals.css` or component-level CSS

**Testing:**

```bash
npm test              # Run unit tests
npm run typecheck     # Check TypeScript types
npm run lint          # Check code style
npm run build         # Build for production
```

### 4. Improving the data pipeline

The data pipeline lives in `frontend/scripts/`:
- `build-data.ts` — builds static JSON from JSONL
- `import/run.ts` — imports from upstream sources
- `import/saxi-ai.ts` — saxi.ai importer
- `import/publicapis-dev.ts` — publicapis.dev importer
- `import/apilist-fun.ts` — apilist.fun importer

To add a new importer:
1. Create `frontend/scripts/import/<source>.ts`
2. Implement the `import<Source>()` function
3. Add it to `run.ts`
4. Test with `npm run import:<source>`

## Code Style

- **TypeScript** — strict mode, no `any`
- **ESLint** — follow the config in `frontend/eslint.config.mjs`
- **Prettier** — 2 spaces, double quotes, trailing commas
- **Commit messages** — follow [Conventional Commits](https://www.conventionalcommits.org/)

## Review Process

1. Open a PR with a clear description of what you changed and why
2. CI will run validation automatically
3. A maintainer will review your changes
4. Once approved, your PR will be merged

## Questions?

Open an issue or reach out in the discussions.

---

**Quick links:**
- [Data format guide](data/README.md)
- [API schema](frontend/src/schemas/api.ts)
- [Category schema](frontend/src/schemas/category.ts)
