/**
 * public-apis source adapter.
 *
 * The upstream (https://github.com/public-apis/public-apis) exposes
 * its list as a Markdown table inside `README.md`. The columns are:
 *
 *     | API | Description | Auth | HTTPS | CORS | Link |
 *
 * The first column is conventionally `[Name](URL)`, but the table is
 * hand-edited and a number of rows are missing the trailing `| Link`
 * cell — so we can't just split on `|`. We parse each cell carefully
 * and fall back to extracting the link from the first column.
 *
 * This module is pure: it does not touch the filesystem. The fetcher
 * and the writer are in their own modules, so we can unit-test the
 * parser against a string fixture.
 */

/* ----------------------------- types ----------------------------- */

/** A single Markdown row, after we've split out the first cell. */
interface PublicApisRow {
  /** Display name (stripped of any surrounding **bold** / `code` markers). */
  name: string
  /** Short description. */
  description: string
  /** Auth column, raw. */
  auth: string
  /** HTTPS column, raw. */
  https: string
  /** CORS column, raw. */
  cors: string
  /** Link column, raw URL if present. */
  link: string
}

/** A parsed row, ready to hand to the scorer. */
export interface ParsedPublicApisEntry {
  name: string
  description: string
  auth: string
  https: string
  cors: string
  /** The canonical URL we should link to. */
  url: string
  /** A second URL, if the table gave us one. */
  altUrl?: string
}

/* --------------------------- parsers ----------------------------- */

/**
 * Strip a Markdown link `[label](url)` and return the label. If the
 * cell is plain text, return it unchanged. The label may itself
 * contain inline formatting (`**bold**`, `` `code` ``); we strip
 * those too so the result is a clean display name.
 */
export function extractLabel(cell: string): string {
  const linkMatch = /^\[([^\]]+)\]\([^)]+\)$/.exec(cell.trim())
  const raw = (linkMatch ? linkMatch[1] : cell).trim()
  return raw
    .replace(/`/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
}

/**
 * Pull a URL out of a cell. The cell can be one of:
 *
 *   `[label](url)`   — Markdown link, e.g. `[Cat Facts](https://…)`
 *   `https://…`      — bare URL (the upstream "Link" column)
 *   anything else    — null
 */
export function extractLink(cell: string): string | null {
  const c = cell.trim()
  if (!c) return null
  const m = /^\[[^\]]+\]\(([^)]+)\)$/.exec(c)
  if (m) return m[1]?.trim() || null
  if (/^https?:\/\/[^\s)]+$/i.test(c)) return c
  return null
}

/**
 * Parse one table row. The row may have 5, 6, or 7 cells:
 *   5: `| [Name](url) | desc | auth | https | cors |`
 *   6: `| [Name](url) | desc | auth | https | cors |  |`
 *   7: `| [Name](url) | desc | auth | https | cors | link |`
 * We accept any of the three and return the same shape.
 */
export function parseRow(line: string): PublicApisRow | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith("|")) return null
  // Drop leading and trailing `|`, then split. `limit = -1` keeps
  // empty trailing cells; `trim()` on each strips the padding spaces.
  const inner = trimmed.replace(/^\|/, "").replace(/\|\s*$/, "")
  const cells = inner.split("|").map((c) => c.trim())
  if (cells.length < 5) return null

  const firstCell = cells[0] ?? ""
  const name = extractLabel(firstCell)
  if (!name) return null

  // The first cell is conventionally `[Name](url)`. The last cell is
  // the explicit "Link" column added to the table later — when both
  // are present, the Link column is the canonical API URL and the
  // first cell is the homepage.
  const firstLink = extractLink(firstCell)
  const lastCell = cells.length >= 2 ? (cells[cells.length - 1] ?? "") : ""
  const lastLink = lastCell ? extractLink(lastCell) : null

  // Prefer the explicit Link column. Fall back to the first cell.
  const link = lastLink ?? firstLink ?? ""

  return {
    name,
    description: (cells[1] ?? "").trim(),
    auth: stripCodeFences((cells[2] ?? "").trim()),
    https: stripCodeFences((cells[3] ?? "").trim()).toLowerCase(),
    cors: stripCodeFences((cells[4] ?? "").trim()).toLowerCase(),
    link,
  }
}

/** Strip surrounding backticks (Markdown `code` markers) and any
 *  stray `*` (`*Yes*` sometimes shows up in the upstream). */
function stripCodeFences(s: string): string {
  return s.replace(/^[`*]+|[`*]+$/g, "").trim()
}

/* ---------------------- document-level parse --------------------- */

/** A category heading from the README. */
export interface RawSection {
  /** The display name as written in the README (e.g. "Art & Design"). */
  name: string
  /** Source line number (1-based) for error messages. */
  line: number
  /** All data rows that follow the heading, in order. */
  rows: PublicApisRow[]
}

/**
 * Walk a public-apis README string and return every section.
 *
 * We split on `### ` headings, then collect every line that looks
 * like a table row. We skip the header line (`| API | ...`) and the
 * separator line (`|:---|:---|`).
 */
export function parseReadme(markdown: string): RawSection[] {
  const lines = markdown.split("\n")
  const sections: RawSection[] = []
  let current: RawSection | null = null
  let inTable = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ""

    // Headings: `### Animals` (the README also has `## Index` etc.
    // higher up — we ignore anything that's not `###`).
    const heading = /^###\s+(.+?)\s*$/.exec(line)
    if (heading) {
      current = { name: heading[1] ?? "", line: i + 1, rows: [] }
      sections.push(current)
      inTable = false
      continue
    }

    if (!current) continue

    // Detect the table header. The upstream format leaves off the
    // leading `|` on the header line (`API | Description | …`) but
    // keeps it on every data row, so we match both shapes.
    if (/^[\s|]*API[\s|]+Description[\s|]+Auth[\s|]+HTTPS[\s|]+CORS/i.test(line)) {
      inTable = true
      continue
    }
    // Skip the `|:---|:---|` separator.
    if (/^\|[\s:|-]+\|?\s*$/.test(line) && inTable) {
      continue
    }
    // A blank line or a new heading ends the table.
    if (!line.trim()) {
      inTable = false
      continue
    }
    if (line.startsWith("#") || line.startsWith("---")) {
      inTable = false
      continue
    }

    if (inTable && line.startsWith("|")) {
      const row = parseRow(line)
      if (row) current.rows.push(row)
    }
  }

  return sections
}

/* ---------------------- row → entry adapter ---------------------- */

/** The shape of one row, after we extract the canonical URL. */
export function toEntry(row: PublicApisRow): ParsedPublicApisEntry | null {
  // Pick the link: explicit Link column wins; otherwise the URL
  // baked into the first cell (the conventional placement).
  const url = row.link || ""
  if (!url) return null
  // Reject obvious non-http(s) entries (e.g. mailto:).
  if (!/^https?:\/\//i.test(url)) return null

  return {
    name: row.name,
    description: row.description,
    auth: row.auth,
    https: row.https,
    cors: row.cors,
    url,
  }
}

/* ---------------------- slug + display_name ---------------------- */

/** Slugify a public-apis category name. */
export function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
}

/** Slugify an API display name into a stable id. */
export function slugifyApiId(name: string, fallbackUrl?: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 96)
  if (slug) return slug
  // Fallback: hash a stable chunk of the URL so duplicates collide
  // predictably across runs.
  if (fallbackUrl) {
    let h = 5381
    for (let i = 0; i < fallbackUrl.length; i++) h = (h * 33) ^ fallbackUrl.charCodeAt(i)
    return `api-${(h >>> 0).toString(36)}`
  }
  return "api"
}
