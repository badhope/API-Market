"use client"

import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, FolderTree, Globe, Shield, Key, FileText, Star, ExternalLink } from "lucide-react"
import { formatCount, formatDate, getGradeColor, sourceHref } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import { SOURCE_LINKS } from "@/lib/constants"
import type { StatsResponse } from "@/types"

export default function StatsPage() {
  const { t, locale } = useTranslation()
  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  const totalGraded = Object.values(data.grade_distribution).reduce((a, b) => a + b, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{t("statistics")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("statisticsDesc")} {t("lastUpdatedDate")}: {formatDate(data.last_updated, locale)}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card>
          <CardContent className="p-4">
            <Database className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{formatCount(data.total_apis)}</p>
            <p className="text-xs text-muted-foreground">{t("totalApis")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <FolderTree className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">{data.total_categories}</p>
            <p className="text-xs text-muted-foreground">{t("categoriesCount")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Globe className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{data.sources.length}</p>
            <p className="text-xs text-muted-foreground">{t("dataSources")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Star className="h-5 w-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{totalGraded.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t("qualityScored")}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">{t("qualityGradeDistribution")}</h2>
      <div className="grid grid-cols-5 gap-4 mb-10">
        {["A", "B", "C", "D", "F"].map((grade) => {
          const count = data.grade_distribution[grade] || 0
          const pct = totalGraded > 0 ? ((count / totalGraded) * 100).toFixed(1) : "0"
          return (
            <Card key={grade}>
              <CardContent className="p-4 text-center">
                <span
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold mb-2 ${getGradeColor(grade)}`}
                >
                  {grade}
                </span>
                <p className="text-xl font-bold">{formatCount(count)}</p>
                <p className="text-xs text-muted-foreground">{pct}%</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <h2 className="text-xl font-bold mb-4">{t("metadataCoverage")}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card>
          <CardContent className="p-4">
            <Key className="h-5 w-5 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">
              {((data.metadata_coverage.auth / data.total_apis) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {t("authInfo")} ({formatCount(data.metadata_coverage.auth)})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Globe className="h-5 w-5 text-emerald-500 mb-2" />
            <p className="text-2xl font-bold">
              {((data.metadata_coverage.https / data.total_apis) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {t("https")} ({formatCount(data.metadata_coverage.https)})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Shield className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">
              {((data.metadata_coverage.cors / data.total_apis) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {t("cors")} ({formatCount(data.metadata_coverage.cors)})
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <FileText className="h-5 w-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">
              {((data.metadata_coverage.description / data.total_apis) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              {t("descriptions")} ({formatCount(data.metadata_coverage.description)})
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">{t("dataSourcesTitle")}</h2>
      <div className="flex flex-wrap gap-2">
        {data.sources.map((source) => {
          // Explicit override first (e.g. public-apis → public-apis/public-apis);
          // otherwise derive a URL from the source name shape.
          const href = SOURCE_LINKS[source] ?? sourceHref(source)
          if (href) {
            return (
              <a
                key={source}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-muted hover:bg-accent transition-colors"
              >
                {source}
                <ExternalLink className="h-3 w-3" />
              </a>
            )
          }
          return (
            <span
              key={source}
              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium bg-muted"
            >
              {source}
            </span>
          )
        })}
      </div>
    </div>
  )
}
