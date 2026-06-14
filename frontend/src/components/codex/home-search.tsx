"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
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
      className={cn("relative", className)}
    >
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[var(--ink-mute)] pointer-events-none"
        aria-hidden="true"
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 14,000+ APIs by name, tag, or category…"
        aria-label="Search the codex"
        className={cn(
          "w-full h-14 pl-12 pr-12 sm:pr-28 bg-[var(--paper-soft)]/60",
          "border border-[var(--rule)] focus:border-[var(--accent)]",
          "font-serif text-[1.125rem] leading-none tracking-[-0.005em] text-[var(--ink)]",
          "placeholder:text-[var(--ink-faint)] caret-accent outline-none",
          "transition-colors"
        )}
      />
      <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 font-mono text-[0.625rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] border border-[var(--rule)] px-1.5 py-0.5">
        ⌘ K
      </kbd>
    </form>
  )
}
