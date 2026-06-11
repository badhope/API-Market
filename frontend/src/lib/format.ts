/**
 * Display-formatting helpers. These are presentation-only; the raw
 * number is always available from the source.
 */

/** "14,405" / "8.3K" / "1.2M" — chosen to feel like a printed almanac. */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  // 4-digit+ reads better than "14.4K"
  if (n >= 10_000) return n.toLocaleString("en-US")
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("en-US")
}

/** Always three digits with leading zeros — for the editorial index numerals. */
export function indexNum(n: number, total: number): string {
  const w = String(total).length
  return String(n).padStart(Math.max(3, w), "0")
}

/** Roman numerals — for the section headers ("I.", "II.", "III."). */
export function roman(n: number): string {
  const map: Array<[number, string]> = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ]
  let out = ""
  let r = n
  for (const [v, s] of map) {
    while (r >= v) { out += s; r -= v }
  }
  return out
}

/** Map ISO date string to "12 Mar 2024" / "N/A". Backend stores UTC, naive ISO. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const normalised = /Z$|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : `${dateStr}Z`
  const d = new Date(normalised)
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "2-digit" })
}

/** Truncate a description to N chars, ending on a word boundary. */
export function truncate(s: string, n = 160): string {
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  const last = cut.lastIndexOf(" ")
  return (last > 0 ? cut.slice(0, last) : cut) + "…"
}
