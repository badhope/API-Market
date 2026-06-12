/**
 * Multi-source importer orchestrator.
 *
 * Imports APIs from multiple free API directories:
 * - public-apis (GitHub)
 * - saxi.ai
 * - publicapis.dev
 * - apilist.fun
 *
 * Usage:
 *   pnpm tsx scripts/import/run-all.ts [--data <out-dir>] [--dry-run]
 */
/* eslint-disable no-console -- CLI importer */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"

import { importPublicApis } from "./run"
import { importSaxiAi } from "./saxi-ai"
import { importPublicApisDev } from "./publicapis-dev"
import { importApilistFun } from "./apilist-fun"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..", "..", "..")
const DEFAULT_DATA_DIR = join(REPO_ROOT, "data")

export interface ImportAllOptions {
  dataDir?: string
  dryRun?: boolean
  sources?: string[] // If specified, only import these sources
}

export interface ImportAllResult {
  totalApis: number
  totalCategories: number
  sources: Array<{
    id: string
    apis: number
    categories: number
    error?: string
  }>
}

export async function importAll(
  options: ImportAllOptions = {},
): Promise<ImportAllResult> {
  const dataDir = options.dataDir ?? DEFAULT_DATA_DIR
  const sources = options.sources ?? ["public-apis", "saxi-ai", "publicapis-dev", "apilist-fun"]

  const results: ImportAllResult = {
    totalApis: 0,
    totalCategories: 0,
    sources: [],
  }

  for (const source of sources) {
    console.log(`\n━━━ Importing from ${source} ━━━`)
    try {
      let result
      switch (source) {
        case "public-apis":
          result = await importPublicApis({ dataDir, dryRun: options.dryRun })
          results.sources.push({
            id: source,
            apis: result.apis,
            categories: result.categories,
          })
          results.totalApis += result.apis
          results.totalCategories += result.categories
          break

        case "saxi-ai":
          result = await importSaxiAi({ dataDir, dryRun: options.dryRun })
          results.sources.push({
            id: source,
            apis: result.apis,
            categories: result.categories,
          })
          results.totalApis += result.apis
          results.totalCategories += result.categories
          break

        case "publicapis-dev":
          result = await importPublicApisDev({ dataDir, dryRun: options.dryRun })
          results.sources.push({
            id: source,
            apis: result.apis,
            categories: result.categories,
          })
          results.totalApis += result.apis
          results.totalCategories += result.categories
          break

        case "apilist-fun":
          result = await importApilistFun({ dataDir, dryRun: options.dryRun })
          results.sources.push({
            id: source,
            apis: result.apis,
            categories: result.categories,
          })
          results.totalApis += result.apis
          results.totalCategories += result.categories
          break

        default:
          console.warn(`Unknown source: ${source}, skipping`)
      }
    } catch (err) {
      console.error(`✗ ${source} failed:`, err)
      results.sources.push({
        id: source,
        apis: 0,
        categories: 0,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return results
}

/* ------------------------------ CLI ------------------------------ */

const isMain =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const args = process.argv.slice(2)
  const dataIdx = args.indexOf("--data")
  const dataDir = dataIdx >= 0 ? args[dataIdx + 1] : DEFAULT_DATA_DIR
  const dryRun = args.includes("--dry-run")
  const sourcesIdx = args.indexOf("--sources")
  const sources = sourcesIdx >= 0 ? args[sourcesIdx + 1]?.split(",") : undefined

  importAll({ dataDir, dryRun, sources })
    .then((r) => {
      console.log("\n✓ Multi-source import complete")
      console.log(`  total APIs       : ${r.totalApis}`)
      console.log(`  total categories : ${r.totalCategories}`)
      console.log(`  sources          :`)
      for (const s of r.sources) {
        const status = s.error ? `✗ ${s.error}` : `✓ ${s.apis} APIs, ${s.categories} categories`
        console.log(`    - ${s.id}: ${status}`)
      }
      if (!dryRun) {
        console.log(`  data dir         : ${relative(REPO_ROOT, dataDir)}`)
      }
    })
    .catch((err) => {
      console.error("\n✗ Multi-source import failed:\n")
      console.error(err)
      process.exit(1)
    })
}
