import type { Metadata } from "next"
import Link from "next/link"

import { ApiTable, Statline, TitleRow } from "@/components/wiki/shared"
import {
  loadCategories,
  loadFeatured,
  loadStats,
} from "@/lib/data-server"
import { internalHref } from "@/lib/links"
import { formatCount, getCategoryIcon } from "@/lib/utils"

export const metadata: Metadata = {
  description:
    "A directory of 14,000+ quality-scored public HTTP APIs. Browse by category, search by name, or filter by HTTPS / CORS / auth.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "API-Market — A directory of 14,000+ public APIs",
    description:
      "Quality-scored, deduplicated, fully searchable. Open data under MIT.",
  },
}

export default async function Home() {
  // All three reads are independent and small (< 100 KB each on disk),
  // so promise.all them and ship the page in one round trip.
  const [stats, categories, featured] = await Promise.all([
    loadStats(),
    loadCategories(),
    loadFeatured(),
  ])
  const gradeA = stats.grade_distribution.A ?? 0
  const gradeAPct = stats.total_apis
    ? Math.round((gradeA / stats.total_apis) * 100)
    : 0
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl">
      <Statline>
        A directory of <strong>{formatCount(stats.total_apis)}</strong>{" "}
        quality-scored public HTTP APIs in <strong>{stats.total_categories}</strong>{" "}
        categories, aggregated from <strong>{stats.sources.length}</strong>{" "}
        open data sources. <strong>{gradeAPct}%</strong> are grade A.{" "}
        <Link href="/stats" className="underline">
          full statistics
        </Link>{" "}
        ·{" "}
        <Link href="/search" className="underline">
          search
        </Link>{" "}
        ·{" "}
        <Link href="/categories" className="underline">
          all categories
        </Link>
      </Statline>

      <form
        action={internalHref("/search")}
        method="get"
        className="mb-6 flex gap-2"
        role="search"
      >
        <input
          type="search"
          name="q"
          placeholder="Search 14,405 APIs by name or description…"
          aria-label="Search APIs"
          className="flex-1 min-w-0 h-9 rounded border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-9 px-3 sm:px-4 rounded bg-foreground text-background text-sm font-medium shrink-0"
        >
          Search
        </button>
      </form>

      <section>
        <TitleRow
          title="Categories"
          count={categories.items.length}
          right={
            <Link
              href="/categories"
              className="text-muted-foreground hover:underline"
            >
              all categories →
            </Link>
          }
        />
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6">
          {categories.items.slice(0, 24).map((cat) => (
            <li
              key={cat.id}
              className="flex items-baseline justify-between gap-2 border-b py-1 text-sm"
            >
              <Link
                href={`/categories/${cat.id}`}
                className="truncate hover:underline"
              >
                <span className="mr-1.5" aria-hidden="true">
                  {getCategoryIcon(cat.id)}
                </span>
                {cat.display_name}
              </Link>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {formatCount(cat.api_count)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <TitleRow
          title="Top quality APIs"
          count={featured.top_apis.length}
          right={
            <Link
              href="/search?sort=quality&order=desc"
              className="text-muted-foreground hover:underline"
            >
              full list →
            </Link>
          }
        />
        <ApiTable items={featured.top_apis} />
      </section>
    </div>
  )
}
