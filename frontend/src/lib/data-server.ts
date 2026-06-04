/**
 * Server-side data accessors for the statically-exported build.
 *
 * In the dynamic build (dev / Docker) the frontend talks to the FastAPI
 * backend through `apiClient`. In the static export, no API server runs —
 * the data is committed to `public/data/*.json` and the whole site has
 * to read those files directly off disk. This module is the only place
 * that does that, so all server components import their data from here.
 */
import { promises as fs } from "fs"
import path from "path"

import type {
  ApiListResponse,
  ApiSummary,
  CategoryDetailResponse,
  CategoryListResponse,
  CategorySummary,
  SearchResponse,
  SearchResultItem,
  StatsResponse,
} from "@/types"

const DATA_DIR = path.join(process.cwd(), "public", "data")

async function readJson<T>(filename: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8")
  return JSON.parse(raw) as T
}

export async function loadStats(): Promise<StatsResponse> {
  return readJson<StatsResponse>("stats.json")
}

export async function loadCategories(): Promise<CategoryListResponse> {
  return readJson<CategoryListResponse>("categories.json")
}

export interface FeaturedResponse {
  top_categories: CategorySummary[]
  top_apis: ApiSummary[]
}

export async function loadFeatured(): Promise<FeaturedResponse> {
  return readJson<FeaturedResponse>("featured.json")
}

export async function loadAllApisPage(params: {
  page: number
  perPage: number
  sort: "name" | "quality" | "updated"
  order: "asc" | "desc"
}): Promise<ApiListResponse> {
  // The full catalog is too big to ship on every page; the static export
  // builder chunks it by category, so we have to fan out across files.
  const all = await readJson<{
    items: ApiSummary[]
    total: number
  }>("all.json")
  const { items, total } = all
  const sorted = [...items].sort((a, b) => {
    const sign = params.order === "asc" ? 1 : -1
    if (params.sort === "name") return sign * a.name.localeCompare(b.name)
    if (params.sort === "quality") {
      return sign * ((a.quality_score ?? 0) - (b.quality_score ?? 0))
    }
    return sign * (Date.parse(a.updated_at ?? "") - Date.parse(b.updated_at ?? ""))
  })
  const start = (params.page - 1) * params.perPage
  return {
    items: sorted.slice(start, start + params.perPage),
    total,
    page: params.page,
    per_page: params.perPage,
    total_pages: Math.max(1, Math.ceil(total / params.perPage)),
  }
}

export async function loadCategoryDetail(
  slug: string,
  params: { page: number; perPage: number; sort: string; order: string },
): Promise<CategoryDetailResponse | null> {
  // Check the manifest first so we can 404 cleanly on unknown categories
  // without reading a file that doesn't exist.
  const manifest = await readJson<{ category_files?: string[] }>("manifest.json")
  if (!manifest.category_files?.includes(slug)) return null
  const cat = await readJson<{
    category: CategorySummary
    items: ApiSummary[]
    total: number
  }>(`category/${slug}.json`)
  const sorted = [...cat.items].sort((a, b) => {
    const sign = params.order === "asc" ? 1 : -1
    if (params.sort === "name") return sign * a.name.localeCompare(b.name)
    if (params.sort === "updated") {
      return sign * (Date.parse(a.updated_at ?? "") - Date.parse(b.updated_at ?? ""))
    }
    return sign * ((a.quality_score ?? 0) - (b.quality_score ?? 0))
  })
  const start = (params.page - 1) * params.perPage
  return {
    category: cat.category,
    total: cat.total,
    page: params.page,
    per_page: params.perPage,
    total_pages: Math.max(1, Math.ceil(cat.total / params.perPage)),
    items: sorted.slice(start, start + params.perPage),
  }
}

export async function searchApis(params: {
  q: string
  grade?: string
  page: number
  perPage: number
  sort: string
  order: string
}): Promise<SearchResponse> {
  const all = await readJson<{ items: ApiSummary[] }>("all.json")
  const needle = params.q.toLowerCase()
  let pool = all.items
  if (needle) {
    pool = pool.filter(
      (a) =>
        a.name.toLowerCase().includes(needle) ||
        a.description?.toLowerCase().includes(needle) ||
        a.id.toLowerCase().includes(needle),
    )
  }
  if (params.grade) {
    pool = pool.filter((a) => a.quality_grade === params.grade)
  }
  const sign = params.order === "asc" ? 1 : -1
  if (params.sort === "quality") {
    pool = [...pool].sort(
      (a, b) => sign * ((a.quality_score ?? 0) - (b.quality_score ?? 0)),
    )
  } else if (params.sort === "updated") {
    pool = [...pool].sort(
      (a, b) =>
        sign * (Date.parse(a.updated_at ?? "") - Date.parse(b.updated_at ?? "")),
    )
  } else {
    pool = [...pool].sort((a, b) => sign * a.name.localeCompare(b.name))
  }
  const start = (params.page - 1) * params.perPage
  // The static export doesn't compute server-side relevance; we set
  // relevance_score to 1 for every hit so the SearchResultItem type is
  // satisfied. The frontend never reads this value when rendering the
  // result table, so a constant is fine here.
  const items: SearchResultItem[] = pool
    .slice(start, start + params.perPage)
    .map((api) => ({ ...api, relevance_score: 1 }))
  return {
    items,
    total: pool.length,
    page: params.page,
    per_page: params.perPage,
    total_pages: Math.max(1, Math.ceil(pool.length / params.perPage)),
    query: params.q,
  }
}
