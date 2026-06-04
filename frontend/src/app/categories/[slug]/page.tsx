import type { Metadata } from "next"
import { promises as fs } from "fs"
import path from "path"

import { ApiTable, Pager, TitleRow } from "@/components/wiki/shared"
import { CATEGORY_ICONS } from "@/lib/constants"
import { loadCategories, loadCategoryDetail } from "@/lib/data-server"
import { internalHref } from "@/lib/links"
import { formatCount } from "@/lib/utils"

interface PageProps {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = params
  const cat = (await loadCategories()).items.find((c) => c.id === slug)
  if (!cat) return { title: "Category Not Found" }
  return {
    title: `${cat.display_name} APIs`,
    description: `${formatCount(cat.api_count)} public APIs in the ${cat.display_name} category. Quality-scored across HTTPS, CORS, auth, description completeness, and recency.`,
    alternates: { canonical: `/categories/${slug}` },
    openGraph: {
      title: `${cat.display_name} APIs | API-Market`,
      description: `${formatCount(cat.api_count)} quality-scored ${cat.display_name} APIs.`,
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

// `dynamic = "force-static"` makes the static export build one HTML
// file per category for the *default* (no-query) view. The sort / page
// query string is handled by GitHub Pages serving the same HTML to
// `?sort=...` URLs — search-engine friendly, no extra build cost.
export const dynamic = "force-static"

function asString(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? ""
  return v ?? ""
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = params
  const sort = (asString(searchParams.sort) as "name" | "quality" | "updated") || "quality"
  const order = (asString(searchParams.order) as "asc" | "desc") || "desc"
  const page = Math.max(1, parseInt(asString(searchParams.page) || "1", 10))
  const perPage = 25

  const data = await loadCategoryDetail(slug, { page, perPage, sort, order })
  if (!data) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl">
        <h1 className="text-xl font-semibold mb-2">Category not found</h1>
        <p className="text-sm text-muted-foreground">
          <a href={internalHref("/categories")} className="underline">
            See all categories
          </a>
        </p>
      </div>
    )
  }

  const { category, items, total, total_pages } = data
  const icon = CATEGORY_ICONS[slug] || "📦"
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl">
      <p className="text-xs text-muted-foreground mb-2">
        <a href={internalHref("/categories")} className="hover:underline">
          ← all categories
        </a>
      </p>
      <TitleRow
        title={`${icon}  ${category.display_name}`}
        count={formatCount(total)}
        suffix=" APIs"
        right={
          category.avg_quality > 0 ? (
            <span className="text-muted-foreground text-xs sm:text-sm">
              avg <strong>{category.avg_quality.toFixed(0)}</strong>/100
            </span>
          ) : null
        }
      />

      <form
        action={internalHref(`/categories/${slug}`)}
        method="get"
        className="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm mb-3 border-b pb-3"
      >
        <label className="text-muted-foreground">Sort</label>
        <select
          name="sort"
          defaultValue={sort}
          className="h-8 rounded border bg-background px-2 text-sm"
        >
          <option value="quality">Quality</option>
          <option value="name">Name</option>
          <option value="updated">Last updated</option>
        </select>
        <select
          name="order"
          defaultValue={order}
          className="h-8 rounded border bg-background px-2 text-sm"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <button
          type="submit"
          className="h-8 px-3 rounded border bg-background text-sm hover:bg-muted"
        >
          Apply
        </button>
        <span className="basis-full sm:basis-auto sm:ml-auto text-xs text-muted-foreground">
          showing {items.length} of {formatCount(total)}
        </span>
      </form>

      {items.length > 0 ? (
        <ApiTable items={items} />
      ) : (
        <p className="text-sm text-muted-foreground py-6">No APIs in this category.</p>
      )}

      <Pager
        base={`/categories/${slug}`}
        page={page}
        totalPages={total_pages}
        extraParams={{ sort, order }}
      />
    </div>
  )
}
