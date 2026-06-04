"use client"

import Link from "next/link"
import { ExternalLink, Shield, Globe, Key, ArrowUpRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn, getGradeColor, getCategoryIcon, safeHref } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import type { ApiSummary } from "@/types"

interface ApiCardProps {
  api: ApiSummary
  showCategory?: boolean
  categoryName?: string
}

export function ApiCard({ api, showCategory = true, categoryName }: ApiCardProps) {
  const { t } = useTranslation()
  const displayName = categoryName || api.category_id
  const href = safeHref(api.url)
  // `source_url` is filled in by `scripts/build_static_data.py` (mirrors the
  // `sourceHref` heuristic in `lib/utils.ts`). When present it points at the
  // GitHub repo / project page that originally listed the API — a separate
  // affordance from the API's own homepage so users can audit the source.
  const sourceHref = safeHref(api.source_url)

  return (
    <Card className="group relative h-full transition-all duration-200 hover:shadow-md hover:border-primary/40">
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate flex items-center gap-1">
                {api.name}
                {href ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                ) : null}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium border",
                  getGradeColor(api.quality_grade)
                )}
              >
                {api.quality_grade || "?"}
              </span>
            </div>
            {showCategory && (
              <Link
                href={`/categories/${api.category_id}`}
                className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span>{getCategoryIcon(api.category_id)}</span>
                <span>{displayName}</span>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 relative z-10">
            {sourceHref ? (
              <a
                href={sourceHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`${t("viewSource")} ${api.source || ""}`.trim()}
                title={api.source || undefined}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={`${t("visitApi")} ${api.name}`}
                title={api.name}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>

        {api.description ? (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 flex-1">
            {api.description}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mt-2 italic flex-1">
            {t("noDescription")}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          {api.auth && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              <Key className="h-3 w-3" />
              {api.auth}
            </span>
          )}
          {api.https === true && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded px-1.5 py-0.5">
              <Globe className="h-3 w-3" />
              {t("https")}
            </span>
          )}
          {api.cors === true && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded px-1.5 py-0.5">
              <Shield className="h-3 w-3" />
              {t("cors")}
            </span>
          )}
          {api.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        {/*
          Card-level click target. Pinned to the entire card surface and
          styled with the API name when present. The category + external
          icon links above use `z-10` and `e.stopPropagation()` to keep
          their clicks from being swallowed.
        */}
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${t("visitApi")} ${api.name}`}
            className="absolute inset-0 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        ) : null}
      </CardContent>
    </Card>
  )
}
