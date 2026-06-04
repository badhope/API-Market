export interface ApiSummary {
  id: string
  name: string
  url: string
  description: string | null
  category_id: string
  auth: string | null
  https: boolean | null
  cors: boolean | null
  source: string | null
  source_url: string | null
  quality_score: number
  quality_grade: string | null
  tags: string[]
  status: string
  deprecated: boolean
  last_verified: string | null
  created_at: string | null
  updated_at: string | null
}

export interface SearchResultItem extends ApiSummary {
  relevance_score: number
}

export interface CategorySummary {
  id: string
  name: string
  display_name: string
  icon: string | null
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