"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Sparkles, ArrowRight } from "lucide-react"
import { cn } from "@/lib/cn"

export function HomeSearch({ className }: { className?: string }) {
  const [q, setQ] = useState("")
  const router = useRouter()

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const trimmed = q.trim()
        if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`)
        else router.push("/search")
      }}
      className={cn("relative group", className)}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/20 via-[var(--accent)]/10 to-transparent rounded-lg blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <Search
          className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 size-4 sm:size-5 text-[var(--ink-mute)] group-focus-within:text-[var(--accent)] transition-colors pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search APIs…"
          aria-label="Search the codex"
          className={cn(
            "w-full h-12 sm:h-16 pl-10 sm:pl-14 pr-12 sm:pr-32 bg-[var(--paper)]",
            "border-2 border-[var(--rule)] group-focus-within:border-[var(--accent)]",
            "font-serif text-[0.9375rem] sm:text-[1.25rem] leading-none tracking-[-0.005em] text-[var(--ink)]",
            "placeholder:text-[var(--ink-faint)] caret-accent outline-none",
            "transition-all duration-300",
            "shadow-sm group-focus-within:shadow-md"
          )}
        />
        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] border border-[var(--rule)] px-2 py-1 rounded bg-[var(--paper-soft)]/50">
            <Sparkles className="size-3" aria-hidden="true" />
            ⌘ K
          </kbd>
          <button
            type="submit"
            aria-label="Submit search"
            className="sm:hidden inline-flex items-center justify-center size-8 text-[var(--ink-mute)] hover:text-[var(--accent)] transition-colors"
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </form>
  )
}
