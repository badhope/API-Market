/* eslint-disable no-console -- This is a CLI script; its job is to print. */
import { glob } from "tinyglobby"
import { parse as parseToml } from "smol-toml"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, basename, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { create, insertMultiple, save } from "@orama/orama"

import {
  ApiRecordSchema,
  CategoryMetaSchema,
  scoreToGrade,
  splitTags,
  toApiView,
  type ApiRecord,
  type ApiView,
  type CategoryMeta,
  type Grade,
} from "../src/schemas/index"

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, "..", "..")
const DATA_DIR = join(REPO_ROOT, "data")
const OUT_DIR = join(REPO_ROOT, "frontend", "public", "data")

const VERSION = "6.0.0"

/* -------------------------------------------------------------------- */
/* step 1 — read category metadata                                      */
/* -------------------------------------------------------------------- */

export async function loadCategories(dataDir: string): Promise<CategoryMeta[]> {
  const paths = await glob("categories/*/meta.toml", {
    cwd: dataDir,
    absolute: true,
  })
  if (paths.length === 0) {
    console.warn("  no category meta.toml found under data/categories/")
    return []
  }
  const out: CategoryMeta[] = []
  for (const p of paths) {
    const text = await readFile(p, "utf8")
    const parsed = parseToml(text)
    const { meta } = parsed as { meta: unknown }
    const cat = CategoryMetaSchema.parse(meta)
    const dirId = basename(dirname(p))
    if (dirId !== cat.id) {
      throw new Error(
        `${p}: directory "${dirId}" doesn't match meta.id "${cat.id}"`,
      )
    }
    out.push(cat)
  }
  out.sort(
    (a, b) => a.order - b.order || a.display_name.localeCompare(b.display_name),
  )
  return out
}

/* -------------------------------------------------------------------- */
/* step 2 — read + validate API records                                 */
/* -------------------------------------------------------------------- */

export async function loadApis(
  categories: CategoryMeta[],
  dataDir: string,
): Promise<Map<string, ApiRecord[]>> {
  const knownIds = new Set(categories.map((c) => c.id))
  const paths = await glob("categories/*/apis.jsonl", {
    cwd: dataDir,
    absolute: true,
  })
  const byCategory = new Map<string, ApiRecord[]>(
    categories.map((c) => [c.id, [] as ApiRecord[]]),
  )
  let totalLines = 0
  let keptLines = 0

  for (const p of paths) {
    const catId = basename(dirname(p))
    if (!knownIds.has(catId)) {
      throw new Error(`${p}: category "${catId}" has no meta.toml`)
    }
    const text = await readFile(p, "utf8")
    const lines = text.split("\n")
    const items: ApiRecord[] = []
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim()
      if (!raw || raw.startsWith("#")) continue
      totalLines += 1
      let json: unknown
      try {
        json = JSON.parse(raw)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        throw new Error(`${p}:${i + 1}: invalid JSON: ${msg}`, { cause: e })
      }
      const rec = ApiRecordSchema.parse({ ...(json as object), category_id: catId })
      if (rec.category_id !== catId) {
        throw new Error(
          `${p}:${i + 1}: category_id "${rec.category_id}" doesn't match directory "${catId}"`,
        )
      }
      items.push(rec)
      keptLines += 1
    }
    byCategory.set(catId, items)
  }

  console.log(
    `  read ${keptLines}/${totalLines} API records across ${byCategory.size} categories`,
  )
  return byCategory
}

/* -------------------------------------------------------------------- */
/* step 3 — dedupe (first occurrence wins)                              */
/* -------------------------------------------------------------------- */

export function dedupe(byCategory: Map<string, ApiRecord[]>): ApiRecord[] {
  const seen = new Set<string>()
  const all: ApiRecord[] = []
  for (const [, items] of byCategory) {
    for (const rec of items) {
      if (seen.has(rec.id)) {
        console.warn(`  duplicate id "${rec.id}" — keeping first occurrence`)
        continue
      }
      seen.add(rec.id)
      all.push(rec)
    }
  }
  return all
}

/* -------------------------------------------------------------------- */
/* step 4 — aggregate                                                   */
/* -------------------------------------------------------------------- */

export const active = (records: ApiRecord[]): ApiRecord[] =>
  records.filter((r) => !r.deprecated)

export function buildStats(
  records: ApiRecord[],
  categories: CategoryMeta[],
  sources: string[],
) {
  const a = active(records)
  const gradeDistribution: Record<Grade, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  for (const r of a) {
    const g = r.quality_grade ?? scoreToGrade(r.quality_score)
    gradeDistribution[g] += 1
  }
  const meta = (k: keyof ApiRecord) =>
    a.filter((r) => r[k] != null && r[k] !== "").length
  const metadataCoverage = {
    auth: meta("auth"),
    https: a.filter((r) => r.https != null).length,
    cors: a.filter((r) => r.cors != null && r.cors !== "unknown").length,
    description: a.filter((r) => (r.description ?? "").length > 0).length,
  }
  return {
    total_apis: a.length,
    total_categories: categories.length,
    sources,
    grade_distribution: gradeDistribution,
    metadata_coverage: metadataCoverage,
    last_updated: new Date().toISOString(),
  }
}

export function buildCategoriesPayload(
  categories: CategoryMeta[],
  byCategory: Map<string, ApiRecord[]>,
) {
  const items = categories.map((c) => {
    const list = active(byCategory.get(c.id) ?? [])
    const avg =
      list.length === 0
        ? 0
        : Math.round(
            list.reduce((s, r) => s + (r.quality_score ?? 0), 0) / list.length,
          )
    return {
      id: c.id,
      name: c.id,
      display_name: c.display_name,
      icon: c.icon,
      blurb: c.blurb,
      order: c.order,
      api_count: list.length,
      avg_quality: avg,
    }
  })
  items.sort(
    (x, y) =>
      y.api_count - x.api_count || x.display_name.localeCompare(x.display_name),
  )
  return { total: items.length, items }
}

export function buildFeatured(
  categories: CategoryMeta[],
  byCategory: Map<string, ApiRecord[]>,
) {
  const catItems = buildCategoriesPayload(categories, byCategory).items
  const topCategories = catItems.slice(0, 12)
  const all = active([...byCategory.values()].flat())
  const topApis = all
    .filter((r) => (r.quality_grade ?? scoreToGrade(r.quality_score)) !== "F")
    .sort(
      (a, b) => b.quality_score - a.quality_score || a.name.localeCompare(b.name),
    )
    .slice(0, 9)
    .map((r) => toApiView(r))
  return { top_categories: topCategories, top_apis: topApis }
}

export function buildCategoryPage(
  cat: CategoryMeta,
  list: ApiRecord[],
  now: string,
) {
  const active = list.filter((r) => !r.deprecated)
  return {
    category: {
      id: cat.id,
      name: cat.id,
      display_name: cat.display_name,
      icon: cat.icon,
      blurb: cat.blurb,
      order: cat.order,
      api_count: active.length,
      avg_quality:
        active.length === 0
          ? 0
          : Math.round(
              active.reduce((s, r) => s + (r.quality_score ?? 0), 0) /
                active.length,
            ),
    },
    total: active.length,
    page: 1,
    per_page: active.length,
    preview: false,
    items: active.map((r) => toApiView(r, now)),
  }
}

/* -------------------------------------------------------------------- */
/* step 5 — Orama search index                                          */
/* -------------------------------------------------------------------- */

export async function buildSearchIndex(
  records: ApiRecord[],
): Promise<unknown> {
  const docs = active(records).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "",
    category_id: r.category_id,
    tags: splitTags(r.tags),
    source: r.source ?? "",
  }))
  const db = await create({
    schema: {
      id: "string",
      name: "string",
      description: "string",
      category_id: "string",
      tags: "string[]",
      source: "string",
    } as const,
  })
  await insertMultiple(db, docs)
  return save(db)
}

/* -------------------------------------------------------------------- */
/* emit                                                                  */
/* -------------------------------------------------------------------- */

async function writeJSON(path: string, data: unknown) {
  await writeFile(path, JSON.stringify(data), "utf8")
}

/* -------------------------------------------------------------------- */
/* orchestrator — exported so tests can run it against a fixture        */
/* -------------------------------------------------------------------- */

export interface BuildOptions {
  dataDir?: string
  outDir?: string
  /** Override "now" for deterministic snapshots in tests. */
  now?: string
  /** When true, print the size summary to stdout (default: false). */
  verbose?: boolean
}

export interface BuildResult {
  total_apis: number
  total_categories: number
  bytes: number
  category_files: { id: string; count: number; bytes: number }[]
}

export async function build(opts: BuildOptions = {}): Promise<BuildResult> {
  const dataDir = opts.dataDir ?? DATA_DIR
  const outDir = opts.outDir ?? OUT_DIR
  const now = opts.now ?? new Date().toISOString()
  const verbose = opts.verbose ?? false

  await mkdir(join(outDir, "category"), { recursive: true })

  const categories = await loadCategories(dataDir)
  const byCategory = await loadApis(categories, dataDir)
  const allRecords = dedupe(byCategory)
  const all: ApiView[] = allRecords.map((r) => toApiView(r, now))
  const sources = [...new Set(allRecords.map((r) => r.source).filter(Boolean))].sort()
  const stats = buildStats(allRecords, categories, sources)
  const catPayload = buildCategoriesPayload(categories, byCategory)
  const featured = buildFeatured(categories, byCategory)
  const activeViews = all.filter((r) => !r.deprecated)
  const sortedAll = [...activeViews].sort(
    (a, b) => b.quality_score - a.quality_score || a.name.localeCompare(b.name),
  )
  const top = sortedAll.slice(0, 50)

  /* per-category files */
  const categoryFiles: { id: string; count: number; bytes: number }[] = []
  for (const cat of categories) {
    const list = byCategory.get(cat.id) ?? []
    const payload = buildCategoryPage(cat, list, now)
    const p = join(outDir, "category", `${cat.id}.json`)
    await writeJSON(p, payload)
    categoryFiles.push({
      id: cat.id,
      count: list.length,
      bytes: JSON.stringify(payload).length,
    })
  }

  /* root files */
  await writeJSON(join(outDir, "stats.json"), stats)
  await writeJSON(join(outDir, "categories.json"), catPayload)
  await writeJSON(join(outDir, "featured.json"), featured)
  await writeJSON(join(outDir, "all.json"), sortedAll)
  await writeJSON(join(outDir, "top.json"), top)

  const oramaData = await buildSearchIndex(allRecords)
  await writeJSON(join(outDir, "orama.json"), oramaData)

  const manifest = {
    version: VERSION,
    built_at: now,
    stats: {
      total_apis: stats.total_apis,
      total_categories: stats.total_categories,
    },
    files: {
      stats: "stats.json",
      categories: "categories.json",
      featured: "featured.json",
      top: "top.json",
      all: "all.json",
      orama: "orama.json",
      category_pages: categoryFiles.length,
    },
    category_files: categoryFiles.map((f) => f.id),
  }
  await writeJSON(join(outDir, "manifest.json"), manifest)

  /* sum bytes for the report */
  const sz = async (p: string) => (await readFile(join(outDir, p))).length
  const total = (await Promise.all([
    sz("all.json"),
    sz("orama.json"),
    sz("stats.json"),
    sz("categories.json"),
    sz("featured.json"),
    sz("top.json"),
    sz("manifest.json"),
  ])).reduce((s, n) => s + n, 0)
  const catTotalBytes = categoryFiles.reduce((s, f) => s + f.bytes, 0)

  if (verbose) {
    const fmt = (b: number) => b.toLocaleString("en-US")
    const pad = (s: string, n = 12) => s.padStart(n)
    console.log("")
    console.log(`  stats.json          : ${pad(fmt(await sz("stats.json")))} bytes`)
    console.log(`  categories.json     : ${pad(fmt(await sz("categories.json")))} bytes`)
    console.log(`  featured.json       : ${pad(fmt(await sz("featured.json")))} bytes`)
    console.log(`  top.json            : ${pad(fmt(await sz("top.json")))} bytes`)
    console.log(`  all.json (${activeViews.length} APIs)  : ${pad(fmt(await sz("all.json")))} bytes`)
    console.log(`  orama.json          : ${pad(fmt(await sz("orama.json")))} bytes`)
    console.log(
      `  category/*.json     : ${pad(String(categoryFiles.length))} files, ${fmt(catTotalBytes)} bytes total`,
    )
    console.log("  ─────────────────────────────────────────")
    console.log(`  TOTAL: ${fmt(total)} bytes (${(total / 1024 / 1024).toFixed(2)} MB)`)
    console.log(
      `Manifest: total_apis=${stats.total_apis}, total_categories=${stats.total_categories}`,
    )
  }

  return {
    total_apis: stats.total_apis,
    total_categories: stats.total_categories,
    bytes: total,
    category_files: categoryFiles,
  }
}

/* -------------------------------------------------------------------- */
/* CLI entry point — only run when invoked directly                     */
/* -------------------------------------------------------------------- */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  console.log("Building API data …")
  console.log(`  source: ${relative(REPO_ROOT, DATA_DIR)}`)
  console.log(`  output: ${relative(REPO_ROOT, OUT_DIR)}`)
  build({ verbose: true }).catch((err) => {
    console.error("\n✗ build-data failed:\n")
    console.error(err)
    process.exit(1)
  })
}
