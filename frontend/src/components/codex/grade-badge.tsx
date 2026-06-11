import { cn } from "@/lib/cn"

const GRADE_STYLE: Record<string, { fg: string; bg: string; ring: string }> = {
  A: { fg: "var(--grade-a)", bg: "color-mix(in oklch, var(--grade-a) 8%, transparent)", ring: "color-mix(in oklch, var(--grade-a) 24%, transparent)" },
  B: { fg: "var(--grade-b)", bg: "color-mix(in oklch, var(--grade-b) 8%, transparent)", ring: "color-mix(in oklch, var(--grade-b) 24%, transparent)" },
  C: { fg: "var(--grade-c)", bg: "color-mix(in oklch, var(--grade-c) 8%, transparent)", ring: "color-mix(in oklch, var(--grade-c) 24%, transparent)" },
  D: { fg: "var(--grade-d)", bg: "color-mix(in oklch, var(--grade-d) 8%, transparent)", ring: "color-mix(in oklch, var(--grade-d) 24%, transparent)" },
  F: { fg: "var(--grade-f)", bg: "color-mix(in oklch, var(--grade-f) 8%, transparent)", ring: "color-mix(in oklch, var(--grade-f) 24%, transparent)" },
}

export function GradeBadge({
  grade,
  score,
  size = "md",
  className,
}: {
  grade: string | null
  score?: number | null
  size?: "sm" | "md"
  className?: string
}) {
  const s = (grade && GRADE_STYLE[grade]) ?? null
  if (!s) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[0.6875rem] tracking-[0.12em] uppercase text-[var(--ink-mute)]",
          className
        )}
      >
        <span aria-hidden="true">—</span>
        <span>unscored</span>
      </span>
    )
  }
  const px = size === "sm" ? "px-1.5 py-0.5 text-[0.625rem]" : "px-2 py-0.5 text-[0.6875rem]"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] font-medium",
        px,
        className
      )}
      style={{ color: s.fg, background: s.bg, boxShadow: `inset 0 0 0 1px ${s.ring}` }}
      aria-label={score != null ? `Grade ${grade}, score ${score}` : `Grade ${grade}`}
    >
      <span aria-hidden="true">{grade}</span>
      {score != null && (
        <>
          <span className="opacity-40" aria-hidden="true">·</span>
          <span className="tabular-nums">{score}</span>
        </>
      )}
    </span>
  )
}
