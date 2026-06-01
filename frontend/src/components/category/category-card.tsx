"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { getCategoryIcon, formatCount } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import type { CategorySummary } from "@/types"

interface CategoryCardProps {
  category: CategorySummary
  variant?: "default" | "compact"
}

export function CategoryCard({ category, variant = "default" }: CategoryCardProps) {
  const { t } = useTranslation()

  if (variant === "compact") {
    return (
      <Link
        href={`/categories/${category.id}`}
        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent hover:border-primary/30 transition-all"
      >
        <span className="text-2xl">{getCategoryIcon(category.id)}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium truncate">{category.display_name}</h4>
          <p className="text-xs text-muted-foreground">{formatCount(category.api_count)} {t("apisCount")}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/categories/${category.id}`}>
      <Card className="group transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5">
        <CardContent className="p-5">
          <div className="text-3xl mb-3">{getCategoryIcon(category.id)}</div>
          <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
            {category.display_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{formatCount(category.api_count)} {t("apisCount")}</span>
            {category.avg_quality > 0 && (
              <span className="text-xs text-muted-foreground">
                &middot; {t("avg")} {category.avg_quality.toFixed(0)}/100
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
