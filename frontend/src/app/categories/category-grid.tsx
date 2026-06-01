"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { CategoryCard } from "@/components/category/category-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, useMemo } from "react"
import { useTranslation } from "@/i18n/context"
import type { CategoryListResponse } from "@/types"

export function CategoryGrid() {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")

  const { data, isLoading, error } = useQuery<CategoryListResponse>({
    queryKey: ["categories", "api_count", "desc"],
    queryFn: () => apiClient.getCategories({ sort: "api_count", order: "desc" }),
    staleTime: 5 * 60 * 1000,
  })

  const filtered = useMemo(() => {
    if (!data) return []
    if (!search.trim()) return data.items
    const q = search.toLowerCase()
    return data.items.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    )
  }, [data, search])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-5">
            <div className="h-24 animate-pulse bg-muted rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("loadFailed")}
      </div>
    )
  }

  return (
    <>
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("filterCategories")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label={t("filterCategories")}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          {t("noMatchingCategories")} &ldquo;{search}&rdquo;
        </p>
      )}
    </>
  )
}
