"use client"

import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
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
import { GRADE_ORDER } from "@/lib/constants"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const GRADE_LABELS: Record<string, string> = {
  "": "All grades",
  A: "Grade A",
  B: "Grade B",
  C: "Grade C",
  D: "Grade D",
  F: "Grade F",
}
const SORT_LABELS: Record<string, string> = {
  name: "Name",
  quality: "Quality",
  updated: "Last updated",
}
const ORDER_LABELS: Record<string, string> = {
  asc: "Ascending",
  desc: "Descending",
}

export function SearchPageContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()

  const query = searchParams.get("q") || ""
  const page = parseInt(searchParams.get("page") || "1", 10)
  const perPage = parseInt(searchParams.get("per_page") || "20", 10)
  const sort = searchParams.get("sort") || "name"
  const order = searchParams.get("order") || "asc"
  const grade = searchParams.get("grade") || ""

  // Controlled search box — keeps the URL as the single source of truth so
  // back / forward, shared links, and deep-linking all work consistently.
  const [inputValue, setInputValue] = useState(query)
  useEffect(() => {
    setInputValue(query)
  }, [query])

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      if (!("page" in updates) && (updates.q !== undefined || updates.sort || updates.order || updates.grade !== undefined)) {
        params.set("page", "1")
      }
      router.push(`/search?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  const { data, isLoading, error } = useQuery<SearchResponse>({
    queryKey: query
      ? ["search", query, page, perPage, sort, order, grade]
      : ["search_empty"],
    queryFn: () =>
      query
        ? apiClient.search({
            q: query,
            page,
            per_page: perPage,
            sort,
            order,
            grade: grade || undefined,
          })
        : Promise.resolve({
            total: 0,
            page: 1,
            per_page: 20,
            total_pages: 0,
            items: [],
            query: null,
          }),
    enabled: !!query,
    staleTime: 30 * 1000,
  })

  const clearFilters = () => {
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    router.push(`/search?${params.toString()}`, { scroll: false })
  }

  const hasFilters = !!grade || sort !== "name" || order !== "asc"

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: inputValue.trim() })
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex gap-2 max-w-2xl mx-auto mb-6"
        role="search"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            name="q"
            placeholder={t("searchPlaceholderLarge")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="pl-10 pr-10 h-12 text-lg appearance-none [&::-webkit-search-cancel-button]:hidden"
            aria-label={t("search")}
            autoComplete="off"
          />
          {inputValue && (
            <button
              type="button"
              onClick={() => {
                setInputValue("")
                updateParams({ q: "" })
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label={t("clearSearch")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button type="submit" size="lg" className="h-12">
          {t("search")}
        </Button>
      </form>

      {query && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <SlidersHorizontal
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Select
              value={sort}
              onValueChange={(v) => v && updateParams({ sort: v })}
            >
              <SelectTrigger className="w-[150px] h-9" aria-label={t("sortBy")}>
                <SelectValue>{SORT_LABELS[sort] || sort}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">{SORT_LABELS.name}</SelectItem>
                <SelectItem value="quality">{SORT_LABELS.quality}</SelectItem>
                <SelectItem value="updated">{SORT_LABELS.updated}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={order}
              onValueChange={(v) => v && updateParams({ order: v })}
            >
              <SelectTrigger className="w-[140px] h-9" aria-label={t("order")}>
                <SelectValue>{ORDER_LABELS[order] || order}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{ORDER_LABELS.asc}</SelectItem>
                <SelectItem value="desc">{ORDER_LABELS.desc}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={grade}
              onValueChange={(v) =>
                updateParams({ grade: v === "__all" ? "" : (v ?? "") })
              }
            >
              <SelectTrigger className="w-[150px] h-9" aria-label={t("grade")}>
                <SelectValue>{GRADE_LABELS[grade] ?? GRADE_LABELS[""]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">{GRADE_LABELS[""]}</SelectItem>
                {GRADE_ORDER.map((g) => (
                  <SelectItem key={g} value={g}>
                    {GRADE_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1"
            >
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
          <div className="flex items-center justify-between mb-4 gap-4">
            <p className="text-sm text-muted-foreground">
              {t("found")}{" "}
              <strong className="text-foreground">
                {data.total.toLocaleString()}
              </strong>{" "}
              {t("results")}
              {data.total_pages > 1 && (
                <span className="ml-1">
                  · {t("page")} {data.page} {t("of")} {data.total_pages}
                </span>
              )}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((api) => (
              <ApiCard key={api.id} api={api} />
            ))}
          </div>
          {data.total_pages > 1 && (
            <Pagination
              currentPage={data.page}
              totalPages={data.total_pages}
              total={data.total}
            />
          )}
        </>
      )}

      {data && data.items.length === 0 && query && (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("noResults")}</h2>
          <p className="text-muted-foreground mb-4">{t("noResultsDesc")}</p>
          <Link
            href="/categories"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("browseCategories")}
          </Link>
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <Database className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">{t("searchPrompt")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {t("searchPromptDesc")}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {t("searchTags")
              .split(",")
              .map((tag) => {
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
    </>
  )
}
