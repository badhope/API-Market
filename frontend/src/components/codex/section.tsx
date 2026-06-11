import type { ReactNode } from "react"
import { roman } from "@/lib/format"
import { cn } from "@/lib/cn"
import { Hairline } from "./hairline"

interface SectionProps {
  /** Section index for the editorial running head (1-based). */
  index: number
  /** Eyebrow text above the title. */
  eyebrow?: string
  /** Main title. */
  title: string
  /** Optional right-aligned meta (count, date, etc.). */
  meta?: ReactNode
  children?: ReactNode
  className?: string
}

/**
 * A section header that feels like a chapter divider in a printed
 * almanac. Big Roman numeral on the left, title in Fraunces serif,
 * meta on the right, hairline above. Used on every page.
 */
export function Section({ index, eyebrow, title, meta, children, className }: SectionProps) {
  return (
    <section className={cn("py-16 first:pt-0", className)}>
      <Hairline className="mb-8" />
      <header className="grid grid-cols-[auto_1fr_auto] items-end gap-x-6 gap-y-2">
        <span
          className="font-mono text-[0.6875rem] tracking-[0.18em] text-[var(--ink-mute)] uppercase"
          aria-hidden="true"
        >
          {roman(index).padStart(2, "0")}.
        </span>
        <div>
          {eyebrow && (
            <p className="eyebrow mb-2">{eyebrow}</p>
          )}
          <h2 className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-[1.1] tracking-[-0.02em]">
            {title}
          </h2>
        </div>
        {meta && (
          <div className="font-mono text-[0.6875rem] tracking-[0.12em] text-[var(--ink-mute)] uppercase text-right">
            {meta}
          </div>
        )}
      </header>
      {children && <div className="mt-10">{children}</div>}
    </section>
  )
}
