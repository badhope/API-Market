"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { CategoryCard } from "@/components/category/category-card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import type { CategoryListResponse } from "@/types"

export function FeaturedCategories() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery<CategoryListResponse>({
    queryKey: ["categories", "api_count", "desc"],
    queryFn: () => apiClient.getCategories({ sort: "api_count", order: "desc" }),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("browseByCategory")}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-3">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || !data || data.items.length === 0) {
    return (
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("browseByCategory")}</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {error ? t("loadFailed") : t("noResults")}
        </div>
      </section>
    )
  }

  const topCategories = data.items.slice(0, 12)

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("browseByCategory")}</h2>
        <Link
          href="/categories"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1")}
        >
          {t("viewAll")} {data.total} {t("categories").toLowerCase()}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {topCategories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} variant="compact" />
        ))}
      </div>
    </section>
  )
}
