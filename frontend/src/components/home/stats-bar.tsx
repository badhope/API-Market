"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Database, FolderTree, Search, TrendingUp } from "lucide-react"
import { formatCount } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import type { StatsResponse } from "@/types"

export function StatsBar() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getGradePercent = (grade: string) => {
    const total = Object.values(data.grade_distribution).reduce((a, b) => a + b, 0)
    if (total === 0) return 0
    return Math.round(((data.grade_distribution[grade] || 0) / total) * 100)
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{formatCount(data.total_apis)}</p>
            <p className="text-xs text-muted-foreground">{t("totalApis")}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <FolderTree className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.total_categories}</p>
            <p className="text-xs text-muted-foreground">{t("categoriesCount")}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{getGradePercent("A")}%</p>
            <p className="text-xs text-muted-foreground">{t("gradeAApis")}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Search className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold">{data.sources.length}</p>
            <p className="text-xs text-muted-foreground">{t("dataSources")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}