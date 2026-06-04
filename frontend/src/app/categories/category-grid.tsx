"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { CategoryCard } from "@/components/category/category-card"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useState, useMemo, useCallback } from "react"
import { useTranslation } from "@/i18n/context"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { CategoryListResponse } from "@/types"

export function CategoryBrowser() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The `q` URL parameter is the source of truth for the search box so a
  // shared link / back button restores the filter without a state lookup.
  const urlQuery = searchParams.get("q") || ""
  const [search, setSearch] = useState(urlQuery)
  const [searchFocused, setSearchFocused] = useState(false)

  const { data, isLoading, error } = useQuery<CategoryListResponse>({
    queryKey: ["categories", "api_count", "desc"],
    queryFn: () => apiClient.getCategories({ sort: "api_count", order: "desc" }),
    staleTime: 5 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.items
    return data.items.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    )
  }, [data, search])

  const commitSearch = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) params.set("q", next)
      else params.delete("q")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    commitSearch(search.trim())
  }

  const onClear = () => {
    setSearch("")
    commitSearch("")
  }

  if (error || (!isLoading && !data)) {
    return (
      <div className="text-center py-12 text-muted-foreground">{t("loadFailed")}</div>
    )
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="relative max-w-md mx-auto mb-3"
        role="search"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={t("filterCategories")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="pl-9 pr-9 h-10 appearance-none [&::-webkit-search-cancel-button]:hidden"
          aria-label={t("filterCategories")}
          aria-controls="category-grid"
        />
        {(searchFocused || search) && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label={t("clearSearch")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>
      <p
        className="text-center text-xs text-muted-foreground mb-8"
        role="status"
        aria-live="polite"
      >
        {isLoading
          ? "…"
          : search.trim()
            ? `${filtered.length} / ${data?.items.length ?? 0} ${t("categories").toLowerCase()}`
            : `${data?.items.length ?? 0} ${t("categories").toLowerCase()}`}
      </p>
      <div
        id="category-grid"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
      >
        {isLoading
          ? Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border bg-card p-5 h-[112px] animate-pulse"
                aria-hidden="true"
              >
                <div className="h-7 w-7 rounded bg-muted mb-3" />
                <div className="h-3.5 w-3/4 rounded bg-muted" />
              </div>
            ))
          : filtered.map((cat) => <CategoryCard key={cat.id} category={cat} />)}
      </div>
      {!isLoading && filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {t("noMatchingCategories")} &ldquo;{search}&rdquo;
        </p>
      )}
    </>
  )
}
