import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchExplorer } from "@/components/codex/search-explorer"

export const metadata: Metadata = {
  title: "Search",
  description: "Search 1,548 free public APIs by name, tag, or category.",
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      <header className="pt-16 sm:pt-24 pb-10">
        <p className="eyebrow mb-6">Search</p>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,4.25rem)] leading-[0.98] tracking-[-0.03em] font-medium max-w-[18ch]">
          Find an API
        </h1>
        <p className="mt-6 font-serif text-[1.0625rem] leading-[1.65] text-[var(--ink-soft)] max-w-[60ch]">
          Type a name, tag, or category. Use the arrow keys to navigate results.
        </p>
      </header>
      <Suspense>
        <SearchExplorer />
      </Suspense>
    </div>
  )
}
