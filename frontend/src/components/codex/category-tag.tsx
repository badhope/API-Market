import { cn } from "@/lib/cn"
import { CATEGORY_TAG_FOR } from "@/lib/constants"

export function CategoryTag({
  id,
  className,
  showDot = true,
}: {
  id: string
  className?: string
  showDot?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-[var(--ink-mute)]",
        className
      )}
    >
      {showDot && <span aria-hidden="true" className="size-1 rounded-full bg-[var(--accent)]" />}
      <span>{CATEGORY_TAG_FOR(id)}</span>
    </span>
  )
}
