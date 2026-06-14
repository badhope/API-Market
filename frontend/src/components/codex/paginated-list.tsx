"use client"

import { useState, useMemo } from "react"
import { ApiCard } from "@/components/codex/api-card"
import type { ApiSummary } from "@/types"

interface PaginatedListProps {
  items: ApiSummary[]
  pageSize?: number
}

export function PaginatedApiList({ items, pageSize = 50 }: PaginatedListProps) {
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(items.length / pageSize)

  const visibleItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  if (items.length <= pageSize) {
    return (
      <ol className="border-b border-[var(--rule)]">
        {items.map((api, i) => (
          <li key={api.id}>
            <ApiCard api={api} index={i + 1} total={items.length} />
          </li>
        ))}
      </ol>
    )
  }

  return (
    <>
      <ol className="border-b border-[var(--rule)]">
        {visibleItems.map((api, i) => {
          const globalIndex = (page - 1) * pageSize + i + 1
          return (
            <li key={api.id}>
              <ApiCard api={api} index={globalIndex} total={items.length} />
            </li>
          )
        })}
      </ol>

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-4" aria-label="Pagination">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 h-10 inline-flex items-center font-mono text-[0.75rem] tracking-[0.14em] uppercase border border-[var(--rule)] text-[var(--ink-mute)] hover:text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>
          <span className="font-mono text-[0.75rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 h-10 inline-flex items-center font-mono text-[0.75rem] tracking-[0.14em] uppercase border border-[var(--rule)] text-[var(--ink-mute)] hover:text-[var(--ink)] hover:border-[var(--accent)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </nav>
      )}
    </>
  )
}
