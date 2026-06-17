/**
 * Server-side data accessors for the statically-exported build.
 *
 * Reads the JSON snapshots committed (or generated at build time) to
 * `public/data/`. Every server component in `app/` imports from here
 * so the data path is in one place.
 *
 * Results are memoised at the module level: during a static export,
 * `generateStaticParams` + `generateMetadata` + the page body for a
 * single route can all ask for the same file (e.g. `all.json`, ~770KB)
 * and previously each call re-read + re-parsed it. The cache turns
 * those into a single read per file per build.
 */
import { promises as fs } from "fs"
import path from "path"

import type {
  CategoryDetailResponse,
  CategoryListResponse,
  CategorySummary,
  StatsResponse,
} from "@/types"
import type { ApiView } from "@/schemas"

const DATA_DIR = path.join(process.cwd(), "public", "data")

const _cache = new Map<string, Promise<unknown>>()

async function readJson<T>(filename: string): Promise<T> {
  const cached = _cache.get(filename)
  if (cached) return cached as Promise<T>
  const p = fs
    .readFile(path.join(DATA_DIR, filename), "utf-8")
    .then((raw) => JSON.parse(raw) as T)
  _cache.set(filename, p)
  return p
}

export async function loadStats(): Promise<StatsResponse> {
  return readJson<StatsResponse>("stats.json")
}

export async function loadCategories(): Promise<CategoryListResponse> {
  return readJson<CategoryListResponse>("categories.json")
}

export interface FeaturedResponse {
  top_categories: CategorySummary[]
  top_apis: ApiView[]
}

export async function loadFeatured(): Promise<FeaturedResponse> {
  return readJson<FeaturedResponse>("featured.json")
}

export async function loadAllApis(): Promise<ApiView[]> {
  return readJson<ApiView[]>("all.json")
}

export async function loadCategoryDetail(
  slug: string,
): Promise<CategoryDetailResponse | null> {
  // Per-slug cache key so a miss for one category doesn't shadow another.
  const key = `category/${slug}.json`
  const cached = _cache.get(key)
  if (cached) return cached as Promise<CategoryDetailResponse | null>

  const manifest = await readJson<{ category_files?: string[] }>("manifest.json")
  if (!manifest.category_files?.includes(slug)) {
    const miss = Promise.resolve(null)
    _cache.set(key, miss)
    return miss
  }
  const p = readJson<CategoryDetailResponse>(key)
  _cache.set(key, p)
  return p
}
