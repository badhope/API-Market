/**
 * Quality-score heuristic for imported APIs.
 *
 * Public-apis gives us three orthogonal signals (auth, https, cors)
 * and a description. We turn those into a 0-100 score and then
 * delegate the A/B/C/D/F bucket to the same `scoreToGrade` we use
 * everywhere else.
 *
 * The point isn't to rank APIs against each other — it's to give the
 * reader a quick read on "how much of the obvious metadata do we
 * have?". A high score means "this is the kind of entry that we
 * could comfortably deep-link to". A low score means "thin entry,
 * browse at your own risk".
 */
import { scoreToGrade, type Grade } from "../../src/schemas/index"
import type { ParsedPublicApisEntry } from "./public-apis"

const SOURCE_TAG = "public-apis"

/** Stable, public shape we hand back. */
export interface ScoredApi {
  id: string
  name: string
  url: string
  description: string
  auth: "none" | "apiKey" | "oauth2" | "xAuth" | "xAuth+apiKey"
  https: boolean | null
  cors: boolean | "unknown" | null
  source: string
  source_url: string | null
  /** Comma-separated list. We hand it to the schema as-is; the
   *  schema's `tags` field is a string, not an array, so the split
   *  is the consumer's job. */
  tags: string
  quality_score: number
  quality_grade: Grade
  deprecated: false
  last_verified: string
}

/* --------------------------- auth mapping --------------------------- */

/**
 * public-apis has 5 well-defined values plus a couple of edge cases:
 *
 *   `no`                    — no auth
 *   `apiKey`                — query / header API key
 *   `OAuth`                 — OAuth 2.0
 *   `X-Mashape-Key`         — legacy Mashape / RapidAPI header
 *   `apiKey|userId`         — public-apis syntax for "key + user id"
 *   (anything else)         — coerced to `xAuth` and recorded as a tag
 *
 * The schema in `@/schemas/api` is the source of truth.
 */
export function mapAuth(raw: string): {
  auth: ScoredApi["auth"]
  tags: string[]
} {
  const tags: string[] = []
  const v = raw.trim().toLowerCase()
  if (!v || v === "no" || v === "none") {
    return { auth: "none", tags: [] }
  }
  if (v === "apikey" || v === "api_key") {
    return { auth: "apiKey", tags: ["apiKey"] }
  }
  if (v === "oauth" || v === "oauth2") {
    return { auth: "oauth2", tags: ["oauth"] }
  }
  if (v === "x-mashape-key" || v === "x-api-key") {
    return { auth: "xAuth", tags: ["xAuth"] }
  }
  if (v.includes("|")) {
    // `apiKey|userId` style — treat as a key plus a username.
    tags.push("userId")
    return { auth: "apiKey", tags: ["apiKey", ...tags] }
  }
  // Unknown / custom header — record the raw value as a tag.
  return { auth: "xAuth", tags: [v.replace(/[^a-z0-9-]/g, "")] }
}

/* --------------------------- https/cors --------------------------- */

export function mapHttps(raw: string): boolean | null {
  const v = raw.trim().toLowerCase()
  if (v === "yes" || v === "true") return true
  if (v === "no" || v === "false") return false
  return null
}

export function mapCors(raw: string): boolean | "unknown" | null {
  const v = raw.trim().toLowerCase()
  if (v === "yes" || v === "true") return true
  if (v === "no" || v === "false") return false
  if (v === "unknown") return "unknown"
  return null
}

/* --------------------------- score formula --------------------------- */

/** Return a 0-100 score from the obvious signals. */
export function scoreEntry(entry: ParsedPublicApisEntry): number {
  let s = 50
  // Auth: `no` is friendliest.
  const v = entry.auth.trim().toLowerCase()
  if (!v || v === "no" || v === "none") s += 15
  else if (v === "apikey" || v === "api_key") s += 5
  else if (v === "oauth" || v === "oauth2") s += 0
  else s -= 5
  // HTTPS: a hard requirement in 2026.
  if (entry.https === "yes") s += 20
  else if (entry.https === "no") s -= 15
  // CORS: tells the reader whether they can hit it from the browser.
  if (entry.cors === "yes") s += 10
  else if (entry.cors === "no") s -= 5
  // Description: longer = more likely to be hand-curated.
  const d = entry.description.trim()
  if (d.length >= 80) s += 5
  else if (d.length >= 30) s += 2
  else if (d.length === 0) s -= 5
  return Math.max(0, Math.min(100, s))
}

/* --------------------------- top-level ------------------------------ */

export interface ScoreOptions {
  /** ISO date (YYYY-MM-DD) to stamp on every record. */
  lastVerified: string
  /** Default upstream URL — for the public-apis repo. */
  sourceUrl?: string
}

/** Convert a parsed entry into the shape our Zod schema expects. */
export function score(
  entry: ParsedPublicApisEntry,
  options: ScoreOptions,
): ScoredApi {
  const { auth, tags: authTags } = mapAuth(entry.auth)
  const https = mapHttps(entry.https)
  const cors = mapCors(entry.cors)
  const quality_score = scoreEntry(entry)
  const quality_grade = scoreToGrade(quality_score)

  return {
    id: entry.name, // the writer is responsible for slugifying + dedup
    name: entry.name,
    url: entry.url,
    description: entry.description.trim().slice(0, 500),
    auth,
    https,
    cors,
    source: SOURCE_TAG,
    source_url: options.sourceUrl ?? "https://github.com/public-apis/public-apis",
    tags: authTags.join(","),
    quality_score,
    quality_grade,
    deprecated: false,
    last_verified: options.lastVerified,
  }
}