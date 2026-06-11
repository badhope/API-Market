/**
 * URL helpers. The site can be served from a project page on GitHub
 * Pages (`/API-Market/...`) or a custom domain, and can run with or
 * without a backing API server. Centralise the prefixing logic here
 * so individual pages don't have to think about it.
 */

/**
 * Path prefix the deployed site is served under.
 *
 * The default differs by mode on purpose:
 *   - `production` build assumes a GitHub Pages *project* page
 *     (`<owner>.github.io/<repo>`) unless the operator explicitly
 *     sets `NEXT_PUBLIC_BASE_PATH=""` for a custom domain.
 *   - `development` (next dev) uses an empty prefix so URLs are
 *     just `http://localhost:3000/data/...` — easier to click around
 *     and easier to write Playwright tests against.
 *
 * `NEXT_PUBLIC_BASE_PATH` always wins when set.
 */
const DEFAULT_BASE_PATH =
  process.env.NODE_ENV === "production" ? "/API-Market" : ""

export const BASE_PATH = (
  process.env.NEXT_PUBLIC_BASE_PATH ?? DEFAULT_BASE_PATH
).replace(/\/+$/, "")

/** Build a href that respects the configured basePath. */
export function internalHref(path: string): string {
  if (path.startsWith("http")) return path
  const p = path.startsWith("/") ? path : `/${path}`
  if (p === "/") return `${BASE_PATH}/`
  return `${BASE_PATH}${p}`
}

/** Static data files are written to public/data/*.json. */
export const DATA_PATH = `${BASE_PATH}/data`

/** Reject any non-http(s) URL we get from the database. */
export function safeHref(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.trim()
  if (!s) return null
  if (/[\s\x00-\x1f]/.test(s)) return null // eslint-disable-line no-control-regex -- intentional: reject URL control chars
  const lower = s.toLowerCase()
  if (lower.startsWith("http://") || lower.startsWith("https://")) return s
  return null
}
