"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Command } from "cmdk"
import { Search, ArrowRight, CornerDownLeft } from "lucide-react"
import { DATA_PATH } from "@/lib/links"
import { preloadSearch, searchApis, type SearchHit } from "@/lib/search"
import type { ApiSummary, CategorySummary } from "@/types"
import { CATEGORY_TAG_FOR } from "@/lib/constants"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Command palette — full-bleed modal, paper-on-paper aesthetic. Loads
 * the Orama index and the master record list lazily on first open and
 * caches them for the session. Heavy listing is kept off the critical
 * path.
 */
export function CommandPalette({ open, onOpenChange }: Props) {
  const [q, setQ] = useState("")
  const [cats, setCats] = useState<CategorySummary[] | null>(null)
  const [hits, setHits] = useState<SearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load categories on first open; warm the search index in parallel.
  useEffect(() => {
    if (!open) return
    preloadSearch()
    if (cats) return
    let cancelled = false
    fetch(`${DATA_PATH}/categories.json`)
      .then((r) => r.json() as Promise<{ items: CategorySummary[] }>)
      .then((d) => { if (!cancelled) setCats(d.items) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open, cats])

  // Debounced search
  useEffect(() => {
    if (!open) return
    const term = q.trim()
    if (!term) {
      setHits(null)
      setSearching(false)
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      searchApis(term, 24)
        .then((h) => setHits(h))
        .catch(() => setHits([]))
        .finally(() => setSearching(false))
    }, 80)
    return () => clearTimeout(t)
  }, [q, open])

  // Focus the input as soon as we open.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    } else {
      setQ("")
    }
  }, [open])

  const catHits = useMemo(() => {
    if (!cats || !q.trim()) return []
    const t = q.trim().toLowerCase()
    return cats
      .filter(
        (c) =>
          c.display_name.toLowerCase().includes(t) ||
          c.id.toLowerCase().includes(t),
      )
      .slice(0, 8)
  }, [cats, q])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search APIs"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 bg-[color-mix(in_oklch,var(--ink)_28%,transparent)]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl bg-[var(--paper)] border border-[var(--rule)] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} label="Search APIs">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--rule)]">
            <Search className="size-4 text-[var(--ink-mute)]" aria-hidden="true" />
            <Command.Input
              ref={inputRef}
              value={q}
              onValueChange={setQ}
              placeholder="Search APIs by name, tag, or category…"
              className="flex-1 bg-transparent font-serif text-[1.125rem] leading-none outline-none placeholder:text-[var(--ink-faint)] caret-[var(--accent)]"
            />
            <kbd className="hidden sm:inline-block font-mono text-[0.625rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] border border-[var(--rule)] px-1.5 py-0.5">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {searching && (
              <div className="px-3 py-6 text-center text-[0.8125rem] text-[var(--ink-mute)] font-mono">
                searching…
              </div>
            )}

            {!searching && !q && cats && cats.length > 0 && (
              <Command.Group heading="Categories" className="cmdk-group">
                <ul className="grid grid-cols-2 gap-1">
                  {cats.slice(0, 8).map((c) => (
                    <li key={c.id}>
                      <CategoryHit c={c} onPick={() => onOpenChange(false)} />
                    </li>
                  ))}
                </ul>
              </Command.Group>
            )}

            {!searching && q && catHits.length > 0 && (
              <Command.Group heading="Categories" className="cmdk-group">
                {catHits.map((c) => (
                  <CategoryHit key={c.id} c={c} onPick={() => onOpenChange(false)} />
                ))}
              </Command.Group>
            )}

            {!searching && hits && hits.length > 0 && (
              <Command.Group heading="APIs" className="cmdk-group">
                {hits.map((hit) => (
                  <ApiHit
                    key={hit.api.id}
                    api={hit.api}
                    onPick={() => onOpenChange(false)}
                  />
                ))}
              </Command.Group>
            )}

            {!searching && q && (!hits || hits.length === 0) && catHits.length === 0 && (
              <div className="px-3 py-10 text-center">
                <p className="font-serif text-[1.125rem] text-[var(--ink-soft)]">
                  No results for "{q}".
                </p>
                <p className="mt-1 text-[0.8125rem] text-[var(--ink-mute)]">
                  Try a shorter keyword or a category name.
                </p>
              </div>
            )}
          </Command.List>

          <div className="flex items-center justify-between border-t border-[var(--rule)] px-4 py-2.5 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
            <span>API-Market</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <CornerDownLeft className="size-3" /> open
              </span>
              <span className="flex items-center gap-1.5">
                <ArrowRight className="size-3 rotate-90" /> navigate
              </span>
            </span>
          </div>
        </Command>
      </div>
    </div>
  )
}

function CategoryHit({ c, onPick }: { c: CategorySummary; onPick: () => void }) {
  return (
    <Command.Item
      value={`cat-${c.id}`}
      onSelect={() => {
        onPick()
        window.location.href = `/categories/${c.id}`
      }}
      className="cmdk-item flex items-center justify-between gap-3 px-3 py-2 cursor-pointer"
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[0.625rem] tracking-[0.16em] uppercase text-[var(--ink-mute)]">
          {CATEGORY_TAG_FOR(c.id)}
        </span>
        <span className="font-serif text-[1rem] truncate">{c.display_name}</span>
      </span>
      <span className="font-mono text-[0.625rem] tabular-nums text-[var(--ink-mute)]">
        {c.api_count}
      </span>
    </Command.Item>
  )
}

function ApiHit({ api, onPick }: { api: ApiSummary; onPick: () => void }) {
  return (
    <Command.Item
      value={`api-${api.id}`}
      onSelect={() => {
        onPick()
        window.location.href = `/apis/${api.id}`
      }}
      className="cmdk-item flex items-center justify-between gap-3 px-3 py-2 cursor-pointer"
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-[0.625rem] tracking-[0.16em] uppercase text-[var(--ink-mute)]">
          {CATEGORY_TAG_FOR(api.category_id)}
        </span>
        <span className="font-serif text-[1rem] truncate">{api.name}</span>
      </span>
      {api.quality_grade && (
        <span
          className="font-mono text-[0.625rem] tracking-[0.14em] uppercase tabular-nums"
          style={{ color: `var(--grade-${api.quality_grade.toLowerCase()})` }}
        >
          {api.quality_grade}
        </span>
      )}
    </Command.Item>
  )
}
