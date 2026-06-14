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
type AuthFilter = "all" | "none" | "apiKey" | "oauth2" | "xAuth"

export function SearchExplorer() {
  const params = useSearchParams()
  const router = useRouter()
  const [q, setQ] = useState(params.get("q") ?? "")
  const [grade, setGrade] = useState<GradeFilter>("all")
  const [auth, setAuth] = useState<AuthFilter>("all")
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
    let list = grade === "all" ? hits : hits.filter((h) => h.api.quality_grade === grade)
    if (auth !== "all") {
      list = list.filter((h) => h.api.auth === auth)
    }
    return list.map((h) => h.api)
  }, [hits, grade, auth])

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
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/20 via-[var(--accent)]/10 to-transparent rounded-lg blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative">
            <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-[var(--ink-mute)] group-focus-within:text-[var(--accent)] transition-colors" aria-hidden="true" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search 1,548 APIs…"
              aria-label="Search the codex"
              className="w-full h-14 sm:h-16 pl-12 sm:pl-14 pr-12 bg-[var(--paper)] border-2 border-[var(--rule)] group-focus-within:border-[var(--accent)] font-serif text-[1rem] sm:text-[1.25rem] leading-none tracking-[-0.005em] text-[var(--ink)] placeholder:text-[var(--ink-faint)] caret-accent outline-none transition-all duration-300 shadow-sm group-focus-within:shadow-md"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                aria-label="Clear"
                className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center justify-center size-8 text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "A", "B", "C", "D", "F"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={
                  "px-2 sm:px-3 h-8 sm:h-10 inline-flex items-center font-mono text-[0.625rem] sm:text-[0.6875rem] tracking-[0.14em] uppercase border transition-all duration-200 " +
                  (g === grade
                    ? "border-[var(--ink)] text-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--rule)] text-[var(--ink-mute)] hover:text-[var(--ink)] hover:border-[var(--ink-faint)]")
                }
                style={g === grade && g !== "all" ? { color: `var(--grade-${g.toLowerCase()})` } : undefined}
              >
                {g === "all" ? "All" : `Grade ${g}`}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "none", "apiKey", "oauth2", "xAuth"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAuth(a)}
                className={
                  "px-2 sm:px-3 h-8 sm:h-10 inline-flex items-center font-mono text-[0.625rem] sm:text-[0.6875rem] tracking-[0.14em] uppercase border transition-all duration-200 " +
                  (a === auth
                    ? "border-[var(--ink)] text-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
                    : "border-[var(--rule)] text-[var(--ink-mute)] hover:text-[var(--ink)] hover:border-[var(--ink-faint)]")
                }
              >
                {a === "all" ? "All" : a === "none" ? "No auth" : a === "apiKey" ? "API Key" : a === "oauth2" ? "OAuth" : "Custom"}
              </button>
            ))}
          </div>
          <div className="pt-2">
            <span className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
              {searching
                ? "searching…"
                : loading
                  ? "loading…"
                  : `${results.length} result${results.length === 1 ? "" : "s"}`}
            </span>
          </div>
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
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--rule)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all duration-200"
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
          <div className="space-y-3 animate-fade-in">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[var(--paper-soft)]/40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
        )}

        {!loading && !searching && results.length > 0 && (
          <ol className="border-t border-[var(--rule)] stagger-children">
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
