import type { Metadata } from "next"
import { Suspense } from "react"
import { SearchPageContent } from "./search-content"

export const metadata: Metadata = {
  title: "Search APIs",
  description:
    "Search 14,000+ public APIs by name, description, or category. Filter by quality grade (A–F) and sort by quality, name, or recency.",
  alternates: { canonical: "/search" },
  openGraph: {
    title: "Search APIs | API-Market",
    description: "Search 14,000+ public APIs by name, description, or category.",
  },
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center tracking-tight">
          Search APIs
        </h1>
        <p className="text-center text-muted-foreground text-sm">
          Find APIs by name, description, or category. Use grade filters to surface
          well-maintained options.
        </p>
      </div>
      <Suspense fallback={null}>
        <SearchPageContent />
      </Suspense>
    </div>
  )
}
