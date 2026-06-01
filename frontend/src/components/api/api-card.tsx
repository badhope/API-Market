"use client"

import Link from "next/link"
import { ExternalLink, Shield, Globe, Key } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn, getGradeColor, getCategoryIcon } from "@/lib/utils"
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

  return (
    <Card className="group transition-all duration-200 hover:shadow-md hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{api.name}</h3>
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
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
              >
                <span>{getCategoryIcon(api.category_id)}</span>
                <span>{displayName}</span>
              </Link>
            )}
          </div>
          <a
            href={api.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`${t("visitApi")} ${api.name}`}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {api.description ? (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {api.description}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/50 mt-2 italic">
            {t("noDescription")}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {api.auth && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              <Key className="h-3 w-3" />
              {api.auth}
            </span>
          )}
          {api.https === true && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded px-1.5 py-0.5">
              <Globe className="h-3 w-3" />
              {t("https")}
            </span>
          )}
          {api.cors === true && (
            <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 rounded px-1.5 py-0.5">
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
      </CardContent>
    </Card>
  )
}
