import { DEFAULT_PER_PAGE } from "./constants"
import type {
  ApiListResponse,
  ApiSummary,
  CategoryDetailResponse,
  CategoryListResponse,
  HealthResponse,
  SearchResponse,
  SearchResultItem,
  StatsResponse,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
const HAS_REMOTE_API = API_BASE_URL.length > 0

// GitHub Pages project pages are served under `<owner>.github.io/<repo>`,
// so the deployed app's effective root is `/<repo>` rather than `/`.
// The Next.js config puts that into `basePath` for `<Link>` / asset
// rewriting, but **raw `fetch()` calls do not get the prefix** — they
// resolve against the document origin and 404. Mirror the config so
// every static-data fetch below hits the right path.
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "/API-Market").replace(/\/+$/, "")

// ---------------------------------------------------------------------------
// Static (GitHub-Pages-only) helpers
// ---------------------------------------------------------------------------
// In static mode the frontend has no backend, so it loads the full 14,405-API
// snapshot (all.json, ~6.5 MB / ~1.5 MB gzipped) exactly once and then does
// all paging, sorting, filtering, and full-text search in the browser.

let allApisCache: ApiSummary[] | null = null
let allApisInflight: Promise<ApiSummary[]> | null = null

async function loadAllApis(): Promise<ApiSummary[]> {
  if (allApisCache) return allApisCache
  if (allApisInflight) return allApisInflight
  // IMPORTANT: must use the same BASE_PATH prefix as `fetchStatic` below,
  // otherwise on GitHub Pages the URL resolves to `/data/all.json` (404)
  // instead of `/<repo>/data/all.json`.
  const url = `${BASE_PATH}/data/all.json`
  allApisInflight = fetch(url, { headers: { "Content-Type": "application/json" } })
    .then((res) => {
      if (!res.ok) throw new Error(`Static data error: ${res.status} ${res.statusText}`)
      return res.json() as Promise<ApiSummary[]>
    })
    .then((data) => {
      allApisCache = data
      return data
    })
    .finally(() => {
      allApisInflight = null
    })
  return allApisInflight
}

function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a).localeCompare(String(b))
}

function sortInPlace<T>(items: T[], sort: string, order: "asc" | "desc"): void {
  const dir = order === "asc" ? 1 : -1
  items.sort((a, b) => {
    const av = (a as Record<string, unknown>)[sort]
    const bv = (b as Record<string, unknown>)[sort]
    return dir * compareValues(av, bv)
  })
}

function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length
  // Match the backend's `total_pages` formula exactly (returns 0 on an
  // empty result set). The previous `Math.max(1, ...)` produced a page
  // count of 1 for empty data, which made the frontend pager render
  // "Page 1 of 1" with no items — confusing and inconsistent with the
  // live API.
  const total_pages = total > 0 ? Math.ceil(total / perPage) : 0
  const safePage = total_pages === 0 ? 1 : Math.min(Math.max(1, page), total_pages)
  const start = (safePage - 1) * perPage
  return {
    total,
    page: safePage,
    per_page: perPage,
    total_pages,
    items: items.slice(start, start + perPage),
  }
}

// Cheap tokenised full-text search over name + description + tags.
// Returns a relevance score between 0 and 1.
function scoreApi(api: ApiSummary, tokens: string[]): number {
  if (!tokens.length) return 1
  const name = (api.name || "").toLowerCase()
  const desc = (api.description || "").toLowerCase()
  const tags = (api.tags || []).join(" ").toLowerCase()
  const cat = (api.category_id || "").toLowerCase()
  let matched = 0
  let totalWeight = 0
  for (const t of tokens) {
    totalWeight += 1
    if (!t) continue
    if (name.includes(t)) matched += 1
    else if (tags.includes(t)) matched += 0.7
    else if (cat.includes(t)) matched += 0.5
    else if (desc.includes(t)) matched += 0.4
  }
  return totalWeight ? matched / totalWeight : 0
}

function tokenize(q: string): string[] {
  return q.toLowerCase().split(/\s+/).map((t) => t.trim()).filter(Boolean)
}

class ApiClient {
  private async fetchJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    if (!HAS_REMOTE_API) throw new Error("Static export mode: no remote API configured")
    const url = new URL(path, API_BASE_URL)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value))
        }
      })
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch(url.toString(), {
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
      return res.json()
    } finally {
      clearTimeout(timeout)
    }
  }

  private async fetchStatic<T>(path: string): Promise<T> {
    // `path` is expected to start with `/data/...`. Prepend `BASE_PATH`
    // so it resolves to `/<repo>/data/...` on GitHub Pages project sites.
    const url = path.startsWith(BASE_PATH) || path.startsWith("http") ? path : `${BASE_PATH}${path}`
    const res = await fetch(url, { headers: { "Content-Type": "application/json" } })
    if (!res.ok) throw new Error(`Static data error: ${res.status} ${res.statusText}`)
    return res.json()
  }

  async getHealth(): Promise<HealthResponse> {
    if (HAS_REMOTE_API) return this.fetchJson<HealthResponse>("/api/health")
    // Static-mode version comes from the build manifest so we don't have
    // to keep `version` in lockstep between scripts/build_static_data.py
    // and the frontend.
    try {
      const manifest = await this.fetchStatic<{ version: string; built_at: string }>(
        "/data/manifest.json"
      )
      return { status: "static", version: manifest.version, uptime: 0 }
    } catch {
      return { status: "static", version: "unknown", uptime: 0 }
    }
  }

  async getStats(): Promise<StatsResponse> {
    if (HAS_REMOTE_API) return this.fetchJson<StatsResponse>("/api/stats")
    return this.fetchStatic<StatsResponse>("/data/stats.json")
  }

  async getApis(params?: {
    page?: number
    per_page?: number
    sort?: string
    order?: string
    grade?: string
    category?: string
    cors?: boolean
    free?: boolean
  }): Promise<ApiListResponse> {
    if (HAS_REMOTE_API) {
      return this.fetchJson<ApiListResponse>("/api", {
        page: params?.page ?? 1,
        per_page: params?.per_page ?? DEFAULT_PER_PAGE,
        ...params,
      })
    }
    const all = await loadAllApis()
    let filtered = all.filter((a) => !a.deprecated)
    if (params?.category) filtered = filtered.filter((a) => a.category_id === params.category)
    if (params?.grade) filtered = filtered.filter((a) => a.quality_grade === params.grade)
    if (params?.cors) filtered = filtered.filter((a) => a.cors === true)
    if (params?.free) filtered = filtered.filter((a) => a.auth === null || a.auth === "")
    sortInPlace(filtered, params?.sort ?? "quality_score", (params?.order as "asc" | "desc") ?? "desc")
    return paginate(filtered, params?.page ?? 1, params?.per_page ?? DEFAULT_PER_PAGE)
  }

  async getCategories(params?: { sort?: string; order?: string }): Promise<CategoryListResponse> {
    if (HAS_REMOTE_API) return this.fetchJson<CategoryListResponse>("/api/categories", params)
    return this.fetchStatic<CategoryListResponse>("/data/categories.json")
  }

  async getCategoryApis(
    categoryId: string,
    params?: {
      page?: number
      per_page?: number
      sort?: string
      order?: string
    }
  ): Promise<CategoryDetailResponse> {
    if (HAS_REMOTE_API) {
      return this.fetchJson<CategoryDetailResponse>(`/api/category/${categoryId}`, {
        page: params?.page ?? 1,
        per_page: params?.per_page ?? DEFAULT_PER_PAGE,
        sort: params?.sort,
        order: params?.order,
      })
    }
    const all = await loadAllApis()
    const items = all.filter((a) => a.category_id === categoryId && !a.deprecated)
    sortInPlace(items, params?.sort ?? "quality_score", (params?.order as "asc" | "desc") ?? "desc")
    const page = paginate(items, params?.page ?? 1, params?.per_page ?? DEFAULT_PER_PAGE)
    // Try to load the per-category preview to get authoritative avg_quality +
    // display_name; fall back to deriving it client-side.
    let category
    try {
      const preview = await this.fetchStatic<{ category: CategoryDetailResponse["category"] }>(
        `/data/category/${categoryId}.json`
      )
      category = preview.category
    } catch {
      category = {
        id: categoryId,
        name: categoryId,
        display_name: categoryId,
        icon: null,
        api_count: items.length,
        avg_quality:
          items.length > 0
            ? Number((items.reduce((s, a) => s + (a.quality_score || 0), 0) / items.length).toFixed(1))
            : 0,
      }
    }
    return {
      category: { ...category, api_count: items.length },
      total: page.total,
      page: page.page,
      per_page: page.per_page,
      total_pages: page.total_pages,
      items: page.items,
    }
  }

  async search(params: {
    q: string
    page?: number
    per_page?: number
    category?: string
    sort?: string
    order?: string
  }): Promise<SearchResponse> {
    if (HAS_REMOTE_API) {
      return this.fetchJson<SearchResponse>("/api/search", {
        page: params.page ?? 1,
        per_page: params.per_page ?? DEFAULT_PER_PAGE,
        ...params,
      })
    }
    const all = await loadAllApis()
    const tokens = tokenize(params.q)
    let pool = all
    if (params.category) pool = pool.filter((a) => a.category_id === params.category)
    let scored: SearchResultItem[]
    if (!tokens.length) {
      scored = pool.filter((a) => !a.deprecated).map((api) => ({ ...api, relevance_score: 1 }))
    } else {
      scored = pool
        .map((api) => ({ api, score: scoreApi(api, tokens) }))
        .filter((x) => x.score > 0 && !x.api.deprecated)
        .map(({ api, score }) => ({ ...api, relevance_score: Number(score.toFixed(3)) }))
    }
    // Sort: relevance by default when searching, otherwise use user-chosen sort.
    const sort = params.sort ?? (tokens.length ? "relevance_score" : "quality_score")
    sortInPlace(scored, sort, (params.order as "asc" | "desc") ?? (tokens.length ? "desc" : "desc"))
    const paged = paginate(scored, params.page ?? 1, params.per_page ?? DEFAULT_PER_PAGE)
    return { ...paged, query: params.q }
  }

  isStaticMode(): boolean {
    return !HAS_REMOTE_API
  }
}

export const apiClient = new ApiClient()
