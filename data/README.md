# Data Directory

This directory contains all API data in a structured, version-controlled format.

## Structure

```
data/
├── sources.json              # Upstream source registry
├── .import-ignore            # Categories to exclude from auto-import
└── categories/               # One directory per category
    ├── animals/
    │   ├── meta.toml         # Category metadata
    │   └── apis.jsonl        # API records (one per line)
    ├── weather/
    │   ├── meta.toml
    │   └── apis.jsonl
    └── ...
```

## File Formats

### `sources.json`

Registry of upstream data sources:

```json
{
  "sources": [
    {
      "id": "public-apis",
      "name": "public-apis/public-apis",
      "url": "https://github.com/public-apis/public-apis",
      "license": "MIT",
      "tier": "B"
    }
  ]
}
```

### `categories/<id>/meta.toml`

Category metadata:

```toml
[meta]
id = "animals"
display_name = "Animals"
icon = "ani"
blurb = "Pet databases, wildlife tracking, and animal facts."
order = 1
```

### `categories/<id>/apis.jsonl`

One API per line, JSON format:

```json
{"id":"dogs","name":"Dogs","url":"https://dog.ceo/dog-api/","description":"Based on the Stanford Dogs Dataset","category_id":"animals","auth":"none","https":true,"cors":true,"source":"public-apis","source_url":"https://github.com/public-apis/public-apis","tags":"","quality_score":97,"quality_grade":"A","status":"active","deprecated":false,"last_verified":"2026-06-11"}
```

**Required fields:**
- `id` — unique identifier (kebab-case)
- `name` — display name
- `url` — API homepage or documentation URL
- `description` — brief description
- `category_id` — must match directory name
- `auth` — "none", "apiKey", "oauth2", or "xAuth"
- `https` — boolean
- `quality_score` — 0-100
- `quality_grade` — "A", "B", "C", "D", or "F"

**Optional fields:**
- `cors` — boolean or "unknown"
- `source` — source ID from `sources.json`
- `source_url` — upstream URL
- `tags` — comma-separated string
- `status` — "active" or "inactive"
- `deprecated` — boolean
- `last_verified` — ISO date string

## Adding APIs

### Manual addition

1. Edit `data/categories/<id>/apis.jsonl`
2. Add a new line with the API record
3. Run `cd frontend && npm run build:data` to validate
4. Commit and open a PR

### Auto-import from upstream

```bash
cd frontend
npm run import:public-apis        # Import from public-apis
npm run import:all                # Import from all sources
```

The importer validates every record with Zod, derives quality scores, and auto-creates `meta.toml` for new categories.

## Excluding categories from import

Add category IDs to `data/.import-ignore` (one per line):

```
# Don't import these categories from upstream
adult
controversial
```

## Data flow

```
data/categories/<id>/apis.jsonl
         ↓
   Zod validation
         ↓
frontend/scripts/build-data.ts
         ↓
frontend/public/data/*.json
         ↓
   Next.js static export
         ↓
   GitHub Pages
```

## Quality scoring

Quality score (0-100) is derived from:
- HTTPS support: +20
- No authentication required: +15
- CORS enabled: +10
- Description length ≥80 chars: +5
- Description length ≥30 chars: +2

Grade mapping:
- A: 90-100
- B: 75-89
- C: 60-74
- D: 40-59
- F: 0-39

Editors can override by setting `quality_grade` directly in the JSONL record.

## Statistics

Current data:
- **1,548 APIs** across **51 categories**
- Grade distribution: A (321), B (983), C (156), D (84), F (4)
- Sources: public-apis (primary)

## License

API data is aggregated from public sources. Check each provider's terms before commercial use.
