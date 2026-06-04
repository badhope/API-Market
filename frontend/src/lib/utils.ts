import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_ICONS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function formatDate(dateStr: string | null, locale?: string): string {
  if (!dateStr) return "N/A"
  const localeMap: Record<string, string> = {
    zh: "zh-CN",
    ja: "ja-JP",
    en: "en-US",
  }
  const intlLocale = localeMap[locale ?? "en"] || "en-US"
  // Backend stores naive ISO text (UTC). Without `Z` (or an explicit
  // offset) `new Date(...)` parses the string as local time, which
  // shifts the rendered day by ±1 for users outside UTC. Normalise
  // here so all callers get a consistent UTC interpretation.
  const normalised = /Z$|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : `${dateStr}Z`
  return new Date(normalised).toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getGradeColor(grade: string | null): string {
  if (!grade) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  const colors: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    F: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  }
  return colors[grade] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
}

export function getCategoryIcon(categoryId: string): string {
  return CATEGORY_ICONS[categoryId] || "📦"
}

/**
 * Return the URL if it is safe to render in an `href` (http or https), or
 * `null` otherwise. Use this whenever we bind a string from the database to
 * `<a href={…}>` so a malicious or scraped `javascript:` / `data:` payload
 * cannot turn into XSS.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Reject any control / whitespace character that some browsers treat as a
  // scheme terminator (`java\tscript:`, `java\nscript:`, etc.).
  if (/[\s\x00-\x1f]/.test(trimmed)) return null
  const lower = trimmed.toLowerCase()
  if (lower.startsWith("http://") || lower.startsWith("https://")) {
    return trimmed
  }
  return null
}

/**
 * Best-effort mapping from the raw `source` string we store on each API to
 * a clickable URL on the public-web Stats page. The collector writes source
 * in many inconsistent shapes — `Owner/Repo`, `github:Owner/Repo`,
 * `github.com/Owner/Repo`, bare domains (`apis.guru`), and the occasional
 * junk filename leaked from a JSON snapshot — so we normalise here instead
 * of trying to clean the database.
 *
 * Returns `null` for anything we cannot prove is a safe http(s) URL.
 */
export function sourceHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s) return null
  if (/[\s\x00-\x1f]/.test(s)) return null
  // 1. Already a URL.
  if (/^https?:\/\//i.test(s)) {
    return safeHref(s)
  }
  // 2. Explicit `github:` / `github.com/` prefix.
  const ghPrefix = s.match(/^github(?:\.com)?[:/](.*)$/i)
  if (ghPrefix && ghPrefix[1]) {
    const rest = ghPrefix[1].replace(/^\/+/, "")
    if (isGithubRepoPath(rest)) return `https://github.com/${rest}`
    return null
  }
  // 3. `owner/repo` (single slash, no scheme) → GitHub repo.
  if (s.includes("/") && !s.includes(":")) {
    if (isGithubRepoPath(s)) return `https://github.com/${s}`
    return null
  }
  // 4. Bare domain (e.g. `apis.guru`, `publicapis.io`, `dev.publicapis.dev`).
  //    Reject things that look like a filename (no TLD, contains a dot in a
  //    weird position, ends with `.json`, etc.).
  if (/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(s)) {
    if (/\.json$/i.test(s)) return null
    return `https://${s}`
  }
  return null
}

function isGithubRepoPath(s: string): boolean {
  const parts = s.split("/")
  if (parts.length !== 2) return false
  const [owner, repo] = parts
  if (!owner || !repo) return false
  // GitHub owner: 1-39 chars, alnum + single hyphens, no leading/trailing hyphen.
  // GitHub repo: 1-100 chars, alnum + . _ -.
  const ownerOk = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner)
  const repoOk = /^[A-Za-z0-9._-]{1,100}$/.test(repo)
  return ownerOk && repoOk
}
