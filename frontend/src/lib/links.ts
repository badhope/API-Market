/**
 * Single source of truth for in-app URLs.
 *
 * We statically export the site to `/{repo}/` on GitHub Pages, so every
 * internal link needs the basePath prepended. Next.js's `<Link>` does
 * this automatically, but raw `<a href="...">` (and any string we pass
 * to `router.push`) doesn't — and we have plenty of both. Centralising
 * the prefix here means changing the basePath later is a one-line edit
 * and there is no chance of missing a hardcoded `href="/categories"`
 * that silently 404s on production.
 *
 * External URLs (http/https/mailto/anchor) are returned unchanged.
 */

const RAW_BASE = process.env.NEXT_PUBLIC_BASE_PATH || "/API-Market"
// Strip a trailing slash so `internalHref("/foo")` and
// `internalHref("foo")` produce the same string.
export const BASE_PATH = RAW_BASE.replace(/\/+$/, "")

export function internalHref(path: string): string {
  if (!path) return BASE_PATH || "/"
  // Pass through anything that isn't a relative path.
  if (/^(?:[a-z]+:|\/\/|#)/i.test(path)) return path
  const normalised = path.startsWith("/") ? path : `/${path}`
  return `${BASE_PATH}${normalised}`
}
