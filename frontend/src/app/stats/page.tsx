import type { Metadata } from "next"
import Link from "next/link"

import { Statline, TitleRow } from "@/components/wiki/shared"
import { loadStats } from "@/lib/data-server"
import { formatCount } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Statistics",
  description:
    "Quality grade distribution, metadata coverage, and the upstream data sources that feed API-Market.",
  alternates: { canonical: "/stats" },
}

export default async function StatsPage() {
  const data = await loadStats()
  const total = data.total_apis
  const gradePct = (n: number) =>
    total ? `${((n / total) * 100).toFixed(1)}%` : "0.0%"
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl">
      <Statline>
        Updated <strong>{data.last_updated}</strong> · <strong>{total.toLocaleString()}</strong> APIs across{" "}
        <strong>{data.total_categories}</strong> categories
      </Statline>

      <TitleRow title="Quality grade distribution" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="py-1.5 pr-2 sm:pr-3 font-medium">Grade</th>
              <th className="py-1.5 pr-2 sm:pr-3 font-medium text-right">Count</th>
              <th className="py-1.5 pr-2 sm:pr-3 font-medium text-right hidden sm:table-cell">% of total</th>
              <th className="py-1.5 font-medium">Bar</th>
            </tr>
          </thead>
          <tbody>
            {(["A", "B", "C", "D", "F"] as const).map((g) => {
              const n = data.grade_distribution[g] ?? 0
              return (
                <tr key={g} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 sm:pr-3 font-bold w-10">{g}</td>
                  <td className="py-1.5 pr-2 sm:pr-3 text-right tabular-nums">
                    {n.toLocaleString()}
                  </td>
                  <td className="py-1.5 pr-2 sm:pr-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                    {gradePct(n)}
                  </td>
                  <td className="py-1.5 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-muted rounded overflow-hidden flex-1">
                        <div
                          className="h-full bg-foreground/70"
                          style={{
                            width: total ? `${(n / total) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="tabular-nums w-12 sm:hidden text-right text-xs text-muted-foreground">
                        {gradePct(n)}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TitleRow title="Metadata coverage" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm mb-6">
          <tbody>
            {[
              { key: "https" as const, label: "HTTPS" },
              { key: "cors" as const, label: "CORS" },
              { key: "auth" as const, label: "Auth" },
              { key: "description" as const, label: "Description" },
            ].map((row) => {
              const n = data.metadata_coverage[row.key] ?? 0
              return (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-1.5 pr-2 sm:pr-3 sm:w-40 font-medium">{row.label}</td>
                  <td className="py-1.5 pr-2 sm:pr-3 tabular-nums text-muted-foreground sm:w-32 text-right">
                    <span className="sm:hidden">{gradePct(n)}</span>
                    <span className="hidden sm:inline">
                      {formatCount(n)} / {total.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-1.5 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-muted rounded overflow-hidden flex-1">
                        <div
                          className="h-full bg-foreground/70"
                          style={{
                            width: total ? `${(n / total) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="tabular-nums w-14 text-right text-xs sm:text-sm">
                        {gradePct(n)}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TitleRow
        title="Data sources"
        count={data.sources.length}
        suffix=" upstream"
      />
      <p className="text-xs text-muted-foreground mb-2 break-words">
        Aggregated by the{" "}
        <Link
          href="https://github.com/badhope/API-Market/blob/main/.github/workflows/daily-update.yml"
          className="underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          daily data-refresh workflow
        </Link>
        . Upstream data is MIT-licensed where applicable — see the NOTICE file for attribution.
      </p>
      <ul className="text-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
        {data.sources.map((src) => (
          <li key={src} className="border-b py-1 min-w-0">
            <a
              href={
                /^https?:/.test(src)
                  ? src
                  : `https://github.com/${src.replace(/^github:/, "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline truncate block"
            >
              {src}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
