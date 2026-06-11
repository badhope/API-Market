import type { Metadata } from "next"
import Link from "next/link"
import { loadCategories } from "@/lib/data-server"
import { internalHref } from "@/lib/links"
import { formatCount, roman } from "@/lib/format"
import { CATEGORY_TAG_FOR } from "@/lib/constants"
import { RingMeter } from "@/components/codex/ring-meter"
import { Hairline } from "@/components/codex/hairline"

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all API categories — 44 domains, from astronomy to weather.",
}

export default async function CategoriesPage() {
  const { items: categories, total } = await loadCategories()
  const sorted = [...categories].sort((a, b) => b.api_count - a.api_count)
  const max = Math.max(...sorted.map((c) => c.api_count), 1)

  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      <header className="pt-16 sm:pt-24 pb-10">
        <p className="eyebrow mb-6">
          {roman(1).padStart(2, "0")}. · Index
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,4.25rem)] leading-[0.98] tracking-[-0.03em] font-medium max-w-[18ch]">
          All categories.
        </h1>
        <p className="mt-6 font-serif text-[1.0625rem] leading-[1.65] text-[var(--ink-soft)] max-w-[60ch]">
          The codex is divided into <em className="italic">{total}</em> chapters
          — domains, kinds, and shapes of network. Pick one to read further.
        </p>
      </header>

      <Hairline className="mb-2" />

      <ol className="border-b border-[var(--rule)]">
        {sorted.map((c, i) => {
          const idx = i + 1
          return (
            <li key={c.id} className="group">
              <Link
                href={internalHref(`/categories/${c.id}`)}
                className="grid grid-cols-[4rem_1fr_auto] sm:grid-cols-[6rem_1fr_auto] items-center gap-5 py-5 border-b border-[var(--rule)] hover:bg-[var(--paper-soft)]/40 transition-colors -mx-3 px-3"
              >
                <span className="font-mono text-[0.6875rem] tabular-nums text-[var(--ink-faint)] group-hover:text-[var(--accent)] transition-colors">
                  {String(idx).padStart(3, "0")}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[0.625rem] tracking-[0.18em] uppercase text-[var(--ink-mute)] group-hover:text-[var(--accent)] transition-colors">
                    {CATEGORY_TAG_FOR(c.id)}
                  </p>
                  <p className="mt-1 font-serif text-[1.25rem] sm:text-[1.5rem] leading-snug tracking-[-0.01em] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {c.display_name}
                  </p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="hidden sm:block w-32">
                    <div className="relative h-px bg-[var(--rule)]">
                      <div
                        className="absolute top-0 left-0 h-px bg-[var(--ink)] group-hover:bg-[var(--accent)] transition-colors"
                        style={{ width: `${(c.api_count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-mono text-[0.75rem] tabular-nums text-[var(--ink-soft)] whitespace-nowrap">
                    {formatCount(c.api_count)}
                  </span>
                  <RingMeter value={c.avg_quality} size={40} stroke={1.5} />
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
  )
}
