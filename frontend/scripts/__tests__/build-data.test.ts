/**
 * Integration tests for the build pipeline. Each test writes a small
 * fixture tree to a tmpdir, calls the exported `build()` function, and
 * asserts on the JSON files it wrote. The fixture tree is in a tmpdir
 * so parallel test runs don't collide and the OS reclaims the files.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdtemp, writeFile, readFile, mkdir, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  build,
  loadCategories,
  loadApis,
  dedupe,
  buildStats,
  buildCategoriesPayload,
  buildFeatured,
  buildCategoryPage,
  active,
} from "@/../scripts/build-data"
import type { ApiRecord, CategoryMeta } from "@/schemas"

let root = ""
let dataDir = ""
let outDir = ""

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "api-market-test-"))
  dataDir = join(root, "data")
  outDir = join(root, "out")
  await mkdir(join(dataDir, "categories", "weather"), { recursive: true })
  await mkdir(join(dataDir, "categories", "animals"), { recursive: true })
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

async function writeMeta(dir: string, content: string) {
  await writeFile(join(dir, "meta.toml"), content)
}

async function writeApis(dir: string, content: string) {
  await writeFile(join(dir, "apis.jsonl"), content)
}

const META_WEATHER = `[meta]
id = "weather"
display_name = "Weather"
icon = "wea"
blurb = "Forecasts."
order = 1
`
const META_ANIMALS = `[meta]
id = "animals"
display_name = "Animals"
icon = "anm"
blurb = "Pets."
order = 2
`
const APIS_WEATHER = [
  JSON.stringify({
    id: "open-meteo",
    name: "Open-Meteo",
    url: "https://api.open-meteo.com/v1/forecast",
    description: "Free weather.",
    auth: "none",
    https: true,
    cors: true,
    source: "open-meteo",
    tags: "forecast,free,no-key",
    quality_score: 95,
    quality_grade: "A",
    last_verified: "2026-06-01",
  }),
  // blank lines and comments must be skipped
  "",
  "# this is a comment",
  JSON.stringify({
    id: "nws",
    name: "NWS",
    url: "https://api.weather.gov",
    description: "US NWS.",
    auth: "none",
    https: true,
    cors: true,
    source: "weather.gov",
    tags: "us,government",
    quality_score: 90,
    quality_grade: "A",
    last_verified: "2026-06-01",
  }),
].join("\n") + "\n"
const APIS_ANIMALS = JSON.stringify({
  id: "dog-ceo",
  name: "Dog CEO",
  url: "https://dog.ceo/api/breeds/image/random",
  description: "Random dogs.",
  auth: "none",
  https: true,
  cors: true,
  source: "dog.ceo",
  tags: "dogs,images",
  quality_score: 90,
  quality_grade: "A",
  last_verified: "2026-06-01",
}) + "\n"

describe("loadCategories", () => {
  it("reads and validates every meta.toml, sorted by order", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    await writeMeta(join(dataDir, "categories", "animals"), META_ANIMALS)
    const cats = await loadCategories(dataDir)
    expect(cats.map((c) => c.id)).toEqual(["weather", "animals"])
  })

  it("rejects when directory name doesn't match meta.id", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    await writeFile(
      join(dataDir, "categories", "weather", "meta.toml"),
      META_WEATHER.replace("id = \"weather\"", "id = \"weather-renamed\""),
    )
    await expect(loadCategories(dataDir)).rejects.toThrow(/doesn't match meta\.id/)
  })

  it("rejects a meta.toml with malformed id (uppercase)", async () => {
    await writeFile(
      join(dataDir, "categories", "weather", "meta.toml"),
      META_WEATHER.replace("id = \"weather\"", "id = \"Weather\""),
    )
    await expect(loadCategories(dataDir)).rejects.toThrow(/kebab-case/)
  })

  it("returns [] when no categories exist", async () => {
    const cats = await loadCategories(dataDir)
    expect(cats).toEqual([])
  })
})

describe("loadApis", () => {
  it("reads every JSONL record, skipping blanks and comments", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    await writeApis(join(dataDir, "categories", "weather"), APIS_WEATHER)
    const cats = await loadCategories(dataDir)
    const byCategory = await loadApis(cats, dataDir)
    expect(byCategory.get("weather")!.map((r) => r.id)).toEqual([
      "open-meteo",
      "nws",
    ])
  })

  it("rejects a bad URL with a line number", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    const bad = JSON.stringify({
      id: "bad",
      name: "Bad",
      url: "ftp://nope.test",
      source: "x",
    })
    await writeApis(join(dataDir, "categories", "weather"), bad + "\n")
    const cats = await loadCategories(dataDir)
    await expect(loadApis(cats, dataDir)).rejects.toThrow(/url must be http/)
  })

  it("rejects a malformed JSONL line", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    await writeApis(
      join(dataDir, "categories", "weather"),
      '{"id":"x",\n',
    )
    const cats = await loadCategories(dataDir)
    await expect(loadApis(cats, dataDir)).rejects.toThrow(/invalid JSON/)
  })

  it("rejects a JSONL file under a category without meta.toml", async () => {
    await mkdir(join(dataDir, "categories", "orphan"), { recursive: true })
    await writeFile(
      join(dataDir, "categories", "orphan", "apis.jsonl"),
      '{"id":"x","name":"X","url":"https://x.test","source":"x"}\n',
    )
    const cats = await loadCategories(dataDir)
    await expect(loadApis(cats, dataDir)).rejects.toThrow(/has no meta\.toml/)
  })

  it("auto-injects category_id from the directory name", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    // record with no category_id field
    await writeApis(
      join(dataDir, "categories", "weather"),
      JSON.stringify({
        id: "x",
        name: "X",
        url: "https://x.test",
        source: "x",
      }) + "\n",
    )
    const cats = await loadCategories(dataDir)
    const byCategory = await loadApis(cats, dataDir)
    expect(byCategory.get("weather")![0].category_id).toBe("weather")
  })
})

describe("dedupe", () => {
  it("removes the second occurrence of a duplicate id", () => {
    const a: ApiRecord = {
      id: "x",
      name: "X",
      url: "https://x.test",
      description: "",
      category_id: "c1",
      source: "x",
      tags: "",
      quality_score: 0,
      status: "active",
      deprecated: false,
    }
    const b: ApiRecord = { ...a, category_id: "c2" }
    const dup = new Map<string, ApiRecord[]>([
      ["c1", [a]],
      ["c2", [b]],
    ])
    const result = dedupe(dup)
    expect(result).toHaveLength(1)
    expect(result[0].category_id).toBe("c1")
  })
})

describe("active", () => {
  it("filters out deprecated records", () => {
    const a: ApiRecord = {
      id: "a",
      name: "A",
      url: "https://a.test",
      description: "",
      category_id: "c",
      source: "a",
      tags: "",
      quality_score: 0,
      status: "active",
      deprecated: false,
    }
    const b: ApiRecord = { ...a, id: "b", deprecated: true }
    expect(active([a, b])).toEqual([a])
  })
})

describe("buildStats", () => {
  const cats: CategoryMeta[] = [
    {
      id: "c",
      display_name: "C",
      icon: "c",
      blurb: "",
      order: 1,
    },
  ]
  const records: ApiRecord[] = [
    {
      id: "a",
      name: "A",
      url: "https://a.test",
      description: "ok",
      category_id: "c",
      source: "s",
      tags: "t",
      quality_score: 90,
      quality_grade: "A",
      status: "active",
      deprecated: false,
    },
    {
      id: "b",
      name: "B",
      url: "https://b.test",
      description: "ok",
      category_id: "c",
      source: "s",
      tags: "t",
      quality_score: 80,
      quality_grade: "B",
      status: "active",
      deprecated: false,
    },
    {
      id: "c",
      name: "C",
      url: "https://c.test",
      description: "",
      category_id: "c",
      source: "s",
      tags: "",
      quality_score: 0,
      quality_grade: "F",
      status: "active",
      deprecated: true,
    },
  ]
  it("counts only non-deprecated records", () => {
    const s = buildStats(records, cats, ["s"])
    expect(s.total_apis).toBe(2)
    expect(s.grade_distribution.A).toBe(1)
    expect(s.grade_distribution.B).toBe(1)
    expect(s.grade_distribution.F).toBe(0)
  })
  it("derives grade from score when not set", () => {
    const recs = [
      { ...records[0]!, quality_grade: undefined, quality_score: 90 },
    ]
    const s = buildStats(recs, cats, ["s"])
    expect(s.grade_distribution.A).toBe(1)
  })
})

describe("buildCategoriesPayload", () => {
  it("sorts by api_count desc, then display_name", () => {
    const cats: CategoryMeta[] = [
      { id: "a", display_name: "Alpha", icon: "a", blurb: "", order: 1 },
      { id: "b", display_name: "Bravo", icon: "b", blurb: "", order: 2 },
    ]
    const rec: ApiRecord = {
      id: "x",
      name: "X",
      url: "https://x.test",
      description: "",
      category_id: "a",
      source: "x",
      tags: "",
      quality_score: 50,
      status: "active",
      deprecated: false,
    }
    const map = new Map<string, ApiRecord[]>([
      ["a", [rec]],
      ["b", [rec, rec]],
    ])
    const result = buildCategoriesPayload(cats, map)
    expect(result.items.map((c) => c.id)).toEqual(["b", "a"])
  })
})

describe("buildFeatured", () => {
  it("returns up to 9 non-F APIs sorted by quality score", () => {
    const cats: CategoryMeta[] = [
      { id: "c", display_name: "C", icon: "c", blurb: "", order: 1 },
    ]
    const recs: ApiRecord[] = Array.from({ length: 12 }, (_, i) => ({
      id: `r${i}`,
      name: `R${i}`,
      url: "https://x.test",
      description: "",
      category_id: "c",
      source: "x",
      tags: "",
      quality_score: 100 - i,
      quality_grade: i % 5 === 0 ? "F" : "A",
      status: "active",
      deprecated: false,
    }))
    const map = new Map<string, ApiRecord[]>([["c", recs]])
    const f = buildFeatured(cats, map)
    expect(f.top_apis.length).toBeLessThanOrEqual(9)
    expect(f.top_apis.every((r) => r.quality_grade !== "F")).toBe(true)
    expect(f.top_apis[0]!.quality_score).toBeGreaterThanOrEqual(
      f.top_apis[f.top_apis.length - 1]!.quality_score,
    )
  })
})

describe("buildCategoryPage", () => {
  it("returns a category payload with view-shaped items", () => {
    const cat: CategoryMeta = {
      id: "c",
      display_name: "C",
      icon: "c",
      blurb: "",
      order: 1,
    }
    const rec: ApiRecord = {
      id: "x",
      name: "X",
      url: "https://x.test",
      description: "d",
      category_id: "c",
      source: "x",
      tags: "a,b",
      quality_score: 80,
      quality_grade: "B",
      status: "active",
      deprecated: false,
    }
    const p = buildCategoryPage(cat, [rec], "2026-06-11T00:00:00Z")
    expect(p.category.id).toBe("c")
    expect(p.total).toBe(1)
    expect(p.items[0]!.tags).toEqual(["a", "b"])
    expect(p.items[0]!.created_at).toBe("2026-06-11T00:00:00Z")
  })
})

describe("build (end-to-end)", () => {
  it("writes all expected files and respects the deterministic `now`", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    await writeApis(join(dataDir, "categories", "weather"), APIS_WEATHER)
    await writeMeta(join(dataDir, "categories", "animals"), META_ANIMALS)
    await writeApis(join(dataDir, "categories", "animals"), APIS_ANIMALS)

    const result = await build({
      dataDir,
      outDir,
      now: "2026-06-11T00:00:00Z",
    })
    expect(result.total_apis).toBe(3)
    expect(result.total_categories).toBe(2)
    expect(result.category_files.map((f) => f.id).sort()).toEqual([
      "animals",
      "weather",
    ])

    const all = JSON.parse(await readFile(join(outDir, "all.json"), "utf8"))
    expect(Array.isArray(all)).toBe(true)
    expect(all).toHaveLength(3)
    for (const a of all) {
      expect(a.created_at).toBe("2026-06-11T00:00:00Z")
      expect(Array.isArray(a.tags)).toBe(true)
    }

    const stats = JSON.parse(await readFile(join(outDir, "stats.json"), "utf8"))
    expect(stats.total_apis).toBe(3)
    expect(stats.total_categories).toBe(2)

    const manifest = JSON.parse(
      await readFile(join(outDir, "manifest.json"), "utf8"),
    )
    expect(manifest.version).toBe("6.0.0")
    expect(manifest.built_at).toBe("2026-06-11T00:00:00Z")
    expect(manifest.category_files.sort()).toEqual(["animals", "weather"])

    // Orama index: it must be a non-empty object
    const orama = JSON.parse(await readFile(join(outDir, "orama.json"), "utf8"))
    expect(typeof orama).toBe("object")
    expect(Object.keys(orama).length).toBeGreaterThan(0)
  })

  it("marks deprecated records as excluded from top / all", async () => {
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    const records = APIS_WEATHER + JSON.stringify({
      id: "deprecated-1",
      name: "Deprecated API",
      url: "https://deprecated.test",
      description: "going away",
      auth: "none",
      https: true,
      cors: true,
      source: "x",
      tags: "old",
      quality_score: 95,
      quality_grade: "A",
      deprecated: true,
    }) + "\n"
    await writeApis(join(dataDir, "categories", "weather"), records)
    const result = await build({
      dataDir,
      outDir,
      now: "2026-06-11T00:00:00Z",
    })
    expect(result.total_apis).toBe(2)
    const all = JSON.parse(await readFile(join(outDir, "all.json"), "utf8"))
    expect(all).toHaveLength(2)
    expect(all.every((a: { id: string }) => a.id !== "deprecated-1")).toBe(true)
  })

  it("rejects a record under a non-existent category", async () => {
    await mkdir(join(dataDir, "categories", "phantom"), { recursive: true })
    await writeMeta(join(dataDir, "categories", "weather"), META_WEATHER)
    await writeApis(join(dataDir, "categories", "weather"), APIS_WEATHER)
    // no meta.toml for "phantom" but apis.jsonl exists
    await writeFile(
      join(dataDir, "categories", "phantom", "apis.jsonl"),
      '{"id":"x","name":"X","url":"https://x.test","source":"x"}\n',
    )
    await expect(build({ dataDir, outDir })).rejects.toThrow(/has no meta\.toml/)
  })

  it("survives an empty data dir (no categories)", async () => {
    const result = await build({ dataDir, outDir, now: "2026-06-11T00:00:00Z" })
    expect(result.total_apis).toBe(0)
    expect(result.total_categories).toBe(0)
    const stats = JSON.parse(await readFile(join(outDir, "stats.json"), "utf8"))
    expect(stats.total_apis).toBe(0)
  })
})
