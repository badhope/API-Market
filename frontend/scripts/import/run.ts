/**
 * public-apis importer — CLI orchestrator.
 *
 *   pnpm tsx scripts/import/run.ts [--in <readme-path>] [--data <out-dir>]
 *
 * Without `--in`, we fetch the README from the public-apis GitHub
 * repo on the fly. With `--in`, we read a local copy (useful for
 * tests and for running offline against a known-good snapshot).
 */
/* eslint-disable no-console -- This is a CLI importer; its job is to print. */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import {
  parseReadme,
  toEntry,
  type ParsedPublicApisEntry,
} from "./public-apis"
import { score, type ScoredApi, type ScoreOptions } from "./score"
import { groupByCategory, writeCategories } from "./write"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..", "..", "..")
const DEFAULT_DATA_DIR = join(REPO_ROOT, "data")
const CACHE_PATH = join(REPO_ROOT, "data", ".cache", "public-apis-README.md")

const UPSTREAM_URL =
  "https://api.github.com/repos/public-apis/public-apis/contents/README.md"
const SOURCE_URL = "https://github.com/public-apis/public-apis"

/* ----------------------------- fetch ----------------------------- */

/**
 * Fetch the public-apis README from GitHub's API. We use the API
 * rather than `raw.githubusercontent.com` because the API works
 * behind more firewalls and returns the raw bytes when the right
 * `Accept` header is set.
 */
export async function fetchReadme(): Promise<string> {
  const res = await fetch(UPSTREAM_URL, {
    headers: {
      Accept: "application/vnd.github.raw",
      "User-Agent": "API-Market importer",
    },
  })
  if (!res.ok) {
    throw new Error(
      `public-apis fetch failed: ${res.status} ${res.statusText} ${UPSTREAM_URL}`,
    )
  }
  return res.text()
}

/* ----------------------------- pipeline --------------------------- */

export interface ImportOptions {
  /** Path to a local README copy. If unset, we fetch. */
  input?: string
  /** Output data dir. */
  dataDir?: string
  /** Skip the actual file writes (for dry-runs / tests). */
  dryRun?: boolean
}

export interface ImportResult {
  source: string
  sections: number
  rows: number
  apis: number
  categories: number
  lastVerified: string
}

export async function importPublicApis(
  options: ImportOptions = {},
): Promise<ImportResult> {
  const dataDir = options.dataDir ?? DEFAULT_DATA_DIR
  const lastVerified = new Date().toISOString().slice(0, 10)

  let readme: string
  let source: string
  if (options.input) {
    readme = await readFile(options.input, "utf8")
    source = `local:${options.input}`
  } else {
    readme = await fetchReadme()
    source = UPSTREAM_URL
    // Always cache a copy so the next run can be replayed offline.
    await mkdir(dirname(CACHE_PATH), { recursive: true })
    await writeFile(CACHE_PATH, readme, "utf8")
  }

  const sections = parseReadme(readme)
  let totalRows = 0
  for (const s of sections) totalRows += s.rows.length

  // Build a tiny adapter so the writer doesn't need to know about
  // ParsedPublicApisEntry / ScoredApi distinction.
  const toScored = (row: {
    name: string
    description: string
    auth: string
    https: string
    cors: string
    link: string
  }): ScoredApi | null => {
    const parsed: ParsedPublicApisEntry | null = toEntry(row)
    if (!parsed) return null
    return score(parsed, { lastVerified, sourceUrl: SOURCE_URL } satisfies ScoreOptions)
  }

  const payloads = groupByCategory(sections, { lastVerified, sourceUrl: SOURCE_URL }, toScored)
  const totalApis = payloads.reduce((n, p) => n + p.apis.length, 0)

  if (!options.dryRun) {
    const { written } = await writeCategories(dataDir, payloads)
    return {
      source,
      sections: sections.length,
      rows: totalRows,
      apis: totalApis,
      categories: written,
      lastVerified,
    }
  }
  return {
    source,
    sections: sections.length,
    rows: totalRows,
    apis: totalApis,
    categories: payloads.length,
    lastVerified,
  }
}

/* ------------------------------ CLI ------------------------------ */

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf("--in")
  const dataIdx = args.indexOf("--data")
  const input = inputIdx >= 0 ? args[inputIdx + 1] : undefined
  const dataDir = dataIdx >= 0 ? args[dataIdx + 1] : DEFAULT_DATA_DIR
  const dryRun = args.includes("--dry-run")

  importPublicApis({ input, dataDir, dryRun })
    .then((r) => {
      console.log("\n✓ public-apis import done")
      console.log(`  source     : ${r.source}`)
      console.log(`  last run   : ${r.lastVerified}`)
      console.log(`  sections   : ${r.sections}`)
      console.log(`  rows       : ${r.rows}`)
      console.log(`  apis       : ${r.apis}`)
      console.log(`  categories : ${r.categories}`)
      console.log(`  data dir   : ${relative(REPO_ROOT, dataDir)}`)
    })
    .catch((err) => {
      console.error("\n✗ public-apis import failed:\n")
      console.error(err)
      process.exit(1)
    })
}
