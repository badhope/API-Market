import { Suspense } from "react"
import type { Metadata } from "next"
import { promises as fs } from "fs"
import path from "path"
import { CategoryDetailContent } from "./category-detail-content"
import { CATEGORY_ICONS } from "@/lib/constants"

interface CategoryMeta {
  id: string
  name: string
  display_name: string
  description?: string
}

async function readCategory(slug: string): Promise<CategoryMeta | null> {
  try {
    const file = path.join(process.cwd(), "public", "data", "categories.json")
    const raw = await fs.readFile(file, "utf-8")
    const data = JSON.parse(raw) as { items?: CategoryMeta[] }
    return data.items?.find((c) => c.id === slug) ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const cat = await readCategory(slug)
  if (!cat) {
    return { title: "Category Not Found" }
  }
  return {
    title: `${cat.display_name} APIs`,
    description: `Browse public APIs in the ${cat.display_name} category. Quality-scored across HTTPS, CORS, auth, description completeness, and recency.`,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title: `${cat.display_name} APIs | API-Market`,
      description: `Quality-scored ${cat.display_name} APIs.`,
    },
  }
}

export async function generateStaticParams() {
  try {
    const file = path.join(process.cwd(), "public", "data", "manifest.json")
    const raw = await fs.readFile(file, "utf-8")
    const manifest = JSON.parse(raw) as { category_files?: string[] }
    return (manifest.category_files || []).map((id) => ({ slug: id }))
  } catch {
    return []
  }
}

export const dynamicParams = false

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const cat = await readCategory(slug)
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense
        fallback={
          <div className="h-8 w-32 rounded bg-muted/40 mb-6" aria-hidden="true" />
        }
      >
        <CategoryDetailHeader slug={slug} displayName={cat?.display_name} />
      </Suspense>
      <Suspense fallback={null}>
        <CategoryDetailContent />
      </Suspense>
    </div>
  )
}

// Server component for the page header. The h1 + back link ship in the
// initial HTML, only the data-bound content below streams in.
async function CategoryDetailHeader({
  slug,
  displayName,
}: {
  slug: string
  displayName?: string
}) {
  const icon = CATEGORY_ICONS[slug] || "📦"
  return (
    <header className="mb-8">
      <a
        href="/categories"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        ← All categories
      </a>
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">
          {icon}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {displayName || slug}
        </h1>
      </div>
    </header>
  )
}
