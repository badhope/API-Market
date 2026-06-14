import { cn } from "@/lib/cn"

interface HairlineBarProps {
  value: number
  max: number
  /** A short label rendered to the left of the bar. */
  label?: string
  /** Show the absolute count after the bar. */
  count?: number | string
  className?: string
}

/**
 * A 1px-tall bar drawn in pure CSS. Used for the grade distribution
 * chart. The fill is solid ink, the track is paper-deep, the rule
 * above and below the bar is hairline.
 */
export function HairlineBar({ value, max, label, count, className }: HairlineBarProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className={cn("grid grid-cols-[12rem_1fr_auto] items-center gap-x-6 py-2.5", className)}>
      {label && (
        <span className="font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] truncate">
          {label}
        </span>
      )}
      <div className="relative h-px bg-[var(--rule)]">
        <div
          className="absolute top-0 left-0 h-px bg-[var(--ink)] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      {count != null && (
        <span className="font-mono text-[0.75rem] tabular-nums text-[var(--ink-soft)] whitespace-nowrap">
          {count}
        </span>
      )}
    </div>
  )
}
