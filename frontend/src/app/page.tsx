import Link from "next/link"
import { loadCategories, loadFeatured, loadStats } from "@/lib/data-server"
import { internalHref } from "@/lib/links"
import { formatCount } from "@/lib/format"
import { CATEGORY_TAG_FOR } from "@/lib/constants"
import { Section } from "@/components/codex/section"
import { ApiCard } from "@/components/codex/api-card"
import { RingMeter } from "@/components/codex/ring-meter"
import { HomeSearch } from "@/components/codex/home-search"
import { Hairline } from "@/components/codex/hairline"

export default async function HomePage() {
  const [stats, featured, categories] = await Promise.all([
    loadStats(),
    loadFeatured(),
    loadCategories(),
  ])

  const topCats = featured.top_categories.slice(0, 9)
  const topApis = featured.top_apis.slice(0, 6)
  const gradeTotal =
    Object.values(stats.grade_distribution).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">

      {/* ─── HERO ────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32 overflow-hidden">
        <div
          className="absolute inset-0 -z-10 paper-grid opacity-60"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 -z-10 paper-noise opacity-[0.18] mix-blend-multiply"
          aria-hidden="true"
        />

        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
          <div>
            <p className="eyebrow mb-6 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              A curated codex of public APIs
            </p>
            <h1 className="display font-serif text-[var(--ink)]">
              Discover <em className="italic-display">the</em> codex.
            </h1>
            <p className="mt-8 font-serif text-[1.125rem] leading-[1.6] text-[var(--ink-soft)] max-w-[42ch]">
              Fourteen thousand public APIs, gathered from forty-plus
              independent directories, deduplicated and scored
              <em className="italic"> A through F</em> — to help you
              spend less time hunting and more time shipping.
            </p>

            <div className="mt-12 max-w-[560px]">
              <HomeSearch />
            </div>
          </div>

          <aside className="lg:pt-8">
            <p className="eyebrow mb-4">Editor’s note</p>
            <p className="font-serif text-[1.0625rem] leading-[1.65] text-[var(--ink-soft)] max-w-[36ch]">
              <em className="italic-display">An API is a sentence in
              someone else’s grammar.</em> We collect them, weigh them,
              and bind them between covers — so a future you, six
              months from now, can find them again.
            </p>
            <p className="mt-6 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
              — Vol. V · {new Date(stats.last_updated ?? Date.now()).toLocaleDateString("en-GB", { year: "numeric", month: "long" })}
            </p>
          </aside>
        </div>
      </section>

      {/* ─── STATS STRIP ─────────────────────────────────────── */}
      <section className="py-16 border-t border-[var(--rule)]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-10">
          <StatBlock value={formatCount(stats.total_apis)} label="Public APIs" />
          <StatBlock value={String(stats.total_categories)} label="Categories" />
          <StatBlock value={String(stats.sources.length)} label="Upstream sources" />
          <StatBlock
            value={`${Math.round(((stats.grade_distribution.A ?? 0) / gradeTotal) * 100)}%`}
            label="Grade A or higher"
          />
        </div>
      </section>

      {/* ─── FEATURED APIs ────────────────────────────────────── */}
      <Section
        index={1}
        eyebrow="From the editor"
        title="The current shelf."
        meta={`${topApis.length} of ${formatCount(stats.total_apis)}`}
      >
        <ol className="border-t border-[var(--rule)]">
          {topApis.map((api, i) => (
            <li key={api.id}>
              <ApiCard api={api} index={i + 1} total={topApis.length} />
            </li>
          ))}
        </ol>
        <div className="mt-8 text-right">
          <Link
            href={internalHref("/categories")}
            className="inline-block font-mono text-[0.75rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] hover:text-[var(--accent)] py-2"
          >
            See all categories →
          </Link>
        </div>
      </Section>

      {/* ─── CATEGORIES ───────────────────────────────────────── */}
      <Section
        index={2}
        eyebrow="Browse by domain"
        title="A directory, by chapter."
        meta={`${categories.items.length} total`}
      >
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--rule)] border border-[var(--rule)]">
          {topCats.map((c) => (
            <li key={c.id} className="bg-[var(--paper)]">
              <Link
                href={internalHref(`/categories/${c.id}`)}
                className="group flex items-center justify-between gap-3 px-5 py-5 transition-colors hover:bg-[var(--paper-soft)]/60"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[0.625rem] tracking-[0.18em] uppercase text-[var(--ink-mute)] group-hover:text-[var(--accent)] transition-colors">
                    {CATEGORY_TAG_FOR(c.id)}
                  </p>
                  <p className="mt-1.5 font-serif text-[1.125rem] leading-snug tracking-[-0.005em] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {c.display_name}
                  </p>
                  <p className="mt-2 font-mono text-[0.6875rem] tabular-nums text-[var(--ink-faint)]">
                    {formatCount(c.api_count)} entries · avg {Math.round(c.avg_quality)}
                  </p>
                </div>
                <RingMeter value={c.avg_quality} size={48} stroke={1.5} />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 text-right">
          <Link
            href={internalHref("/categories")}
            className="inline-block font-mono text-[0.75rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] hover:text-[var(--accent)] py-2"
          >
            See all {categories.items.length} →
          </Link>
        </div>
      </Section>

      {/* ─── METHODOLOGY ──────────────────────────────────────── */}
      <Section
        index={3}
        eyebrow="How it works"
        title="A note on scoring."
        meta="Open methodology"
      >
        <div className="grid lg:grid-cols-[2fr_1fr] gap-12 lg:gap-20">
          <div className="prose-editorial space-y-5 text-[var(--ink-soft)] leading-[1.7] max-w-[60ch]">
            <p>
              Each API is graded on a handful of signal points — <em className="italic">not
              a benchmark,</em> a heuristic. The score is a rough indicator,
              not a guarantee; always verify before relying on one.
            </p>
            <p>The current scale weights the following:</p>
            <ul className="space-y-2 text-[0.9375rem]">
              <li className="grid grid-cols-[8ch_1fr] gap-4 items-baseline">
                <span className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-[var(--ink-mute)]">HTTPS</span>
                <span>Whether the entry URL is encrypted (+20).</span>
              </li>
              <li className="grid grid-cols-[8ch_1fr] gap-4 items-baseline">
                <span className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-[var(--ink-mute)]">meta</span>
                <span>Auth, HTTPS-only, and CORS tags present (+10 each).</span>
              </li>
              <li className="grid grid-cols-[8ch_1fr] gap-4 items-baseline">
                <span className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-[var(--ink-mute)]">docs</span>
                <span>URL suggests a documentation route (+5).</span>
              </li>
              <li className="grid grid-cols-[8ch_1fr] gap-4 items-baseline">
                <span className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-[var(--ink-mute)]">desc</span>
                <span>Up to +25 for a real description.</span>
              </li>
            </ul>
          </div>

          <aside>
            <p className="eyebrow mb-4">Grades</p>
            <table className="w-full font-mono text-[0.75rem] tracking-[0.04em]">
              <tbody>
                {[
                  ["A", "85+", "well-documented, encrypted"],
                  ["B", "70+", "mostly complete"],
                  ["C", "55+", "usable, sparse"],
                  ["D", "40+", "thin metadata"],
                  ["F", "<40", "scored but bare"],
                ].map(([g, r, note]) => (
                  <tr key={g} className="border-b border-[var(--rule)]">
                    <td className="py-2 pr-4 font-medium" style={{ color: `var(--grade-${(g as string).toLowerCase()})` }}>{g}</td>
                    <td className="py-2 pr-4 tabular-nums text-[var(--ink-mute)]">{r}</td>
                    <td className="py-2 text-[var(--ink-soft)]">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </aside>
        </div>
      </Section>

      <div className="mt-20 mb-8">
        <Hairline />
      </div>
    </div>
  )
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-[0.95] tracking-[-0.025em] tabular-nums text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-2 eyebrow">{label}</p>
    </div>
  )
}
