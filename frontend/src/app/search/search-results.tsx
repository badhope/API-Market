"use client"

// Client-side search for the statically-exported build.
//
// The static export can only bake one HTML file per route — it can't
// pre-render every possible `?q=…` URL. So instead of a server-rendered
// search results page (which is impossible in `output: "export"`), we
// load `all.json` from the public directory once and filter in the
// browser. GitHub Pages' CDN caches `all.json` so subsequent searches
// are instant.
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { ApiTable, Pager, Statline } from "@/components/wiki/shared"
import { BASE_PATH } from "@/lib/links"
import type { ApiSummary } from "@/types"

interface AllPayload {
  items: ApiSummary[]
}

const PER_PAGE = 25

function readQueryFromUrl(): {
  q: string
  grade: string
  sort: string
  order: string
  page: number
} {
  if (typeof window === "undefined") {
    return { q: "", grade: "", sort: "name", order: "asc", page: 1 }
  }
  const p = new URLSearchParams(window.location.search)
  return {
    q: p.get("q")?.trim() ?? "",
    grade: p.get("grade") ?? "",
    sort: p.get("sort") ?? "name",
    order: p.get("order") ?? "asc",
    page: Math.max(1, parseInt(p.get("page") || "1", 10)),
  }
}

function writeQueryToUrl(params: {
  q: string
  grade: string
  sort: string
  order: string
  page: number
}) {
  if (typeof window === "undefined") return
  const p = new URLSearchParams()
  if (params.q) p.set("q", params.q)
  if (params.grade) p.set("grade", params.grade)
  if (params.sort && params.sort !== "name") p.set("sort", params.sort)
  if (params.order && params.order !== "asc") p.set("order", params.order)
  if (params.page > 1) p.set("page", String(params.page))
  const qs = p.toString()
  const url = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname
  window.history.replaceState(null, "", url)
}

function buildHref(params: {
  q: string
  grade: string
  sort: string
  order: string
  page: number
}): string {
  const p = new URLSearchParams()
  if (params.q) p.set("q", params.q)
  if (params.grade) p.set("grade", params.grade)
  if (params.sort && params.sort !== "name") p.set("sort", params.sort)
  if (params.order && params.order !== "asc") p.set("order", params.order)
  if (params.page > 1) p.set("page", String(params.page))
  const qs = p.toString()
  // Return a relative path; <Link> prepends the basePath automatically.
  return qs ? `/search?${qs}` : `/search`
}

export function SearchResults() {
  // All data lives in `all.json` (public/data/). The component fetches
  // it lazily so the empty-state HTML ships without a 7 MB payload.
  const [all, setAll] = useState<ApiSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState(() => readQueryFromUrl())

  useEffect(() => {
    let cancelled = false
    setError(null)
    if (!query.q && !query.grade) {
      setAll(null)
      return
    }
    fetch(`${BASE_PATH}/data/all.json`, { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<AllPayload>
      })
      .then((data) => {
        if (cancelled) return
        setAll(data.items)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : "Failed to load")
      })
    return () => {
      cancelled = true
    }
    // We only want to refetch on query/grade change, not on sort/page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.grade])

  // Keep the URL in sync with the displayed state so the page is
  // shareable and the back button works.
  useEffect(() => {
    writeQueryToUrl(query)
  }, [query])

  const filtered = useMemo(() => {
    if (!all) return [] as ApiSummary[]
    const needle = query.q.toLowerCase()
    let pool = all
    if (needle) {
      pool = pool.filter(
        (a) =>
          a.name.toLowerCase().includes(needle) ||
          (a.description ?? "").toLowerCase().includes(needle) ||
          a.id.toLowerCase().includes(needle),
      )
    }
    if (query.grade) {
      pool = pool.filter((a) => a.quality_grade === query.grade)
    }
    const sign = query.order === "asc" ? 1 : -1
    if (query.sort === "quality") {
      return [...pool].sort(
        (a, b) => sign * ((a.quality_score ?? 0) - (b.quality_score ?? 0)),
      )
    }
    if (query.sort === "updated") {
      return [...pool].sort(
        (a, b) =>
          sign *
          (Date.parse(a.updated_at ?? "") - Date.parse(b.updated_at ?? "")),
      )
    }
    return [...pool].sort((a, b) => sign * a.name.localeCompare(b.name))
  }, [all, query.q, query.grade, query.sort, query.order])

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE))
  const currentPage = Math.min(query.page, totalPages)
  const start = (currentPage - 1) * PER_PAGE
  const pageItems = filtered.slice(start, start + PER_PAGE)

  // No active query → empty state with example searches.
  if (!query.q && !query.grade) {
    const examples = ["weather", "github", "translate", "music", "news", "maps"]
    return (
      <div className="text-sm">
        <p className="text-muted-foreground mb-3">
          Enter a query above. Search runs over API name, description, and
          category across 14,000+ quality-scored public APIs.
        </p>
        <p className="text-muted-foreground mb-1">Try one of:</p>
        <ul className="flex flex-wrap gap-2">
          {examples.map((e) => (
            <li key={e}>
              <Link
                href={`/search?q=${encodeURIComponent(e)}`}
                className="inline-flex items-center rounded border px-2 py-0.5 text-xs hover:bg-muted"
              >
                {e}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Loading.
  if (!all && !error) {
    return (
      <p className="text-sm text-muted-foreground py-6">Loading catalog…</p>
    )
  }

  // Fetch error.
  if (error) {
    return (
      <p className="text-sm text-destructive py-6">
        Couldn&rsquo;t load the catalog: {error}
      </p>
    )
  }

  return (
    <>
      <Statline>
        <strong>{total.toLocaleString()}</strong> results for{" "}
        <q>{query.q}</q>
        {totalPages > 1 && (
          <>
            {" "}· page <strong>{currentPage}</strong> of{" "}
            <strong>{totalPages}</strong>
          </>
        )}
      </Statline>

      <form
        action={`${BASE_PATH}/search`}
        method="get"
        className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm mb-3 border-b pb-3"
      >
        <input type="hidden" name="q" value={query.q} />
        <label className="text-muted-foreground">Filter</label>
        <select
          name="grade"
          defaultValue={query.grade}
          onChange={(e) =>
            setQuery((q) => ({ ...q, grade: e.target.value, page: 1 }))
          }
          className="h-8 rounded border bg-background px-2 text-sm"
        >
          <option value="">All grades</option>
          <option value="A">Grade A</option>
          <option value="B">Grade B</option>
          <option value="C">Grade C</option>
          <option value="D">Grade D</option>
          <option value="F">Grade F</option>
        </select>
        <label className="text-muted-foreground ml-2">Sort</label>
        <select
          name="sort"
          defaultValue={query.sort}
          onChange={(e) =>
            setQuery((q) => ({ ...q, sort: e.target.value, page: 1 }))
          }
          className="h-8 rounded border bg-background px-2 text-sm"
        >
          <option value="name">Name</option>
          <option value="quality">Quality</option>
          <option value="updated">Last updated</option>
        </select>
        <select
          name="order"
          defaultValue={query.order}
          onChange={(e) =>
            setQuery((q) => ({ ...q, order: e.target.value, page: 1 }))
          }
          className="h-8 rounded border bg-background px-2 text-sm"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button
          type="submit"
          className="h-8 px-3 rounded border bg-background text-sm hover:bg-muted"
        >
          Apply
        </button>
        <Link
          href={`/search?q=${encodeURIComponent(query.q)}`}
          className="ml-auto text-xs text-muted-foreground hover:underline"
        >
          clear filters
        </Link>
      </form>

      {pageItems.length > 0 ? (
        <ApiTable items={pageItems} />
      ) : (
        <p className="text-sm text-muted-foreground py-6">
          No APIs match &ldquo;{query.q}&rdquo;.
        </p>
      )}

      <Pager
        base="/search"
        page={currentPage}
        totalPages={totalPages}
        buildHref={(p) => buildHref({ ...query, page: p })}
      />
    </>
  )
}
