import type { Metadata } from "next"
import Link from "next/link"
import { loadCategories } from "@/lib/data-server"
import { internalHref } from "@/lib/links"

import { CATEGORY_TAG_FOR } from "@/lib/constants"
import { RingMeter } from "@/components/codex/ring-meter"
import { Hairline } from "@/components/codex/hairline"
import { CategoryIcon } from "@/components/codex/category-icon"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all API categories — 51 domains, from animals to weather.",
}

export default async function CategoriesPage() {
  const { items: categories, total } = await loadCategories()
  const sorted = [...categories].sort((a, b) => b.api_count - a.api_count)
  const max = Math.max(...sorted.map((c) => c.api_count), 1)

  // JSON-LD structured data for categories page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "API Categories",
    "description": "Browse all API categories",
    "numberOfItems": total,
    "itemListElement": sorted.map((category, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": category.display_name,
      "description": category.blurb || `${category.display_name} APIs`,
      "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"}/categories/${category.id}`
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      <header className="pt-16 sm:pt-24 pb-10 animate-fade-in">
        <p className="eyebrow mb-6 animate-fade-in-up">Index</p>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,4.25rem)] leading-[0.98] tracking-[-0.03em] font-medium max-w-[18ch] animate-fade-in-up-delayed">
          All categories
        </h1>
        <p className="mt-6 font-serif text-[1.0625rem] leading-[1.65] text-[var(--ink-soft)] max-w-[60ch] animate-fade-in-up-delayed-2">
          Browse {total} categories of free public APIs. Each category contains APIs
          with similar functionality — from weather data to machine learning.
        </p>
      </header>

      <Hairline className="mb-2" />

      <ol className="border-b border-[var(--rule)]" aria-label="Categories list">
        {sorted.map((c, i) => {
          const idx = i + 1
          return (
            <li key={c.id} className="group">
              <Link
                href={internalHref(`/categories/${c.id}`)}
                className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[4rem_1fr_auto] lg:grid-cols-[6rem_1fr_auto] items-start gap-3 sm:gap-5 py-5 sm:py-6 border-b border-[var(--rule)] hover:bg-[var(--paper-soft)]/40 transition-all duration-200 -mx-3 px-3"
                aria-label={`${c.display_name} category - ${c.api_count} APIs`}
              >
                <span className="font-mono text-[0.625rem] sm:text-[0.6875rem] tabular-nums text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors pt-1">
                  {String(idx).padStart(3, "0")}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1">
                    <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--paper-soft)] group-hover:bg-[var(--accent)]/10 transition-colors">
                      <CategoryIcon categoryId={c.id} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ink-mute)] group-hover:text-[var(--accent)] transition-colors" />
                    </div>
                    <p className="font-mono text-[0.625rem] tracking-[0.18em] uppercase text-[var(--ink-mute)] group-hover:text-[var(--accent)] transition-colors">
                      {CATEGORY_TAG_FOR(c.id)}
                    </p>
                  </div>
                  <p className="mt-1 font-serif text-[1.125rem] sm:text-[1.25rem] lg:text-[1.5rem] leading-snug tracking-[-0.01em] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {c.display_name}
                  </p>
                  {c.blurb && (
                    <p className="mt-2 text-[0.8125rem] sm:text-[0.875rem] leading-relaxed text-[var(--ink-mute)] max-w-[60ch]">
                      {c.blurb}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-3 sm:gap-4 font-mono text-[0.625rem] sm:text-[0.6875rem] text-[var(--ink-faint)]">
                    <span>{c.api_count} {c.api_count === 1 ? 'API' : 'APIs'}</span>
                    <span>·</span>
                    <span>Avg quality: {Math.round(c.avg_quality)}/100</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 pt-1">
                  <div className="hidden lg:block w-32">
                    <div className="relative h-px bg-[var(--rule)]">
                      <div
                        className="absolute top-0 left-0 h-px bg-[var(--ink)] group-hover:bg-[var(--accent)] transition-colors"
                        style={{ width: `${(c.api_count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <RingMeter value={c.avg_quality} size={36} stroke={1.5} className="sm:hidden" />
                  <RingMeter value={c.avg_quality} size={40} stroke={1.5} className="hidden sm:block" />
                </div>
              </Link>
            </li>
          )
        })}
      </ol>

      <p className="mt-12 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] text-center">
        ◇ &nbsp; End of index &nbsp; ◇
      </p>
    </div>
    </>
  )
}
