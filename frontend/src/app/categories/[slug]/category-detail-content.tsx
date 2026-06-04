"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useCallback } from "react"
import { apiClient } from "@/lib/api-client"
import { ApiCard } from "@/components/api/api-card"
import { Pagination } from "@/components/ui/pagination"
import { ListSkeleton } from "@/components/ui/loading"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, SlidersHorizontal, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/i18n/context"
import type { CategoryDetailResponse } from "@/types"

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  quality: "Quality",
  updated: "Last updated",
}
const ORDER_LABELS: Record<string, string> = {
  asc: "Ascending",
  desc: "Descending",
}

export function CategoryDetailContent() {
  const { t } = useTranslation()
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const slug = params.slug as string

  const page = parseInt(searchParams.get("page") || "1", 10)
  const sort = searchParams.get("sort") || "quality"
  const order = searchParams.get("order") || "desc"

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) sp.set(key, value)
        else sp.delete(key)
      })
      // Reset to page 1 on filter change unless caller explicitly sets page.
      if (!("page" in updates) && (updates.sort || updates.order)) {
        sp.set("page", "1")
      }
      router.push(`/categories/${slug}?${sp.toString()}`, { scroll: false })
    },
    [searchParams, router, slug]
  )

  const { data, isLoading, error } = useQuery<CategoryDetailResponse>({
    queryKey: ["category", slug, page, sort, order],
    queryFn: () => apiClient.getCategoryApis(slug, { page, sort, order }),
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return <ListSkeleton rows={12} />
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t("categoryNotFound")}</h2>
        <p className="text-muted-foreground mb-4">{t("categoryNotFoundDesc")}</p>
        <Link
          href="/categories"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          {t("backTo")}
        </Link>
      </div>
    )
  }

  const { category, items } = data
  const hasMultiplePages = data.total_pages > 1

  return (
    <>
      <p className="text-sm text-muted-foreground mb-6">
        {category.api_count.toLocaleString()} {t("apis")} &middot;{" "}
        {t("avgQuality")} <strong className="text-foreground">{category.avg_quality.toFixed(0)}/100</strong>
      </p>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
            <ArrowUpDown className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            <SelectValue>{ORDER_LABELS[order] || order}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">{ORDER_LABELS.asc}</SelectItem>
            <SelectItem value="desc">{ORDER_LABELS.desc}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((api) => (
              <ApiCard key={api.id} api={api} showCategory={false} />
            ))}
          </div>
          {hasMultiplePages && (
            <Pagination
              currentPage={data.page}
              totalPages={data.total_pages}
              total={data.total}
            />
          )}
        </>
      ) : (
        <div className="text-center py-12 text-muted-foreground">{t("noResults")}</div>
      )}
    </>
  )
}
