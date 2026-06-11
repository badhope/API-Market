/**
 * Writer. Takes a fully-scored set of APIs grouped by category and
 * writes them to `data/categories/<slug>/{meta.toml,apis.jsonl}`.
 *
 * The output is exactly the same shape `build-data.ts` reads from, so
 * no schema changes are required on the build side.
 *
 * We try to be polite to git history:
 *   - one file per category (so diffs are scoped)
 *   - one JSON object per line (JSONL)
 *   - deterministic ordering: by `quality_score desc, name asc`
 *   - id collisions within a category are de-duplicated with `-2`,
 *     `-3`, … so we never silently drop a record
 */
import { mkdir, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"

import {
  ApiRecordSchema,
  type ApiRecord,
} from "../../src/schemas/index"

import { slugifyApiId, slugifyCategory } from "./public-apis"
import type { ScoredApi } from "./score"

/** One category's worth of scored APIs, ready to be written. */
export interface CategoryPayload {
  /** Display name from upstream ("Art & Design"). */
  displayName: string
  /** Slug we derived from the display name. */
  slug: string
  /** The order in the upstream README, 0-based. */
  order: number
  /** The scored APIs. */
  apis: ScoredApi[]
}

/** Build a payload list from the raw sections. */
export function groupByCategory(
  sections: ReadonlyArray<{
    name: string
    rows: ReadonlyArray<{ name: string; description: string; auth: string; https: string; cors: string; link: string }>
  }>,
  options: { lastVerified: string; sourceUrl?: string },
  toScored: (row: { name: string; description: string; auth: string; https: string; cors: string; link: string }) => ScoredApi | null,
): CategoryPayload[] {
  const out: CategoryPayload[] = []
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]!
    const slug = slugifyCategory(s.name)
    if (!slug) continue
    const apis: ScoredApi[] = []
    for (const row of s.rows) {
      const scored = toScored(row)
      if (scored) apis.push(scored)
    }
    if (apis.length === 0) continue
    out.push({
      displayName: s.name,
      slug,
      order: i,
      apis,
    })
  }
  return out
}

/** Stable, human-friendly slugs within a category, deduped. */
export function makeIds(apis: ScoredApi[]): ScoredApi[] {
  const used = new Set<string>()
  return apis.map((a) => {
    const base = slugifyApiId(a.name, a.url)
    let id = base || `api-${used.size}`
    let n = 2
    while (used.has(id)) {
      id = `${base}-${n++}`
    }
    used.add(id)
    return { ...a, id }
  })
}

/** Order: highest quality first, then by name. */
export function orderApis(apis: ScoredApi[]): ScoredApi[] {
  return [...apis].sort((a, b) => {
    if (b.quality_score !== a.quality_score) return b.quality_score - a.quality_score
    return a.name.localeCompare(b.name)
  })
}

/* --------------------------- serialize ---------------------------- */

export function toRecord(s: ScoredApi, categoryId: string): ApiRecord {
  // We round-trip through Zod so anything malformed gets caught
  // before it lands in the data dir. `category_id` is derived from
  // the directory the record is about to be written to.
  if (!s.id) throw new Error("toRecord: missing id")
  return ApiRecordSchema.parse({
    category_id: categoryId,
    id: s.id,
    name: s.name,
    url: s.url,
    description: s.description,
    auth: s.auth,
    https: s.https,
    cors: s.cors,
    source: s.source,
    source_url: s.source_url,
    tags: s.tags,
    quality_score: s.quality_score,
    quality_grade: s.quality_grade,
    deprecated: s.deprecated,
    last_verified: s.last_verified,
  })
}

function renderMeta(p: CategoryPayload): string {
  // Tiny TOML by hand — smol-toml is happy to parse it and we don't
  // need its richer features for five fields.
  //
  // `icon` and `blurb` are required by CategoryMetaSchema but
  // public-apis doesn't give us either, so we derive them:
  //   - icon: a glyph made from the first letters of the display
  //     name. Hand-curated meta.toml files (e.g. the original
  //     weather / animals ones) can still override this.
  //   - blurb: an empty string — the site renders `blurb ?? ""`
  //     and we don't want to invent copy at import time.
  return [
    "[meta]",
    `id = ${JSON.stringify(p.slug)}`,
    `display_name = ${JSON.stringify(p.displayName)}`,
    `icon = ${JSON.stringify(deriveIcon(p.displayName))}`,
    `blurb = ""`,
    `order = ${p.order + 1}`,
    "",
  ].join("\n")
}

/**
 * Derive a short icon code from the display name. We avoid any
 * Unicode symbol noise; the codebase uses these as keys into a
 * `cn(... cls)` lookup that maps to a Lucide icon.
 */
function deriveIcon(displayName: string): string {
  const words = displayName
    .replace(/&/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0)
  if (words.length === 0) return "dot"
  if (words.length === 1) return (words[0] ?? "dot").slice(0, 3).toLowerCase()
  return (words[0]![0]! + (words[1]?.[0] ?? "")).toLowerCase()
}

function renderJsonl(p: CategoryPayload, apis: ScoredApi[]): string {
  return apis
    .map((a) => JSON.stringify(toRecord(a, p.slug)))
    .join("\n") + "\n"
}

/* --------------------------- top-level ---------------------------- */

/**
 * Write the data dir. The directory is the canonical layout, so we
 * wipe it first to avoid leaving stale categories from previous
 * imports around.
 */
export async function writeCategories(
  dataDir: string,
  payloads: CategoryPayload[],
): Promise<{ written: number; totalApis: number; categories: string[] }> {
  // Clear the categories dir.
  await rm(join(dataDir, "categories"), {
    recursive: true,
    force: true,
  })
  await mkdir(join(dataDir, "categories"), { recursive: true })

  let totalApis = 0
  for (const p of payloads) {
    const dir = join(dataDir, "categories", p.slug)
    await mkdir(dir, { recursive: true })
    const apis = orderApis(makeIds(p.apis))
    await writeFile(join(dir, "meta.toml"), renderMeta(p), "utf8")
    await writeFile(join(dir, "apis.jsonl"), renderJsonl(p, apis), "utf8")
    totalApis += apis.length
  }

  return {
    written: payloads.length,
    totalApis,
    categories: payloads.map((p) => p.slug),
  }
}
