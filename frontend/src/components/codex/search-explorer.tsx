"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Search, X } from "lucide-react"
import { DATA_PATH } from "@/lib/links"
import { preloadSearch, searchApis, type SearchHit } from "@/lib/search"
import type { ApiSummary, CategorySummary } from "@/types"
import { ApiCard } from "./api-card"
import { EmptyState } from "./empty-state"
import { Hairline } from "./hairline"
import { CategoryTag } from "./category-tag"
import { internalHref } from "@/lib/links"

type GradeFilter = "all" | "A" | "B" | "C" | "D" | "F"

export function SearchExplorer() {
  const params = useSearchParams()
  const router = useRouter()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [grade, setGrade] = useState<GradeFilter>("all")
  const [cats, setCats] = useState<CategorySummary[] | null>(null)
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    preloadSearch()
    let cancelled = false
    setLoading(true)
    fetch(`${DATA_PATH}/categories.json`)
      .then((r) => r.json() as Promise<{ items: CategorySummary[] }>)
      .then((d) => { if (!cancelled) setCats(d.items) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!q.trim()) {
      setHits(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      searchApis(q, 200)
        .then((h) => setHits(h))
        .catch(() => setHits([]))
        .finally(() => setSearching(false))
    }, 80)
    return () => clearTimeout(t)
  }, [q])

  const tokens = useMemo(() => q.trim().split(/\s+/).filter(Boolean), [q])

  const results = useMemo<ApiSummary[]>(() => {
    if (!hits) return []
    const list = grade === "all" ? hits : hits.filter((h) => h.api.quality_grade === grade)
    return list.map((h) => h.api)
  }, [hits, grade])

  const catHits = useMemo(() => {
    if (!cats || !tokens.length) return []
    const t = tokens.join(" ")
    return cats
      .filter((c) => c.display_name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t))
      .slice(0, 6)
  }, [cats, tokens])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const u = new URL(window.location.href)
    if (q.trim()) u.searchParams.set("q", q.trim())
    else u.searchParams.delete("q")
    router.replace(u.pathname + u.search)
  }

  return (
    <>
      <form role="search" onSubmit={onSubmit} className="mt-6">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-[var(--ink-mute)]" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the codex…"
            aria-label="Search the codex"
            className="w-full h-16 pl-14 pr-12 bg-[var(--paper-soft)]/40 border border-[var(--rule)] focus:border-[var(--accent)] font-serif text-[1.25rem] leading-none tracking-[-0.005em] text-[var(--ink)] placeholder:text-[var(--ink-faint)] caret-accent outline-none transition-colors"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-8 text-[var(--ink-mute)] hover:text-[var(--ink)]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(["all", "A", "B", "C", "D", "F"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGrade(g)}
              className={
                "px-3 h-10 inline-flex items-center font-mono text-[0.6875rem] tracking-[0.14em] uppercase border " +
                (g === grade
                  ? "border-[var(--ink)] text-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                  : "border-[var(--rule)] text-[var(--ink-mute)] hover:text-[var(--ink)]")
              }
              style={g === grade && g !== "all" ? { color: `var(--grade-${g.toLowerCase()})` } : undefined}
            >
              {g === "all" ? "All grades" : `Grade ${g}`}
            </button>
          ))}
          <span className="ml-auto font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
            {searching
              ? "searching…"
              : loading
                ? "loading…"
                : `${results.length} result${results.length === 1 ? "" : "s"}`}
          </span>
        </div>
      </form>

      <Hairline className="mt-10" />

      {tokens.length > 0 && catHits.length > 0 && (
        <section className="pt-10">
          <p className="eyebrow mb-4">Categories matching</p>
          <ul className="flex flex-wrap gap-2">
            {catHits.map((c) => (
              <li key={c.id}>
                <a
                  href={internalHref(`/categories/${c.id}`)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--rule)] hover:border-[var(--accent)] transition-colors"
                >
                  <CategoryTag id={c.id} showDot={false} />
                  <span className="font-serif text-[0.9375rem]">{c.display_name}</span>
                  <span className="font-mono text-[0.6875rem] tabular-nums text-[var(--ink-mute)]">
                    {c.api_count}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="pt-10">
        {(loading || searching) && results.length === 0 && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--paper-soft)]/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !searching && results.length > 0 && (
          <ol className="border-t border-[var(--rule)]">
            {results.map((api, i) => (
              <li key={api.id}>
                <ApiCard api={api} index={i + 1} total={results.length} />
              </li>
            ))}
          </ol>
        )}

        {!loading && !searching && results.length === 0 && tokens.length > 0 && (
          <EmptyState
            title={`No APIs match "${q}".`}
            description="Try a shorter keyword, or browse the categories on the left."
          />
        )}

        {!loading && !searching && results.length === 0 && tokens.length === 0 && (
          <EmptyState
            title="Start typing to search."
            description="A name, a tag, a category, or even a URL fragment."
          />
        )}
      </section>
    </>
  )
}
