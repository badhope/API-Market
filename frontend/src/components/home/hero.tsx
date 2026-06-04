"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight, Database } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, formatCount } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { StatsResponse } from "@/types"

const POPULAR = ["weather", "cryptocurrency", "maps", "music", "news"] as const

export function Hero() {
  const { t } = useTranslation()
  const router = useRouter()
  const [q, setQ] = useState("")

  const { data: stats } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
    staleTime: 5 * 60 * 1000,
  })

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    else router.push("/search")
  }

  return (
    <section className="relative overflow-hidden">
      {/* Decorative atmosphere: a soft radial gradient + a faint dotted grid
          for texture. Both layers sit behind the content (`z-0`) and are
          absolute so they don't add to the document flow. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-primary/5 to-background"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,_rgb(0_0_0_/_0.04)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgb(0_0_0_/_0.04)_1px,_transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_70%)]"
      />
      <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm mb-6 backdrop-blur">
          <Database className="h-4 w-4 text-primary" />
          <span className="font-medium">
            {stats?.total_apis ? `${formatCount(stats.total_apis)}+` : "14,000+"}{" "}
            {t("heroBadge")}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-balance">
          {t("discoverTitle")}
          <span className="text-primary block">{t("discoverSubtitle")}</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          {t("heroDesc")}
        </p>
        <form
          onSubmit={onSubmit}
          className="flex max-w-2xl mx-auto mb-4 gap-2"
          role="search"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              name="q"
              placeholder={t("searchPlaceholderLarge")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-11 h-12 text-base appearance-none [&::-webkit-search-cancel-button]:hidden"
              aria-label={t("search")}
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            className={cn(buttonVariants({ size: "lg" }), "h-12 px-6 gap-2")}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">{t("search")}</span>
          </button>
        </form>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>{t("popular")}:</span>
          {POPULAR.map((tag) => (
            <a
              key={tag}
              href={`/search?q=${encodeURIComponent(tag)}`}
              className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 hover:bg-accent hover:border-primary/30 transition-colors"
            >
              {tag}
            </a>
          ))}
          <span className="mx-1">·</span>
          <a
            href="/categories"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {t("browseCategories")}
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  )
}
