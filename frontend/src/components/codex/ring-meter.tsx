import { cn } from "@/lib/cn"

interface RingMeterProps {
  /** 0–100 */
  value: number
  size?: number
  stroke?: number
  className?: string
  label?: string
}

/**
 * A hairline ring with a single arc — quality meter. The arc is
 * drawn with `stroke-dasharray` and `stroke-dashoffset` so the
 * colour is the accent (vermillion) on a paper-deep base. No
 * gradient, no glow.
 */
export function RingMeter({ value, size = 64, stroke = 2, className, label }: RingMeterProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(100, value))
  const dash = (v / 100) * c

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--paper-deep)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.2, 0, 0, 1)" }}
          />
        </svg>
        <div
          className="absolute inset-0 grid place-items-center font-mono text-[0.6875rem] tabular-nums tracking-tight"
          aria-label={label ?? `${Math.round(v)} of 100`}
        >
          {Math.round(v)}
        </div>
      </div>
    </div>
  )
}
