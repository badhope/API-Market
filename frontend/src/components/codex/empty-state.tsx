import { Hairline } from "./hairline"
import { cn } from "@/lib/cn"

interface EmptyStateProps {
  title: string
  description?: string
  className?: string
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("py-16 text-center", className)}>
      <Hairline className="mb-10 max-w-xs mx-auto" />
      <p className="font-serif text-[1.5rem] tracking-[-0.01em] text-[var(--ink-soft)]">
        {title}
      </p>
      {description && (
        <p className="mt-3 text-[0.875rem] text-[var(--ink-mute)] max-w-md mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
