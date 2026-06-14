"use client"

import { useState } from "react"
import { cn } from "@/lib/cn"
import { CopyButton } from "./copy-button"
import type { CodeSamples } from "@/lib/code-gen"

interface CodeTabsProps {
  samples: CodeSamples
  className?: string
}

const TABS: Array<{ id: keyof CodeSamples; label: string }> = [
  { id: "curl",   label: "curl" },
  { id: "fetch",  label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "go",     label: "Go" },
]

export function CodeTabs({ samples, className }: CodeTabsProps) {
  const [active, setActive] = useState<keyof CodeSamples>("curl")
  const value = samples[active]

  return (
    <div
      className={cn(
        "border border-[var(--rule)] bg-[var(--paper-soft)]/40",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--rule)] gap-2">
        <div
          role="tablist"
          aria-label="Code sample language"
          className="flex overflow-x-auto"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active === t.id}
              aria-controls={`code-panel-${t.id}`}
              id={`code-tab-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                "shrink-0 px-3 sm:px-4 py-2.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase transition-colors",
                "border-r border-[var(--rule)] last:border-r-0",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]",
                active === t.id
                  ? "text-[var(--ink)] bg-[var(--paper-deep)]/40"
                  : "text-[var(--ink-mute)] hover:text-[var(--ink)]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="px-2 shrink-0">
          <CopyButton value={value} />
        </div>
      </div>
      <pre
        id={`code-panel-${active}`}
        role="tabpanel"
        aria-labelledby={`code-tab-${active}`}
        className="overflow-x-auto p-5 text-[0.8125rem] leading-[1.65] font-mono text-[var(--ink-soft)]"
      >
        <code>{value}</code>
      </pre>
    </div>
  )
}
