import Link from "next/link"
import type { ApiSummary } from "@/types"
import { cn } from "@/lib/cn"
import { indexNum, truncate } from "@/lib/format"
import { internalHref, safeHref } from "@/lib/links"
import { GradeBadge } from "./grade-badge"
import { CategoryTag } from "./category-tag"

interface ApiCardProps {
  api: ApiSummary
  /** Global index used to compute the printed-card number. */
  index?: number
  /** Optional total — pads the index to the same width. */
  total?: number
  className?: string
}

/**
 * The asymmetric API card. Three columns:
 *   [monospace #001]  [name + desc + source]  [grade]
 * On hover the index turns vermillion. No shadow, no scale, no border
 * lift — just a hairline underline on the name. The visual language
 * of a library catalog card.
 */
export function ApiCard({ api, index, total, className }: ApiCardProps) {
  const href = safeHref(api.url) ?? internalHref(`/apis/${api.id}`)
  const external = href.startsWith("http")
  const num = index != null ? `#${indexNum(index, total ?? index)}` : null

  return (
    <article
      className={cn(
        "group relative grid grid-cols-[3.5rem_1fr_auto] gap-x-5 items-baseline py-5 border-b border-[var(--rule)]",
        className
      )}
    >
      {/* Index */}
      <div
        className="font-mono text-[0.6875rem] tracking-[0.12em] text-[var(--ink-faint)] tabular-nums pt-0.5 transition-colors duration-200 group-hover:text-[var(--accent)]"
        aria-hidden="true"
      >
        {num ?? "····"}
      </div>

      {/* Name + meta */}
      <div className="min-w-0">
        {external ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-serif text-[1.125rem] leading-normal tracking-[-0.01em] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors py-1"
          >
            {api.name}
          </a>
        ) : (
          <Link
            href={href}
            className="inline-block font-serif text-[1.125rem] leading-normal tracking-[-0.01em] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors py-1"
          >
            {api.name}
          </Link>
        )}
        {api.description && (
          <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--ink-mute)] max-w-[60ch]">
            {truncate(api.description, 140)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[0.6875rem] tracking-[0.08em] uppercase text-[var(--ink-faint)]">
          <CategoryTag id={api.category_id} />
          {api.source && (
            <span className="truncate max-w-[18ch]" title={api.source}>
              ↳ {api.source}
            </span>
          )}
          <span className="hidden sm:inline">
            {api.https === true ? "https" : api.https === false ? "http" : "—"}
          </span>
          <span className="hidden sm:inline">
            {api.cors === true ? "cors" : api.cors === false ? "no-cors" : "—"}
          </span>
          <span className="hidden md:inline">
            {api.auth ? api.auth : "no-auth"}
          </span>
        </div>
      </div>

      {/* Grade */}
      <div className="self-baseline">
        <GradeBadge grade={api.quality_grade} score={api.quality_score} />
      </div>
    </article>
  )
}
