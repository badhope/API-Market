# Deploy the Backend to Render

The static GitHub Pages site ships pre-rendered data (top 50 APIs + category
overviews) and works fully offline. To enable full search, pagination, and
filtering across all 14,000+ APIs, deploy the FastAPI backend to any free
host. This guide uses [Render](https://render.com) (free tier, no credit
card) but the same image works on Fly.io, Railway, or any Docker host.

---

## 1. One-time prep

1. Fork or push the repository to your GitHub account.
2. Sign in to [dashboard.render.com](https://dashboard.render.com) with GitHub.
3. Click **New +** → **Web Service** → connect the repo.

## 2. Service settings

| Field | Value |
|-------|-------|
| **Name** | `api-market-backend` |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | Docker |
| **Dockerfile Path** | `Dockerfile` |
| **Docker Context** | `.` |
| **Instance Type** | Free |
| **Health Check Path** | `/api/health` |

> The repo's [`Dockerfile`](../../Dockerfile) is a multi-stage build that
> produces a slim Python image with the FastAPI app, the SQLite database,
> and the static data pre-baked. No build command is required.

## 3. Environment variables

| Key | Value | Required |
|-----|-------|----------|
| `API_TITLE` | `API-Market` | no |
| `API_VERSION` | `5.0.0` | no |
| `CORS_ORIGINS` | `https://<owner>.github.io` | yes |
| `LOG_LEVEL` | `INFO` | no |
| `PYTHONUNBUFFERED` | `1` | no |

> Replace `<owner>` with your GitHub username (e.g. `badhope`). Multiple
> origins can be comma-separated, e.g.
> `https://badhope.github.io,http://localhost:3000`.

## 4. Persistent disk for the SQLite DB

Render's free tier restarts the service on every deploy and wipes the
filesystem. The FastAPI service in this repo is configured to look for
the database at the path the `DATABASE_URL` env var points to (default
`sqlite+aiosqlite:///./data/api_market.db`). To keep state across
restarts, point `DATABASE_URL` at a path on a Render persistent disk:

1. After the first deploy, go to **Disks** → **Add Disk**.
2. Name: `api-market-data`, Mount Path: `/data`, Size: `1 GB` (free).
3. Set `DATABASE_URL=sqlite+aiosqlite:////data/api_market.db` so the
   DB lives on the disk.
4. Redeploy.

The `data/api_market.db` file that's tracked in the repo can be copied
into the volume once to seed it (`render shell` → `cp ...`). After
that, the daily-update workflow on GitHub writes new data back via PR
and you'll re-deploy to pick it up.

If you skip the disk, the service still starts, but the SQLite
database on the persistent volume (`/data/api_market.db`) is empty
— there's no migration code that re-imports the bundled JSON dump
on boot. Wire up the disk, or copy the `data/api_market.db` that
ships in the repo into the volume once and let the app keep it
warmed in the page cache.

## 5. Verify

```bash
curl https://api-market-backend.onrender.com/api/health
# → {"status":"healthy","version":"5.0.0","uptime":42}

curl https://api-market-backend.onrender.com/api/stats | jq
# → {"total_apis":14405,"total_categories":44,...}
```

## 6. Wire the backend into the static site

In your fork's `.github/workflows/pages.yml`, set the API URL before the
`npm run build` step:

```yaml
env:
  STATIC_EXPORT: "true"
  NEXT_PUBLIC_API_URL: "https://api-market-backend.onrender.com"
```

Commit and push. The Pages workflow will rebuild with the live backend
baked in, and the frontend will prefer the API over the bundled JSON
when the API is reachable. If the API goes down (free tier sleeps after
15 min of inactivity), the site automatically falls back to the JSON
snapshot.

---

## Alternative: Fly.io

```bash
brew install flyctl   # or scoop / apt
fly launch --copy-config --name api-market-backend
fly volumes create api_data --size 1
fly secrets set CORS_ORIGINS=https://<owner>.github.io
fly deploy
fly machines start   # wakes the free instance
```

The included `Dockerfile` works on Fly.io without modification.

## Alternative: Railway

1. New Project → Deploy from GitHub.
2. Add a volume mounted at `/data`.
3. Set `CORS_ORIGINS` and `DATA_DIR=/data`.
4. Railway auto-detects the `Dockerfile`.

---

## Cost

All three options have a free tier that is more than enough for a
public directory of public APIs:

- **Render free**: sleeps after 15 min idle, ~750 hrs/month
- **Fly.io free**: 3 shared VMs, 1 GB persistent volume
- **Railway trial**: $5 credit/month, then pay-as-you-go

For a low-traffic public API directory, Render's free tier is the
simplest.
