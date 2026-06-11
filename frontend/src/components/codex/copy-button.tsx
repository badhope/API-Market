"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { cn } from "@/lib/cn"

interface CopyButtonProps {
  value: string
  className?: string
  children?: ReactNode
}

export function CopyButton({ value, className, children }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      // Fallback: select-then-copy via a hidden textarea
      const ta = document.createElement("textarea")
      ta.value = value
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand("copy") } finally { document.body.removeChild(ta) }
    }
    setCopied(true)
  }, [value])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className={cn(
        "group/btn inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase px-2.5 py-1.5 transition-colors",
        "text-[var(--ink-mute)] hover:text-[var(--accent)]",
        "border border-[var(--rule)]",
        copied && "text-[var(--accent)]",
        className
      )}
    >
      {children ?? (
        <>
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </>
      )}
    </button>
  )
}
