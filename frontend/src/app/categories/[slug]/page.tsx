"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { useCallback, Suspense } from "react"
import { apiClient } from "@/lib/api-client"
import { ApiCard } from "@/components/api/api-card"
import { Pagination } from "@/components/ui/pagination"
import { ListSkeleton } from "@/components/ui/loading"
import { buttonVariants } from "@/components/ui/button"
import { cn, getCategoryIcon } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, SlidersHorizontal, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/i18n/context"
import type { CategoryDetailResponse } from "@/types"

function CategoryDetailContent() {
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
      router.push(`/categories/${slug}?${sp.toString()}`)
    },
    [searchParams, router, slug]
  )

  const { data, isLoading, error } = useQuery<CategoryDetailResponse>({
    queryKey: ["category", slug, page, sort, order],
    queryFn: () => apiClient.getCategoryApis(slug, { page, sort, order }),
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-8 w-48 animate-pulse bg-muted rounded mb-6" />
        <ListSkeleton rows={12} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{t("categoryNotFound")}</h1>
        <p className="text-muted-foreground mb-4">
          {t("categoryNotFoundDesc")}
        </p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/categories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToCategories")}
      </Link>

      <div className="flex items-center gap-4 mb-6">
        <span className="text-4xl">{getCategoryIcon(category.id)}</span>
        <div>
          <h1 className="text-3xl font-bold">{category.display_name}</h1>
          <p className="text-muted-foreground">
            {category.api_count.toLocaleString()} {t("apis")} &middot; {t("avgQuality")} {category.avg_quality.toFixed(0)}/100
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <Select value={sort} onValueChange={(v) => { if (v) updateParams({ sort: v, page: "1" }) }}>
          <SelectTrigger className="w-[140px] h-9">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder={t("sortBy")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">{t("name")}</SelectItem>
            <SelectItem value="quality">{t("quality")}</SelectItem>
            <SelectItem value="updated">{t("lastUpdated")}</SelectItem>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((api) => (
          <ApiCard key={api.id} api={api} showCategory={false} />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t("noResults")}
        </div>
      )}

      <Pagination currentPage={data.page} totalPages={Math.ceil(data.total / data.per_page)} total={data.total} />
    </div>
  )
}

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><ListSkeleton rows={12} /></div>}>
      <CategoryDetailContent />
    </Suspense>
  )
}