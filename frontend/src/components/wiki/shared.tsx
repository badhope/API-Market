/**
 * Wiki / directory-style shared bits.
 *
 * Site-wide concerns that don't belong to any one page: the eyebrow
 * number callout, the search box, the standard "load this page of N"
 * table footer, etc. Kept here so the page components stay tiny and
 * the visual language stays consistent.
 *
 * Mobile-first: every component is built so it works on a 320px
 * viewport without horizontal scroll. Tables hide non-essential
 * columns below the `sm` breakpoint; flex rows wrap; long strings
 * truncate or break.
 */
import Link from "next/link"

import { getGradeColor } from "@/lib/utils"
import type { ApiSummary } from "@/types"

/** One-liner stat block used at the top of every page. */
export function Statline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground border-b pb-3 mb-4 break-words">
      {children}
    </p>
  )
}

/** `<h1>` with the count of items in the (sub)title. Wiki-style. */
export function TitleRow({
  title,
  count,
  suffix,
  right,
}: {
  title: string
  count?: number | string
  suffix?: string
  right?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b pb-2 mb-3 min-w-0">
      <h1 className="text-lg sm:text-xl font-semibold min-w-0 break-words">
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground font-normal">
            {" "}({count}
            {suffix ? suffix : ""})
          </span>
        )}
      </h1>
      {right ? <div className="text-sm shrink-0">{right}</div> : null}
    </div>
  )
}

/**
 * The one and only API row used across home, category, and search.
 * One row = one API; everything that needs to render an API goes
 * through this so the visual language stays consistent and any tweak
 * (font size, columns) lands everywhere at once.
 *
 * Mobile layout: only API name + quality badge + score (last column).
 * Category / Auth / HTTPS are hidden below `sm` to keep the row
 * readable on a 320px viewport without horizontal scroll. The whole
 * row is wrapped in `<ApiTable>` so wider screens get the full
 * table.
 */
export function ApiRow({ api }: { api: ApiSummary }) {
  return (
    <tr className="border-b last:border-0 align-top hover:bg-muted/40">
      <td className="py-1.5 pr-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          {api.quality_grade && (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border shrink-0 ${getGradeColor(api.quality_grade)}`}
              aria-label={`Grade ${api.quality_grade}`}
            >
              {api.quality_grade}
            </span>
          )}
          {api.url ? (
            <a
              href={api.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline truncate min-w-0"
            >
              {api.name}
            </a>
          ) : (
            <span className="font-medium truncate min-w-0">{api.name}</span>
          )}
        </div>
        {api.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 ml-7 break-words">
            {api.description}
          </p>
        )}
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
        <Link href={`/categories/${api.category_id}`} className="hover:underline">
          {api.category_id}
        </Link>
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap hidden sm:table-cell">
        {api.auth || "—"}
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap hidden md:table-cell">
        {api.https === true ? "yes" : api.https === false ? "no" : "—"}
      </td>
      <td className="py-1.5 pl-3 sm:pl-0 text-xs text-muted-foreground whitespace-nowrap text-right tabular-nums">
        {api.quality_score ?? "—"}
      </td>
    </tr>
  )
}

/**
 * The full API table — `<thead>` + rows — used across home, category,
 * and search. Centralised so the responsive column hiding stays
 * consistent: on mobile we drop Category, Auth, HTTPS columns and
 * show only the API name + score.
 *
 * The wrapper uses `-mx-3 sm:mx-0` + an inner `px-3` to let the
 * table bleed all the way to the screen edge on mobile (so wide
 * tables can scroll horizontally without a wasted margin) and pull
 * back in at `sm:` and up.
 */
export function ApiTable({ items }: { items: ApiSummary[] }) {
  return (
    <div className="overflow-x-auto -mx-3 sm:mx-0">
      <div className="inline-block min-w-full align-middle px-3 sm:px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="py-1.5 pr-3 font-medium">API</th>
              <th className="py-1.5 pr-3 font-medium hidden sm:table-cell">
                Category
              </th>
              <th className="py-1.5 pr-3 font-medium hidden sm:table-cell">
                Auth
              </th>
              <th className="py-1.5 pr-3 font-medium hidden md:table-cell">
                HTTPS
              </th>
              <th className="py-1.5 font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {items.map((api) => (
              <ApiRow key={api.id} api={api} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * A page-row: previous / next / current.
 * Wiki-style "1 2 3 … 37 (next)" pager.
 *
 * On narrow viewports the row wraps (`flex-wrap`); the trailing
 * "page X of Y" label is hidden on mobile to keep the row compact.
 */
export function Pager({
  base,
  page,
  totalPages,
  pageParam = "page",
  extraParams = {},
  buildHref,
}: {
  base: string
  page: number
  totalPages: number
  pageParam?: string
  extraParams?: Record<string, string | number | undefined>
  /**
   * Custom href builder. When provided, takes precedence over the
   * default builder. Used by the search page, which needs to encode
   * its in-memory query state (q, grade, sort, order) into the URL.
   */
  buildHref?: (page: number) => string
}) {
  if (totalPages <= 1) return null
  const href = buildHref
    ? buildHref
    : (p: number) => {
        const params = new URLSearchParams()
        for (const [k, v] of Object.entries(extraParams)) {
          if (v === undefined || v === null || v === "") continue
          params.set(k, String(v))
        }
        params.set(pageParam, String(p))
        // The href is consumed by <Link>, which prepends the basePath
        // automatically — so we keep this string relative.
        return `${base}?${params.toString()}`
      }
  const pages: (number | "…")[] = []
  // Two neighbours each side of the current page. On a 320px viewport
  // we still only emit a handful of tokens, and the surrounding
  // `flex-wrap` lets them wrap to a second line if the row is too
  // narrow for a single line.
  const neighbours = 2
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - neighbours && i <= page + neighbours)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…")
    }
  }
  return (
    <nav
      className="flex flex-wrap items-center gap-1 text-sm border-t pt-3 mt-4"
      aria-label="Pagination"
    >
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="px-2 py-1 rounded hover:bg-muted shrink-0"
        >
          ‹ prev
        </Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className="px-2 py-1 rounded bg-foreground text-background font-medium"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className="px-2 py-1 rounded hover:bg-muted"
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={href(page + 1)}
          rel="next"
          className="px-2 py-1 rounded hover:bg-muted shrink-0"
        >
          next ›
        </Link>
      )}
      <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
        page {page} of {totalPages}
      </span>
    </nav>
  )
}
