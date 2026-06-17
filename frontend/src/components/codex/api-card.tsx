import { memo } from "react"
import Link from "next/link"
import type { ApiSummary } from "@/types"
import { cn } from "@/lib/cn"
import { indexNum, truncate } from "@/lib/format"
import { internalHref } from "@/lib/links"
import { GradeBadge } from "./grade-badge"
import { CategoryTag } from "./category-tag"
import { CategoryIcon } from "./category-icon"

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
 *
 * Memoised: rendered in long lists (search results up to 200 items,
 * category pages up to 50/page). Parent filter state changes
 * shouldn't re-render cards whose props are unchanged.
 */
export const ApiCard = memo(function ApiCard({ api, index, total, className }: ApiCardProps) {
  // Always link to internal detail page — external URLs are accessible
  // from the detail page via a "Visit" button. This keeps users on our
  // site and lets them read our curated introduction first.
  const href = internalHref(`/apis/${api.id}`)
  const num = index != null ? `#${indexNum(index, total ?? index)}` : null

  return (
    <article
      className={cn(
        "group relative grid gap-x-4 gap-y-2 py-5 border-b border-[var(--rule)]",
        "hover:bg-[var(--paper-soft)]/40 transition-all duration-200 -mx-3 px-3",
        // Mobile: stack layout for better readability
        "grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[3.5rem_1fr_auto]",
        className
      )}
      aria-label={`API: ${api.name}`}
    >
      {/* Index */}
      <div
        className="font-mono text-[0.625rem] sm:text-[0.6875rem] tracking-[0.12em] text-[var(--ink-faint)] tabular-nums pt-0.5 transition-colors duration-200 group-hover:text-[var(--accent)]"
        aria-hidden="true"
      >
        {num ?? "····"}
      </div>

      {/* Name + meta */}
      <div className="min-w-0 col-span-1">
        <Link
          href={href}
          className="inline-block font-serif text-[1rem] sm:text-[1.125rem] leading-normal tracking-[-0.01em] text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors py-1"
          aria-label={`View details for ${api.name}`}
        >
          {api.name}
        </Link>
        {api.description && (
          <p className="mt-1 text-[0.8125rem] sm:text-[0.875rem] leading-relaxed text-[var(--ink-mute)] max-w-[60ch]">
            {truncate(api.description, 140)}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 font-mono text-[0.625rem] sm:text-[0.6875rem] tracking-[0.08em] uppercase text-[var(--ink-faint)]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 rounded bg-[var(--paper-soft)] group-hover:bg-[var(--accent)]/10 transition-colors">
              <CategoryIcon categoryId={api.category_id} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[var(--ink-mute)] group-hover:text-[var(--accent)] transition-colors" />
            </div>
            <CategoryTag id={api.category_id} />
          </div>
          {api.source && (
            <span className="truncate max-w-[14ch] sm:max-w-[18ch]" title={api.source}>
              ↳ {api.source}
            </span>
          )}
          <span className="hidden sm:inline" aria-label={`Protocol: ${api.https === true ? "HTTPS" : api.https === false ? "HTTP" : "unknown"}`}>
            {api.https === true ? "https" : api.https === false ? "http" : "—"}
          </span>
          <span className="hidden sm:inline" aria-label={`CORS: ${api.cors === true ? "enabled" : api.cors === false ? "disabled" : "unknown"}`}>
            {api.cors === true ? "cors" : api.cors === false ? "no-cors" : "—"}
          </span>
          <span className="hidden md:inline" aria-label={`Authentication: ${api.auth || "none required"}`}>
            {api.auth ? api.auth : "no-auth"}
          </span>
        </div>
      </div>

      {/* Grade */}
      <div className="self-baseline justify-self-end">
        <GradeBadge grade={api.quality_grade} score={api.quality_score} />
      </div>
    </article>
  )
})
