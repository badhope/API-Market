"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Database, FolderTree, Globe, Shield, Key, FileText, Star, ExternalLink } from "lucide-react"
import { formatCount, formatDate, getGradeColor, sourceHref } from "@/lib/utils"
import { useTranslation } from "@/i18n/context"
import { SOURCE_LINKS } from "@/lib/constants"
import { apiClient } from "@/lib/api-client"
import type { StatsResponse } from "@/types"

// Canonicalise upstream source names so duplicates collapse. Strips
// `github:` / `github.com/` prefix and lower-cases before comparing.
function canonicalSource(s: string): string {
  return s
    .replace(/^github(?:\.com)?[:/]/i, "")
    .replace(/\.json$/i, "")
    .toLowerCase()
    .trim()
}

export function StatsPageContent() {
  const { t, locale } = useTranslation()
  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading || !data) {
    return (
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-32 mb-10" />
        <Skeleton className="h-40 mb-10" />
        <Skeleton className="h-24" />
      </div>
    )
  }

  // De-duplicate the upstream source list so `n0shake/Public-APIs`,
  // `github:n0shake/Public-APIs`, and `n0shake/Public-APIs` don't all
  // show up as three separate entries. Keep the *first* raw form we see
  // for display so the link points somewhere useful.
  const sourceDisplayMap = new Map<string, string>()
  for (const s of data.sources) {
    const key = canonicalSource(s)
    if (key && !sourceDisplayMap.has(key)) {
      sourceDisplayMap.set(key, s)
    }
  }
  // Drop obviously-leaked filenames.
  const cleanedSources = Array.from(sourceDisplayMap.values()).filter(
    (s) => !/\.(json|yaml|yml|toml|csv)$/i.test(s) && !/^_/i.test(s)
  )
  cleanedSources.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Stat
          icon={<Database className="h-5 w-5 text-blue-500" />}
          value={formatCount(data.total_apis)}
          label={t("totalApis")}
        />
        <Stat
          icon={<FolderTree className="h-5 w-5 text-emerald-500" />}
          value={formatCount(data.total_categories)}
          label={t("totalCategories")}
        />
        <Stat
          icon={<Star className="h-5 w-5 text-amber-500" />}
          value={(() => {
            const dist = data.grade_distribution ?? {}
            const total = Object.values(dist).reduce((a, b) => a + b, 0)
            if (!total) return "—"
            const score =
              (dist.A ?? 0) * 95 +
              (dist.B ?? 0) * 85 +
              (dist.C ?? 0) * 75 +
              (dist.D ?? 0) * 60 +
              (dist.F ?? 0) * 40
            return Math.round(score / total).toString()
          })()}
          label={t("avgQuality")}
        />
        <Stat
          icon={<FileText className="h-5 w-5 text-violet-500" />}
          value={data.last_updated ? formatDate(data.last_updated, locale) : "—"}
          label={t("lastUpdated")}
        />
      </div>

      <h2 className="text-xl font-bold mb-4">Quality Grade Distribution</h2>
      <p className="text-sm text-muted-foreground mb-4">
        APIs are graded A (best) → F (worst) across five dimensions: HTTPS, CORS, auth, description, and recency.
      </p>
      <GradeDistribution distribution={data.grade_distribution} total={data.total_apis} />

      <h2 className="text-xl font-bold mb-4 mt-10">Metadata Coverage</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Fraction of APIs that publish each piece of metadata. Higher coverage makes
        APIs more discoverable and easier to integrate.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <CoverageCard
          icon={<Globe className="h-5 w-5 text-emerald-500" />}
          count={data.metadata_coverage.https}
          total={data.total_apis}
          label={t("https")}
        />
        <CoverageCard
          icon={<Shield className="h-5 w-5 text-blue-500" />}
          count={data.metadata_coverage.cors}
          total={data.total_apis}
          label={t("cors")}
        />
        <CoverageCard
          icon={<Key className="h-5 w-5 text-orange-500" />}
          count={data.metadata_coverage.auth}
          total={data.total_apis}
          label={t("authInfo")}
        />
      </div>

      <h2 className="text-xl font-bold mb-2">Data Sources</h2>
      <p className="text-sm text-muted-foreground mb-4">
        API-Market aggregates data from {cleanedSources.length} public
        {cleanedSources.length === 1 ? " source" : " sources"} (deduplicated from
        the raw {data.sources.length} reported by upstream feeds).
      </p>
      <div className="flex flex-wrap gap-2">
        {cleanedSources.map((source) => {
          const href = SOURCE_LINKS[source] ?? sourceHref(source)
          if (href) {
            return (
              <a
                key={source}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium bg-background hover:bg-accent hover:border-primary/30 transition-colors"
                title={source}
              >
                {source}
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
              </a>
            )
          }
          return (
            <span
              key={source}
              className="inline-flex items-center rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium bg-muted/40 text-muted-foreground"
              title={`No public URL for "${source}"`}
            >
              {source}
            </span>
          )
        })}
      </div>
    </>
  )
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function GradeDistribution({
  distribution,
  total,
}: {
  distribution: Record<string, number>
  total: number
}) {
  const grades = ["A", "B", "C", "D", "F"]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
      {grades.map((g) => {
        const count = distribution[g] || 0
        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
        return (
          <Card key={g}>
            <CardContent className="p-4 text-center">
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-bold ${getGradeColor(g)}`}
              >
                {g}
              </span>
              <p className="text-xl font-bold mt-2">{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{pct}%</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function CoverageCard({
  icon,
  count,
  total,
  label,
}: {
  icon: React.ReactNode
  count: number
  total: number
  label: string
}) {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-sm font-medium">{label}</p>
        </div>
        <p className="text-2xl font-bold">{pct}%</p>
        <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Number(pct))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {count.toLocaleString()} / {total.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}
