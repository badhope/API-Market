import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { loadCategories, loadCategoryDetail } from "@/lib/data-server"
import { ApiCard } from "@/components/codex/api-card"
import { Hairline } from "@/components/codex/hairline"
import { CATEGORY_TAG_FOR } from "@/lib/constants"
import { formatCount, roman } from "@/lib/format"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Static export requires that every dynamic route enumerate its
  // slugs at build time. We just hand back every category we know
  // about.
  const { items } = await loadCategories()
  return items.map((c) => ({ slug: c.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: slug.replace(/-/g, " "),
    description: `APIs in the ${slug} category.`,
  }
}

export default async function CategoryDetailPage({
  params,
}: Props) {
  const { slug } = await params
  const data = await loadCategoryDetail(slug)
  if (!data) notFound()

  const { category, items, total } = data

  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      {/* Header */}
      <header className="pt-16 sm:pt-24 pb-12">
        <p className="eyebrow mb-6">
          {roman(1).padStart(2, "0")}. ·{" "}
          <span className="text-[var(--ink-mute)]">{CATEGORY_TAG_FOR(category.id)}</span>
        </p>
        <h1 className="font-serif text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.035em] font-medium">
          {category.display_name}.
        </h1>
        <p className="mt-8 font-serif text-[1.125rem] leading-[1.65] text-[var(--ink-soft)] max-w-[58ch]">
          {items.length > 0 ? (
            <em className="italic">{items[0].name}</em>
          ) : null}
          {items.length > 0 ? " and " : ""}
          <em className="italic">{formatCount(total)}</em> other public APIs
          in this chapter — sorted by quality, then alphabetically.
          Average quality score: <span className="font-mono tabular-nums text-[var(--ink)]">{Math.round(category.avg_quality)}</span> of 100.
        </p>
      </header>

      <Hairline className="mb-2" />

      <ol className="border-b border-[var(--rule)]">
        {items.map((api, i) => (
          <li key={api.id}>
            <ApiCard api={api} index={i + 1} total={items.length} />
          </li>
        ))}
      </ol>

      <p className="mt-12 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] text-center">
        ◇ &nbsp; Showing {items.length} of {formatCount(total)} &nbsp; ◇
      </p>
    </div>
  )
}
