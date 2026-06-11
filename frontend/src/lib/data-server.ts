/**
 * Server-side data accessors for the statically-exported build.
 *
 * Reads the JSON snapshots committed (or generated at build time) to
 * `public/data/`. Every server component in `app/` imports from here
 * so the data path is in one place.
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
  const manifest = await readJson<{ category_files?: string[] }>("manifest.json")
  if (!manifest.category_files?.includes(slug)) return null
  return readJson<CategoryDetailResponse>(`category/${slug}.json`)
}
