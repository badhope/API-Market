/**
 * Wiki / directory-style shared bits.
 *
 * Site-wide concerns that don't belong to any one page: the eyebrow
 * number callout, the search box, the standard "load this page of N"
 * table footer, etc. Kept here so the page components stay tiny and
 * the visual language stays consistent.
 */
import Link from "next/link"

import { getGradeColor } from "@/lib/utils"
import type { ApiSummary } from "@/types"

/** One-liner stat block used at the top of every page. */
export function Statline({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground border-b pb-3 mb-4">
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
    <div className="flex items-baseline justify-between gap-3 border-b pb-2 mb-3">
      <h1 className="text-xl font-semibold">
        {title}
        {count !== undefined && (
          <span className="text-muted-foreground font-normal">
            {" "}({count}
            {suffix ? suffix : ""})
          </span>
        )}
      </h1>
      {right ? <div className="text-sm">{right}</div> : null}
    </div>
  )
}

/**
 * The one and only API row used across home, category, and search.
 * One row = one API; everything that needs to render an API goes
 * through this so the visual language stays consistent and any tweak
 * (font size, columns) lands everywhere at once.
 */
export function ApiRow({ api }: { api: ApiSummary }) {
  return (
    <tr className="border-b last:border-0 align-top hover:bg-muted/40">
      <td className="py-1.5 pr-3">
        <div className="flex items-center gap-2">
          {api.quality_grade && (
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold border ${getGradeColor(api.quality_grade)}`}
            >
              {api.quality_grade}
            </span>
          )}
          {api.url ? (
            <a
              href={api.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              {api.name}
            </a>
          ) : (
            <span className="font-medium">{api.name}</span>
          )}
        </div>
        {api.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 ml-7">
            {api.description}
          </p>
        )}
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
        <Link
          href={`/categories/${api.category_id}`}
          className="hover:underline"
        >
          {api.category_id}
        </Link>
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
        {api.auth || "—"}
      </td>
      <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
        {api.https === true ? "yes" : api.https === false ? "no" : "—"}
      </td>
      <td className="py-1.5 text-xs text-muted-foreground whitespace-nowrap text-right">
        {api.quality_score ?? "—"}
      </td>
    </tr>
  )
}

/**
 * A page-row: previous / next / current.
 * Wiki-style "1 2 3 … 37 (next)" pager.
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
   * default `internalHref(${base}?...)` builder. Used by the search
   * page, which needs to encode its in-memory query state (q, grade,
   * sort, order) into the URL.
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
  const window = 2
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…")
    }
  }
  return (
    <nav
      className="flex items-center gap-1 text-sm border-t pt-3 mt-4"
      aria-label="Pagination"
    >
      {page > 1 && (
        <Link
          href={href(page - 1)}
          rel="prev"
          className="px-2 py-1 rounded hover:bg-muted"
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
          className="px-2 py-1 rounded hover:bg-muted"
        >
          next ›
        </Link>
      )}
      <span className="ml-auto text-xs text-muted-foreground">
        page {page} of {totalPages}
      </span>
    </nav>
  )
}
