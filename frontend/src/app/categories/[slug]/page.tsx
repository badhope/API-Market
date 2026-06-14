import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { loadCategories, loadCategoryDetail } from "@/lib/data-server"
import { Hairline } from "@/components/codex/hairline"
import { PaginatedApiList } from "@/components/codex/paginated-list"
import { CATEGORY_TAG_FOR } from "@/lib/constants"
import { formatCount } from "@/lib/format"
import Link from "next/link"
import { internalHref } from "@/lib/links"

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
  const data = await loadCategoryDetail(slug)
  
  if (!data) {
    return {
      title: "Category Not Found",
      description: "The requested category could not be found.",
    }
  }
  
  const { category, total } = data
  
  return {
    title: `${category.display_name} - Free Public APIs`,
    description: `Browse ${total} free public APIs in the ${category.display_name} category. ${category.blurb || ""} All APIs are tested, scored, and ready to use.`,
    openGraph: {
      title: `${category.display_name} APIs - API-Market`,
      description: `Browse ${total} free public APIs in the ${category.display_name} category.`,
      type: "website",
    },
  }
}

export default async function CategoryDetailPage({
  params,
}: Props) {
  const { slug } = await params
  const data = await loadCategoryDetail(slug)
  if (!data) notFound()

  const { category, items, total } = data

  // JSON-LD structured data for category detail page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${category.display_name} APIs`,
    "description": category.blurb || `Free public APIs in the ${category.display_name} category`,
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"}/categories/${category.id}`,
    "numberOfItems": total,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Categories",
          "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"}/categories`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": category.display_name,
          "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"}/categories/${category.id}`
        }
      ]
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
        {/* Breadcrumb navigation */}
        <nav aria-label="Breadcrumb" className="pt-8 sm:pt-12">
          <ol className="flex items-center gap-2 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
            <li>
              <Link href={internalHref("/")} className="hover:text-[var(--accent)] transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={internalHref("/categories")} className="hover:text-[var(--accent)] transition-colors">
                Categories
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[var(--ink)]">{category.display_name}</li>
          </ol>
        </nav>
      {/* Header */}
      <header className="pt-16 sm:pt-24 pb-12">
        <p className="eyebrow mb-6">
          Category · <span className="text-[var(--ink-mute)]">{CATEGORY_TAG_FOR(category.id)}</span>
        </p>
        <h1 className="font-serif text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.95] tracking-[-0.035em] font-medium">
          {category.display_name}
        </h1>
        {category.blurb && (
          <p className="mt-6 font-serif text-[1.125rem] leading-[1.65] text-[var(--ink-soft)] max-w-[58ch]">
            {category.blurb}
          </p>
        )}
        <p className="mt-8 font-mono text-[0.875rem] text-[var(--ink-mute)]">
          {total} {total === 1 ? "API" : "APIs"} · Average quality: {Math.round(category.avg_quality)}/100
        </p>
      </header>

      <Hairline className="mb-2" />

      <PaginatedApiList items={items} />

      <p className="mt-12 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] text-center">
        ◇ &nbsp; Showing {items.length} of {formatCount(total)} &nbsp; ◇
      </p>
      </div>
    </>
  )
}
