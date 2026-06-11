/**
 * Backward-compatible type re-exports. The authoritative type lives in
 * `src/schemas/api.ts` (Zod-derived) and `src/schemas/category.ts`;
 * this file just keeps the old `@/types` paths working so individual
 * pages and components don't have to chase imports.
 */
import type { ApiView } from "@/schemas"

export type ApiSummary = ApiView
export type SearchResultItem = ApiView & { relevance_score: number }

export interface CategorySummary {
  id: string
  name: string
  display_name: string
  icon: string | null
  blurb?: string
  order?: number
  api_count: number
  avg_quality: number
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  per_page: number
  total_pages: number
  items: T[]
}

export type ApiListResponse = PaginatedResponse<ApiSummary>

export interface SearchResponse extends PaginatedResponse<SearchResultItem> {
  query: string | null
}

export interface CategoryListResponse {
  total: number
  items: CategorySummary[]
}

export interface CategoryDetailResponse {
  category: CategorySummary
  total: number
  page: number
  per_page: number
  total_pages: number
  items: ApiSummary[]
}

export interface StatsResponse {
  total_apis: number
  total_categories: number
  sources: string[]
  grade_distribution: Record<string, number>
  metadata_coverage: {
    auth: number
    https: number
    cors: number
    description: number
  }
  last_updated: string | null
}

export interface HealthResponse {
  status: string
  version: string
  uptime: number
}

export interface ApiFilters {
  search?: string
  category?: string
  grade?: string
  sort?: string
  order?: string
  cors?: boolean
  free?: boolean
  page?: number
  per_page?: number
}
