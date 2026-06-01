import { DEFAULT_PER_PAGE } from "./constants"
import type {
  ApiListResponse,
  CategoryDetailResponse,
  CategoryListResponse,
  HealthResponse,
  SearchResponse,
  StatsResponse,
} from "@/types"

class ApiClient {
  private getBaseUrl(): string {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    return ""
  }

  private async fetchJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const baseUrl = this.getBaseUrl()
    const url = baseUrl ? new URL(path, baseUrl) : new URL(path, "http://localhost")
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

  async getHealth(): Promise<HealthResponse> {
    return this.fetchJson<HealthResponse>("/api/health")
  }

  async getStats(): Promise<StatsResponse> {
    return this.fetchJson<StatsResponse>("/api/stats")
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
    return this.fetchJson<ApiListResponse>("/api", {
      page: params?.page ?? 1,
      per_page: params?.per_page ?? DEFAULT_PER_PAGE,
      ...params,
    })
  }

  async getCategories(params?: {
    sort?: string
    order?: string
  }): Promise<CategoryListResponse> {
    return this.fetchJson<CategoryListResponse>("/api/categories", params)
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
    return this.fetchJson<CategoryDetailResponse>(`/api/category/${categoryId}`, {
      page: params?.page ?? 1,
      per_page: params?.per_page ?? DEFAULT_PER_PAGE,
      sort: params?.sort,
      order: params?.order,
    })
  }

  async search(params: {
    q: string
    page?: number
    per_page?: number
    category?: string
    sort?: string
    order?: string
  }): Promise<SearchResponse> {
    return this.fetchJson<SearchResponse>("/api/search", {
      page: params.page ?? 1,
      per_page: params.per_page ?? DEFAULT_PER_PAGE,
      ...params,
    })
  }
}

export const apiClient = new ApiClient()