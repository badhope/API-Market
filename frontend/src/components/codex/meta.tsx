import type { ReactNode } from "react"
import { cn } from "@/lib/cn"

export function MetaRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-y-2 gap-x-8 py-3 border-b border-[var(--rule)] text-[0.875rem]",
        className
      )}
    >
      {children}
    </div>
  )
}

export function MetaLabel({ children }: { children: ReactNode }) {
  return (
    <dt className="eyebrow !text-[0.6875rem] !text-[var(--ink-mute)] sm:self-center">
      {children}
    </dt>
  )
}

export function MetaValue({ children }: { children: ReactNode }) {
  return <dd className="text-[var(--ink-soft)] leading-relaxed">{children}</dd>
}
