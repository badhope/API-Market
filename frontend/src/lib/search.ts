/**
 * Client-side search backed by Orama.
 *
 * The build script (`frontend/scripts/build-data.ts`) emits a pre-built
 * Orama index to `frontend/public/data/orama.json` and a flat record
 * list to `frontend/public/data/all.json`. The browser hydrates both
 * lazily on first search and caches them for the session.
 *
 * Why Orama:
 *   - ~50KB gzip, WASM-accelerated, full-text + typo tolerance + facets
 *   - ships a serializable DB format so we never rebuild the index
 *     client-side; the GH-Pages payload is a single static file
 *   - the pre-built `orama.json` is the same data shape we'd otherwise
 *     compute on first ⌘K, so first-search latency is a fetch, not a
 *     build
 */
import { create, load, search, type AnyOrama, type SearchParams } from "@orama/orama"
import { DATA_PATH } from "./links"
import type { ApiView } from "@/schemas"

export type SearchHit = {
  api: ApiView
  score: number
}

/* ----------------------------- module cache ----------------------------- */

let _db: AnyOrama | null = null
let _dbPromise: Promise<AnyOrama> | null = null
let _recordsPromise: Promise<Map<string, ApiView>> | null = null

const SCHEMA = {
  id: "string",
  name: "string",
  description: "string",
  category_id: "string",
  tags: "string[]",
  source: "string",
} as const

async function fetchOrama(): Promise<AnyOrama> {
  if (_db) return _db
  if (!_dbPromise) {
    _dbPromise = (async () => {
      const r = await fetch(`${DATA_PATH}/orama.json`)
      if (!r.ok) throw new Error(`orama.json: ${r.status}`)
      const data = (await r.json()) as unknown
      const db = create({ schema: SCHEMA } as never)
      load(db as AnyOrama, data as never)
      _db = db as AnyOrama
      return _db
    })()
  }
  return _dbPromise
}

async function fetchRecords(): Promise<Map<string, ApiView>> {
  if (!_recordsPromise) {
    _recordsPromise = fetch(`${DATA_PATH}/all.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`all.json: ${r.status}`)
        return r.json() as Promise<ApiView[]>
      })
      .then((rows) => {
        const m = new Map<string, ApiView>()
        for (const row of rows) m.set(row.id, row)
        return m
      })
  }
  return _recordsPromise
}

/* --------------------------------- public --------------------------------- */

/**
 * Eagerly warm the index so the first ⌘K press is instant. Safe to
 * call from a layout — failures are silent.
 */
export function preloadSearch(): void {
  void fetchOrama()
  void fetchRecords()
}

/**
 * Run a search. Returns up to `limit` hits, ordered by Orama's score
 * (best first). Empty / whitespace queries return [].
 */
export async function searchApis(query: string, limit = 50): Promise<SearchHit[]> {
  const q = query.trim()
  if (!q) return []
  const [db, records] = await Promise.all([fetchOrama(), fetchRecords()])

  const params: SearchParams<AnyOrama> = {
    term: q,
    properties: ["name", "description", "tags", "source", "category_id"],
    boost: { name: 2, tags: 1.5, category_id: 1.2 },
    tolerance: 1,
    limit,
  }
  // Orama's typed `search` is precise about its schema-typed DB; we
  // deliberately store the DB as `AnyOrama` (an opaque handle) so
  // this cast is safe.
  const result = (await search(db, params)) as unknown as {
    hits: { id: string; score: number; document: unknown }[]
    count: number
  }
  const out: SearchHit[] = []
  for (const h of result.hits) {
    const api = records.get(String(h.id))
    if (api) out.push({ api, score: h.score })
  }
  return out
}

