/**
 * saxi.ai importer — fetches from their open-source API directory.
 *
 * saxi.ai is a curated list of 1,500+ free public APIs, organized
 * for AI agents and developers. Every listing links to real docs
 * and is tagged by auth type, protocol, and capability.
 *
 * Source: https://saxi.ai / https://github.com/alexander-schneider/saxi.ai
 */
/* eslint-disable no-console -- CLI importer */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"

import { score, type ScoredApi } from "./score"
import { groupByCategory, writeCategories } from "./write"
import { slugifyCategory } from "./public-apis"

const SOURCE_URL = "https://saxi.ai"
const CACHE_PATH = join("/workspace/API-market/data/.cache", "saxi-ai.json")

export interface SaxiAiOptions {
  dataDir?: string
  dryRun?: boolean
}

export interface SaxiAiResult {
  apis: number
  categories: number
  lastVerified: string
}

interface SaxiApiEntry {
  name: string
  description: string
  url: string
  category: string
  auth?: string
  https?: boolean
  cors?: boolean
}

/**
 * Fetch saxi.ai API list.
 * They expose data via GitHub repo or their website.
 * For now, we'll parse their public data structure.
 */
export async function fetchSaxiAi(): Promise<SaxiApiEntry[]> {
  const urls = [
    "https://raw.githubusercontent.com/alexander-schneider/saxi.ai/main/data/apis.json",
    "https://raw.githubusercontent.com/alexander-schneider/saxi.ai/main/apis.json",
    "https://saxi.ai/api/apis",
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "API-Market importer",
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      })

      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          return data
        }
      }
    } catch (err) {
      // Try next URL
      continue
    }
  }

  // If all URLs fail, return empty array instead of throwing
  console.warn("  ⚠ saxi.ai: All fetch attempts failed, returning empty list")
  return []
}

/**
 * Convert saxi.ai entry to our internal format.
 */
function toScoredApi(entry: SaxiApiEntry, lastVerified: string): ScoredApi | null {
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
    source: "saxi-ai",
    source_url: SOURCE_URL,
    tags: authField !== "none" ? authField : "",
    quality_score: qualityScore,
    quality_grade: qualityGrade,
    deprecated: false,
    last_verified: lastVerified,
  }
}

export async function importSaxiAi(
  options: SaxiAiOptions = {},
): Promise<SaxiAiResult> {
  const dataDir = options.dataDir ?? "/workspace/API-market/data"
  const lastVerified = new Date().toISOString().slice(0, 10)

  console.log("  Fetching saxi.ai API list...")
  const entries = await fetchSaxiAi()

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
