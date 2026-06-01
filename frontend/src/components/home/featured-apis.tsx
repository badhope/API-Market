"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { ApiCard } from "@/components/api/api-card"
import { ListSkeleton } from "@/components/ui/loading"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import type { ApiListResponse } from "@/types"

export function FeaturedApis() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery<ApiListResponse>({
    queryKey: ["apis", "featured"],
    queryFn: () =>
      apiClient.getApis({ page: 1, per_page: 9, sort: "quality", order: "desc" }),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("topQualityApis")}</h2>
        </div>
        <ListSkeleton rows={6} />
      </section>
    )
  }

  if (error || !data || data.items.length === 0) {
    return (
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t("topQualityApis")}</h2>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {error ? t("loadFailed") : t("noResults")}
        </div>
      </section>
    )
  }

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{t("topQualityApis")}</h2>
        <Link
          href="/search?sort=quality&order=desc"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1")}
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.items.map((api) => (
          <ApiCard key={api.id} api={api} />
        ))}
      </div>
    </section>
  )
}
