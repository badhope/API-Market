import type { Metadata } from "next"
import { Suspense } from "react"
import { StatsPageContent } from "./stats-content"

export const metadata: Metadata = {
  title: "Statistics",
  description:
    "API-Market statistics: total API count, quality grade distribution, metadata coverage (HTTPS, CORS, auth), and the data sources we aggregate from.",
  alternates: { canonical: "/stats" },
  openGraph: {
    title: "API-Market Statistics",
    description: "Quality distribution, metadata coverage, and data sources.",
  },
}

export default function StatsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
          API-Market Statistics
        </h1>
        <p className="text-muted-foreground">
          A snapshot of the API-Market collection: counts, quality distribution,
          metadata coverage, and the upstream data sources we aggregate.
        </p>
      </header>
      <Suspense fallback={null}>
        <StatsPageContent />
      </Suspense>
    </div>
  )
}
