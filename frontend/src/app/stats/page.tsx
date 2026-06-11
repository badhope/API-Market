import type { Metadata } from "next"
import { loadStats } from "@/lib/data-server"
import { formatCount, formatDate, roman } from "@/lib/format"
import { Hairline } from "@/components/codex/hairline"
import { HairlineBar } from "@/components/codex/hairline-bar"
import { RingMeter } from "@/components/codex/ring-meter"

export const metadata: Metadata = {
  title: "Statistics",
  description: "Grade distribution, metadata coverage, and upstream sources for the API codex.",
}

export default async function StatsPage() {
  const stats = await loadStats()
  const gradeOrder = ["A", "B", "C", "D", "F"]
  const gradeMax = Math.max(...gradeOrder.map((g) => stats.grade_distribution[g] ?? 0), 1)
  const gradeTotal = gradeOrder.reduce((acc, g) => acc + (stats.grade_distribution[g] ?? 0), 0)
  const cov = stats.metadata_coverage

  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      <header className="pt-16 sm:pt-24 pb-12">
        <p className="eyebrow mb-6">{roman(1).padStart(2, "0")}. · In numbers</p>
        <h1 className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.98] tracking-[-0.03em] font-medium max-w-[18ch]">
          The codex, by the numbers.
        </h1>
        <p className="mt-6 font-serif text-[1.0625rem] leading-[1.65] text-[var(--ink-soft)] max-w-[60ch]">
          A summary of what the directory contains, how it’s graded, and
          where it came from. Last refreshed{" "}
          <em className="italic">{formatDate(stats.last_updated)}</em>.
        </p>
      </header>

      <Hairline className="mb-2" />

      {/* ─── Big numbers ─────────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-y-12 py-16 border-b border-[var(--rule)]">
        <BigNumber value={formatCount(stats.total_apis)} label="Public APIs" />
        <BigNumber value={String(stats.total_categories)} label="Categories" />
        <BigNumber value={String(stats.sources.length)} label="Upstream sources" />
        <BigNumber value={String(gradeTotal)} label="Scored entries" />
      </section>

      {/* ─── Grade distribution ──────────────────────────── */}
      <section className="py-16 border-b border-[var(--rule)]">
        <p className="eyebrow mb-8">Distribution by grade</p>
        <div>
          {gradeOrder.map((g) => (
            <HairlineBar
              key={g}
              value={stats.grade_distribution[g] ?? 0}
              max={gradeMax}
              label={`Grade ${g}`}
              count={formatCount(stats.grade_distribution[g] ?? 0)}
            />
          ))}
        </div>
      </section>

      {/* ─── Metadata coverage ───────────────────────────── */}
      <section className="py-16 border-b border-[var(--rule)]">
        <p className="eyebrow mb-8">Metadata coverage</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-12">
          <CoverageRing value={cov.https} label="HTTPS only" />
          <CoverageRing value={cov.cors} label="CORS known" />
          <CoverageRing value={cov.auth} label="Auth known" />
          <CoverageRing value={cov.description} label="Described" />
        </div>
      </section>

      {/* ─── Sources ─────────────────────────────────────── */}
      <section className="py-16">
        <p className="eyebrow mb-8">Upstream sources</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-3 font-serif text-[1.0625rem]">
          {stats.sources.map((s) => (
            <li key={s} className="flex items-baseline gap-3 py-1.5 border-b border-[var(--rule)]">
              <span className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-faint)]">↳</span>
              <span className="text-[var(--ink-soft)]">{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-12 font-mono text-[0.625rem] tracking-[0.18em] uppercase text-[var(--ink-faint)] text-center">
        ◇ &nbsp; API-Market · v5 · last refresh {formatDate(stats.last_updated)} &nbsp; ◇
      </p>
    </div>
  )
}

function BigNumber({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-serif text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.95] tracking-[-0.03em] tabular-nums text-[var(--ink)]">
        {value}
      </p>
      <p className="mt-2 eyebrow">{label}</p>
    </div>
  )
}

function CoverageRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <RingMeter value={value} size={72} stroke={2} />
      <p className="eyebrow max-w-[14ch]">{label}</p>
    </div>
  )
}
