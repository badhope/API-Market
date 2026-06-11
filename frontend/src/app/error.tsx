"use client"

import { Hairline } from "@/components/codex/hairline"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10 py-32 text-center">
      <Hairline className="max-w-xs mx-auto mb-12" />
      <p className="eyebrow mb-6 text-[var(--ink-mute)]">Error</p>
      <h1 className="font-serif text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] tracking-[-0.03em] font-medium">
        The book fell off the shelf.
      </h1>
      <p className="mt-6 font-serif text-[1.0625rem] text-[var(--ink-soft)] max-w-md mx-auto">
        Something went wrong while loading this page. Try again.
      </p>
      <button
        onClick={reset}
        className="mt-10 font-mono text-[0.75rem] tracking-[0.14em] uppercase px-4 h-9 border border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition-colors"
      >
        Reload
      </button>
    </div>
  )
}
