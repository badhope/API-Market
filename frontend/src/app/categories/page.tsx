import type { Metadata } from "next"
import Link from "next/link"

import { TitleRow, Statline } from "@/components/wiki/shared"
import { loadCategories } from "@/lib/data-server"
import { formatCount, getCategoryIcon } from "@/lib/utils"

export const metadata: Metadata = {
  title: "API Categories",
  description:
    "All 44 API categories. Each list shows the number of APIs and the average quality score for that category.",
  alternates: { canonical: "/categories" },
}

export default async function CategoriesPage() {
  const data = await loadCategories()
  const totalApis = data.items.reduce((sum, c) => sum + c.api_count, 0)
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl">
      <Statline>
        All <strong>{data.items.length}</strong> categories.{" "}
        <strong>{formatCount(totalApis)}</strong> APIs total.
      </Statline>
      <TitleRow
        title="Categories"
        count={data.items.length}
        right={
          <span className="text-xs text-muted-foreground">
            sorted by API count, descending
          </span>
        }
      />
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        {data.items.map((cat) => (
          <li
            key={cat.id}
            className="flex items-baseline justify-between gap-2 sm:gap-3 border-b py-1.5 text-sm min-w-0"
          >
            <Link
              href={`/categories/${cat.id}`}
              className="flex-1 min-w-0 truncate hover:underline"
            >
              <span className="mr-1.5" aria-hidden="true">
                {getCategoryIcon(cat.id)}
              </span>
              {cat.display_name}
            </Link>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0">
              {formatCount(cat.api_count)} APIs
            </span>
            <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-12 text-right hidden xs:inline sm:inline">
              {cat.avg_quality > 0 ? `${cat.avg_quality.toFixed(0)}/100` : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
