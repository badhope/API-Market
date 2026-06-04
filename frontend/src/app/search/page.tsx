import type { Metadata } from "next"

import { TitleRow } from "@/components/wiki/shared"
import { internalHref } from "@/lib/links"

import { SearchResults } from "./search-results"

// The search is a client island. The page itself is a thin shell that
// renders the title + the search form; the result list is computed in
// the browser from `public/data/all.json` so the static export works
// without per-query HTML pre-rendering.
export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "Search APIs",
  description:
    "Search 14,000+ public APIs by name, description, or category.",
  alternates: { canonical: "/search" },
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-4 max-w-5xl">
      <TitleRow title="Search APIs" />
      <form
        action={internalHref("/search")}
        method="get"
        className="flex gap-2 mb-4"
        role="search"
      >
        <input
          type="search"
          name="q"
          placeholder="Search 14,405 APIs by name or description…"
          aria-label="Search APIs"
          className="flex-1 h-9 rounded border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded bg-foreground text-background text-sm font-medium"
        >
          Search
        </button>
      </form>
      <SearchResults />
    </div>
  )
}
