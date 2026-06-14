/**
 * publicapis.dev importer — fetches from their curated directory.
 *
 * publicapis.dev is a searchable directory of free public APIs.
 * They provide filtering by auth type, HTTPS support, and CORS.
 *
 * Source: https://publicapis.dev
 */
/* eslint-disable no-console -- CLI importer */
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import type { ScoredApi } from "./score"
import { writeCategories } from "./write"
import { slugifyCategory } from "./public-apis"

const SOURCE_URL = "https://publicapis.dev"
const CACHE_PATH = join("/workspace/API-market/data/.cache", "publicapis-dev.json")

export interface PublicApisDevOptions {
  dataDir?: string
  dryRun?: boolean
}

export interface PublicApisDevResult {
  apis: number
  categories: number
  lastVerified: string
}

interface PublicApisDevEntry {
  name: string
  description: string
  url: string
  category: string
  auth?: string
  https?: boolean
  cors?: boolean
}

/**
 * Fetch publicapis.dev API list.
 * They may expose a JSON endpoint or we need to scrape.
 * For now, we'll try common API patterns.
 */
export async function fetchPublicApisDev(): Promise<PublicApisDevEntry[]> {
  // Try common API endpoints
  const endpoints = [
    "https://publicapis.dev/api/apis",
    "https://publicapis.dev/api/list",
    "https://publicapis.dev/apis.json",
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          "User-Agent": "API-Market importer",
          Accept: "application/json",
        },
      })

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          return data
        }
      }
    } catch {
      // Try next endpoint
      continue
    }
  }

  // If no API endpoint works, return empty array
  // In production, we'd implement scraping here
  console.warn("  ⚠ publicapis.dev: No API endpoint found, returning empty list")
  return []
}

/**
 * Convert publicapis.dev entry to our internal format.
 */
function toScoredApi(entry: PublicApisDevEntry, lastVerified: string): ScoredApi | null {
  if (!entry.name || !entry.url) return null

  const auth = entry.auth?.toLowerCase() || "none"
  const https = entry.https ?? true
  const cors = entry.cors ?? "unknown"

  // Map auth to our schema
  let authField: ScoredApi["auth"] = "none"
  if (auth === "apikey" || auth === "api_key" || auth === "api-key") {
    authField = "apiKey"
  } else if (auth === "oauth" || auth === "oauth2") {
    authField = "oauth2"
  } else if (auth === "x-api-key" || auth === "x-mashape-key") {
    authField = "xAuth"
  } else if (auth === "none" || auth === "no" || auth === "") {
    authField = "none"
  }

  // Calculate quality score
  let qualityScore = 50
  if (authField === "none") qualityScore += 15
  else if (authField === "apiKey") qualityScore += 5
  if (https) qualityScore += 20
  if (cors === true) qualityScore += 10
  if (entry.description && entry.description.length >= 80) qualityScore += 5
  else if (entry.description && entry.description.length >= 30) qualityScore += 2

  const qualityGrade =
    qualityScore >= 90 ? "A" :
    qualityScore >= 75 ? "B" :
    qualityScore >= 60 ? "C" :
    qualityScore >= 40 ? "D" : "F"

  return {
    id: entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 96),
    name: entry.name,
    url: entry.url,
    description: entry.description || "",
    auth: authField,
    https,
    cors: cors === true ? true : cors === false ? false : "unknown",
    source: "publicapis-dev",
    source_url: SOURCE_URL,
    tags: authField !== "none" ? authField : "",
    quality_score: qualityScore,
    quality_grade: qualityGrade,
    deprecated: false,
    last_verified: lastVerified,
  }
}

export async function importPublicApisDev(
  options: PublicApisDevOptions = {},
): Promise<PublicApisDevResult> {
  const dataDir = options.dataDir ?? "/workspace/API-market/data"
  const lastVerified = new Date().toISOString().slice(0, 10)

  console.log("  Fetching publicapis.dev API list...")
  const entries = await fetchPublicApisDev()

  if (entries.length === 0) {
    console.log("  No APIs found (publicapis.dev may not expose a public API)")
    return {
      apis: 0,
      categories: 0,
      lastVerified,
    }
  }

  // Cache for offline replay
  await mkdir(dirname(CACHE_PATH), { recursive: true })
  await writeFile(CACHE_PATH, JSON.stringify(entries, null, 2), "utf8")

  console.log(`  Found ${entries.length} APIs`)

  // Group by category
  const byCategory = new Map<string, ScoredApi[]>()
  for (const entry of entries) {
    const scored = toScoredApi(entry, lastVerified)
    if (!scored) continue

    const slug = slugifyCategory(entry.category || "uncategorized")
    if (!byCategory.has(slug)) {
      byCategory.set(slug, [])
    }
    byCategory.get(slug)!.push(scored)
  }

  // Convert to our format
  const payloads = Array.from(byCategory.entries()).map(([slug, apis], idx) => ({
    displayName: slug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    slug,
    order: idx,
    apis,
  }))

  if (!options.dryRun) {
    await writeCategories(dataDir, payloads)
  }

  return {
    apis: entries.length,
    categories: byCategory.size,
    lastVerified,
  }
}
