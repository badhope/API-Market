# API-Market Frontend

Next.js 14 App Router frontend for [API-Market](https://github.com/badhope/API-Market).

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **State**: TanStack Query v5
- **Theme**: next-themes (dark mode)
- **i18n**: Custom Context-based (English / Chinese)

## Getting Started

### Prerequisites

- Node.js 18+
- A running backend API (default: `http://localhost:8080`)

### Installation

```bash
npm install
```

### Configuration

Copy the environment template and adjust as needed:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | Backend API base URL |

### Development

```bash
npm run dev
# Opens http://localhost:3000
```

### Build

```bash
npm run build
npm start
```

### Lint & Type Check

```bash
npm run lint
npm run typecheck
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── categories/       # Category listing & detail
│   ├── search/            # Full-text search page
│   ├── stats/             # Statistics page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/
│   ├── api/               # API card components
│   ├── category/          # Category card components
│   ├── home/              # Home page sections (Hero, Stats, etc.)
│   ├── layout/            # Header, Footer, Theme provider
│   └── ui/                # shadcn/ui components
├── i18n/                  # EN/ZH translations
│   ├── context.tsx        # I18n provider & hooks
│   └── translations.ts     # Translation strings
├── lib/
│   ├── api-client.ts      # Typed API client (fetch wrapper)
│   ├── constants.ts       # Sort options, category icons, source links
│   └── utils.ts           # cn(), formatCount(), getGradeColor(), etc.
└── types/
    └── index.ts           # Shared TypeScript interfaces
```

## Features

- **Home Page**: Hero section with live API count, featured categories, top-rated APIs
- **Search**: Full-text search with filters (grade, category, CORS, HTTPS) and sort (name, quality, updated)
- **Categories**: Grid view with search filter, category detail pages
- **Statistics**: Metadata coverage, grade distribution, data sources
- **Dark Mode**: System preference detection + manual toggle
- **i18n**: Real-time English / Chinese switching (persisted in localStorage)
- **SEO**: sitemap.xml, robots.txt, Open Graph metadata
- **Error Handling**: Global error boundary + per-route loading states

## API Integration

The frontend communicates with the backend via `/api` proxy (configured in `next.config.mjs`). During development, requests to `/api/*` are forwarded to `NEXT_PUBLIC_API_URL`. In production, deploy behind the same Nginx reverse proxy as the backend.

## Data Sources

API data is collected from:
- [APIs.guru](https://apis.guru) — OpenAPI specifications
- [public-apis](https://github.com/public-apis/public-apis) — Community curated
- [marcelscruz/public-apis](https://github.com/marcelscruz/public-apis)
- [n0shake/Public-APIs](https://github.com/n0shake/Public-APIs)
- [public-api-lists](https://github.com/public-api-lists/public-api-lists)
- [keploy/public-apis-collection](https://github.com/keploy/public-apis-collection)

See the [main project README](https://github.com/badhope/API-Market#readme) for details.
