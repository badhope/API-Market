"use client"

import Link from "next/link"
import { Search, ArrowRight, Database } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { StatsResponse } from "@/types"

export function Hero() {
  const { t } = useTranslation()

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
    staleTime: 5 * 60 * 1000,
  })

  const apiCount = stats?.total_apis ? `${(stats.total_apis / 1000).toFixed(0)},000+` : "14,000+"

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-background" />
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      <div className="relative container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
          <Database className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">{apiCount} {t("heroBadge")}</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
          {t("discoverTitle")}
          <span className="text-primary block">{t("discoverSubtitle")}</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          {t("heroDesc")}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/search"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            <Search className="h-5 w-5" />
            {t("searchApis")}
          </Link>
          <Link
            href="/categories"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2")}
          >
            {t("browseCategories")}
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}