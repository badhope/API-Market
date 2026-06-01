"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { ApiCard } from "@/components/api/api-card"
import { Pagination } from "@/components/ui/pagination"
import { ListSkeleton } from "@/components/ui/loading"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, SlidersHorizontal, AlertCircle, Database } from "lucide-react"
import { useTranslation } from "@/i18n/context"
import type { SearchResponse } from "@/types"
import { SORT_OPTIONS, GRADE_ORDER } from "@/lib/constants"
import { useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { TranslationKey } from "@/i18n/translations"

function SearchContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()

  const query = searchParams.get("q") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)
  const perPage = parseInt(searchParams.get("per_page") || "20", 10)
  const sort = searchParams.get("sort") || "name"
  const order = searchParams.get("order") || "asc"
  const grade = searchParams.get("grade") || ""
  const category = searchParams.get("category") || ""

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      if (updates.page === undefined && !("page" in updates)) {
        params.set("page", "1")
      }
      router.push(`/search?${params.toString()}`)
    },
    [searchParams, router]
  )

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: query ? ["search", query, page, perPage, sort, order, grade, category] : ["search_empty"],
    queryFn: () =>
      query
        ? apiClient.search({ q: query, page, per_page: perPage, category: category || undefined, sort, order })
        : Promise.resolve({ total: 0, page: 1, per_page: 20, total_pages: 0, items: [], query: null }),
    enabled: !!query,
    staleTime: 30 * 1000,
  })

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    params.set("page", "1")
    router.push(`/search?${params.toString()}`)
  }

  const hasFilters = grade || category || sort !== "name" || order !== "asc"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">{t("searchApis")}</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const form = e.target as HTMLFormElement
            const input = form.querySelector("input") as HTMLInputElement
            if (input.value.trim()) {
              updateParams({ q: input.value.trim(), page: "1" })
            }
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholderLarge")}
              defaultValue={query}
              className="pl-10 pr-4 h-12 text-lg"
              aria-label={t("search")}
            />
          </div>
          <Button type="submit" size="lg">
            {t("search")}
          </Button>
        </form>
      </div>

      {query && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <Select value={sort} onValueChange={(v) => { if (v) updateParams({ sort: v, page: "1" }) }}>
              <SelectTrigger className="w-[140px] h-9">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {t(opt.labelKey as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={order} onValueChange={(v) => { if (v) updateParams({ order: v, page: "1" }) }}>
              <SelectTrigger className="w-[100px] h-9">
                <SelectValue placeholder={t("order")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{t("ascending")}</SelectItem>
                <SelectItem value="desc">{t("descending")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={grade} onValueChange={(v) => { if (v !== null) updateParams({ grade: v === "all" ? "" : v, page: "1" }) }}>
              <SelectTrigger className="w-[120px] h-9">
                <SelectValue placeholder={t("grade")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allGrades")}</SelectItem>
                {GRADE_ORDER.map((g) => (
                  <SelectItem key={g} value={g}>
                    {t("grade")} {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-3.5 w-3.5" />
              {t("clearFilters")}
            </Button>
          )}
        </div>
      )}

      {isLoading && <ListSkeleton rows={12} />}

      {error && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium mb-2">{t("loadFailed")}</p>
          <p className="text-sm text-muted-foreground">Error: {error.message}</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {t("found")} <strong>{data.total.toLocaleString()}</strong> {t("results")}
              {data.total_pages > 1 && ` — ${t("page")} ${data.page} ${t("of")} ${data.total_pages}`}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((api) => (
              <ApiCard key={api.id} api={api} />
            ))}
          </div>
          <Pagination currentPage={data.page} totalPages={data.total_pages} total={data.total} />
        </>
      )}

      {data && data.items.length === 0 && query && (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("noResults")}</h2>
          <p className="text-muted-foreground mb-4">
            {t("noResultsDesc")}
          </p>
          <Link href="/categories" className={cn(buttonVariants({ variant: "outline" }))}>
            {t("browseCategories")}
          </Link>
        </div>
      )}

      {!query && (
        <div className="text-center py-20">
          <Database className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("searchPrompt")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {t("searchPromptDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {t("searchTags").split(",").map((tag) => {
              const trimmed = tag.trim()
              return (
                <Link
                  key={trimmed}
                  href={`/search?q=${encodeURIComponent(trimmed)}`}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm bg-muted hover:bg-accent transition-colors"
                  aria-label={`${t("search")}: ${trimmed}`}
                >
                  {trimmed}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><ListSkeleton rows={12} /></div>}>
      <SearchContent />
    </Suspense>
  )
}
