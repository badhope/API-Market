import { DEFAULT_PER_PAGE } from "./constants"
import type {
  ApiListResponse,
  CategoryDetailResponse,
  CategoryListResponse,
  HealthResponse,
  SearchResponse,
  StatsResponse,
} from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""
const HAS_REMOTE_API = API_BASE_URL.length > 0

class ApiClient {
  private async fetchJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    if (HAS_REMOTE_API) {
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
        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`)
        }
        return res.json()
      } finally {
        clearTimeout(timeout)
      }
    }
    throw new Error("Static export mode: no remote API configured")
  }

  private async fetchStatic<T>(path: string): Promise<T> {
    const res = await fetch(path, { headers: { "Content-Type": "application/json" } })
    if (!res.ok) {
      throw new Error(`Static data error: ${res.status} ${res.statusText}`)
    }
    return res.json()
  }

  async getHealth(): Promise<HealthResponse> {
    if (HAS_REMOTE_API) return this.fetchJson<HealthResponse>("/api/health")
    return { status: "static", version: "5.0.0", uptime: 0 }
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
    const featured = await this.fetchStatic<{ top_apis: ApiListResponse["items"] }>("/data/featured.json")
    return {
      total: featured.top_apis.length,
      page: 1,
      per_page: featured.top_apis.length,
      total_pages: 1,
      items: featured.top_apis,
    }
  }

  async getCategories(params?: {
    sort?: string
    order?: string
  }): Promise<CategoryListResponse> {
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
    return this.fetchStatic<CategoryDetailResponse>(`/data/category/${categoryId}.json`)
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
    return {
      total: 0,
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      total_pages: 0,
      items: [],
      query: params.q,
    }
  }

  isStaticMode(): boolean {
    return !HAS_REMOTE_API
  }
}

export const apiClient = new ApiClient()
