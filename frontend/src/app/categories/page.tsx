import type { Metadata } from "next"
import { CategoryBrowser } from "./category-grid"

export const metadata: Metadata = {
  title: "API Categories",
  description:
    "Browse 14,000+ public APIs by category. Each category is quality-scored across 5 dimensions and regularly updated.",
  openGraph: {
    title: "API Categories | API-Market",
    description: "Browse 14,000+ public APIs by category.",
  },
  alternates: {
    canonical: "/categories",
  },
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10 max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
          API Categories
        </h1>
        <p className="text-muted-foreground">
          Browse 14,000+ public APIs organised into 60+ categories. Every API is
          quality-scored across five dimensions: HTTPS support, CORS, auth,
          description completeness, and recency.
        </p>
      </div>
      <CategoryBrowser />
    </div>
  )
}
