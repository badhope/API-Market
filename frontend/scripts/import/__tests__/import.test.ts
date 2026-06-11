/**
 * Tests for the public-apis importer. We use a small, hand-written
 * README fixture so the tests don't depend on the network.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  extractLabel,
  extractLink,
  parseReadme,
  parseRow,
  slugifyApiId,
  slugifyCategory,
  toEntry,
} from "../public-apis"
import {
  mapAuth,
  mapCors,
  mapHttps,
  score,
  scoreEntry,
} from "../score"
import { importPublicApis } from "../run"
import { writeCategories, groupByCategory, makeIds, orderApis, toRecord } from "../write"
import { score as scoreFn, type ScoredApi } from "../score"

const FIXTURE = new URL("./fixture-readme.md", import.meta.url).pathname
// Read the fixture once at module load so the tests don't have to
// keep hitting the disk (and so we can use a top-level `import`
// instead of `require()` mid-test).
const FIXTURE_TEXT = readFileSync(FIXTURE, "utf8")

describe("parseRow", () => {
  it("parses a 5-cell row (no Link column)", () => {
    const row = parseRow(
      "| [AdoptAPet](https://www.adoptapet.com/public/apis/pet_list.html) | Resource to help get pets adopted | `apiKey` | Yes | Yes |",
    )
    expect(row).toEqual({
      name: "AdoptAPet",
      description: "Resource to help get pets adopted",
      auth: "apiKey",
      https: "yes",
      cors: "yes",
      link: "https://www.adoptapet.com/public/apis/pet_list.html",
    })
  })

  it("parses a 6-cell row (trailing `|  |`)", () => {
    const row = parseRow(
      "| [Cat Facts](https://alexwohlbruck.github.io/cat-facts/) | Daily cat facts | No | Yes | No | |",
    )
    expect(row?.name).toBe("Cat Facts")
    expect(row?.link).toBe("https://alexwohlbruck.github.io/cat-facts/")
  })

  it("parses a 7-cell row with an explicit Link column", () => {
    const row = parseRow(
      "| [Behance](https://www.behance.net/dev) | Design portfolio & job search | apiKey | Yes | Yes | https://developer.behance.net/ |",
    )
    expect(row?.name).toBe("Behance")
    expect(row?.link).toBe("https://developer.behance.net/")
  })

  it("rejects a line that doesn't start with `|`", () => {
    expect(parseRow("not a table row")).toBeNull()
  })
})

describe("extractLabel / extractLink", () => {
  it("strips `**bold**` and backticks from a label", () => {
    expect(extractLabel("**Open**-Meteo")).toBe("Open-Meteo")
    expect(extractLabel("`apiKey`")).toBe("apiKey")
  })
  it("returns the link from a Markdown link cell", () => {
    expect(extractLink("[A](https://a.example)")).toBe("https://a.example")
    expect(extractLink("plain text")).toBeNull()
  })
})

describe("parseReadme", () => {
  it("walks the fixture and groups rows by `### ` heading", () => {
    const sections = parseReadme(FIXTURE_TEXT)
    const names = sections.map((s) => s.name)
    // The fixture has 4 `### ` headings.
    expect(names).toEqual(["Animals", "Art & Design", "Empty Category", "Weather"])
    // The `## Index` block must NOT show up as a category.
    expect(names).not.toContain("Index")

    const animals = sections.find((s) => s.name === "Animals")!
    expect(animals.rows.map((r) => r.name)).toEqual([
      "AdoptAPet",
      "Axolotl",
      "Cat Facts",
      "HTTP Cat",
    ])

    const art = sections.find((s) => s.name === "Art & Design")!
    expect(art.rows.map((r) => r.name)).toEqual(["Behance", "Dribbble"])
    // First cell is the homepage; last cell is the doc URL.
    expect(art.rows[0]?.link).toBe("https://developer.behance.net/")

    const empty = sections.find((s) => s.name === "Empty Category")!
    expect(empty.rows).toEqual([])
  })
})

describe("toEntry", () => {
  it("drops rows with no usable http(s) URL", () => {
    expect(
      toEntry({ name: "x", description: "", auth: "", https: "", cors: "", link: "" }),
    ).toBeNull()
    expect(
      toEntry({ name: "x", description: "", auth: "", https: "", cors: "", link: "mailto:a@b" }),
    ).toBeNull()
  })
})

describe("slugifyCategory", () => {
  it("handles `&`, punctuation, and double spaces", () => {
    expect(slugifyCategory("Art & Design")).toBe("art-and-design")
    expect(slugifyCategory("Cloud Storage & File Sharing")).toBe(
      "cloud-storage-and-file-sharing",
    )
    expect(slugifyCategory("Games & Comics")).toBe("games-and-comics")
    expect(slugifyCategory("Continuous Integration")).toBe("continuous-integration")
  })
})

describe("slugifyApiId", () => {
  it("strips emoji and collapses runs of non-alphanumerics", () => {
    expect(slugifyApiId("HTTP Cat!")).toBe("http-cat")
    expect(slugifyApiId("7Timer!")).toBe("7timer")
  })
  it("falls back to a URL hash when the name is empty", () => {
    const id = slugifyApiId("", "https://api.example.com/v1")
    expect(id).toMatch(/^api-[a-z0-9]+$/)
  })
})

describe("auth/https/cors mapping", () => {
  it("maps the public-apis auth values to our schema", () => {
    expect(mapAuth("no")).toEqual({ auth: "none", tags: [] })
    expect(mapAuth("apiKey")).toEqual({ auth: "apiKey", tags: ["apiKey"] })
    expect(mapAuth("OAuth")).toEqual({ auth: "oauth2", tags: ["oauth"] })
    expect(mapAuth("X-Mashape-Key")).toEqual({ auth: "xAuth", tags: ["xAuth"] })
    expect(mapAuth("apiKey|userId")).toEqual({
      auth: "apiKey",
      tags: ["apiKey", "userId"],
    })
  })
  it("maps https yes/no", () => {
    expect(mapHttps("Yes")).toBe(true)
    expect(mapHttps("No")).toBe(false)
    expect(mapHttps("garbage")).toBeNull()
  })
  it("maps cors yes/no/unknown", () => {
    expect(mapCors("Yes")).toBe(true)
    expect(mapCors("No")).toBe(false)
    expect(mapCors("Unknown")).toBe("unknown")
    expect(mapCors("garbage")).toBeNull()
  })
})

describe("scoreEntry", () => {
  it("rewards HTTPS + no-auth + CORS + a real description", () => {
    const a = scoreEntry({
      name: "x",
      description: "A fairly long description that adds some signal here.",
      auth: "no",
      https: "yes",
      cors: "yes",
      url: "https://x",
    })
    const b = scoreEntry({
      name: "x",
      description: "",
      auth: "OAuth",
      https: "no",
      cors: "no",
      url: "https://x",
    })
    expect(a).toBeGreaterThan(80)
    expect(b).toBeLessThan(40)
  })
})

describe("writeCategories (integration, no network)", () => {
  it("round-trips the fixture through a tmp data dir", async () => {
    const dir = await mkdtemp(join(tmpdir(), "apimkt-import-"))
    try {
      const readme = await readFile(FIXTURE, "utf8")
      const sections = parseReadme(readme)
      const payloads = groupByCategory(
        sections,
        { lastVerified: "2026-06-11", sourceUrl: "https://example.com" },
        (row) => score(toEntry(row)!, { lastVerified: "2026-06-11", sourceUrl: "https://example.com" }),
      )

      // The empty section must be dropped.
      const slugs = payloads.map((p) => p.slug)
      expect(slugs).not.toContain("empty-category")

      const { written, totalApis, categories } = await writeCategories(dir, payloads)
      expect(written).toBe(payloads.length)
      expect(categories).toEqual(slugs)

      // 4 + 2 + 2 = 8 APIs in the fixture (empty category contributes 0).
      expect(totalApis).toBe(8)

      // Spot-check a written file.
      const animalDir = join(dir, "categories", "animals")
      const animalStat = await stat(animalDir)
      expect(animalStat.isDirectory()).toBe(true)
      const meta = await readFile(join(animalDir, "meta.toml"), "utf8")
      expect(meta).toMatch(/id = "animals"/)
      const jsonl = await readFile(join(animalDir, "apis.jsonl"), "utf8")
      const lines = jsonl.trim().split("\n")
      expect(lines).toHaveLength(4)
      // Verify AdoptAPet landed as an apiKey/HTTPS row regardless of
      // its position (records are ordered by quality desc, not
      // original order).
      const all = lines.map((l) => JSON.parse(l)) as Array<{
        id: string
        auth: string
        https: boolean | null
      }>
      const adoptapet = all.find((a) => a.id === "adoptapet")!
      expect(adoptapet.auth).toBe("apiKey")
      expect(adoptapet.https).toBe(true)
      // The 4th in the fixture (HTTP Cat) should be the highest
      // quality, so first in the file.
      expect(all[0]?.id).toBe("http-cat")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

describe("makeIds / orderApis / toRecord", () => {
  it("dedupes ids with -2, -3 suffix", () => {
    const a: ScoredApi = scoreFn(
      { name: "Foo", description: "x", auth: "no", https: "yes", cors: "yes", url: "https://a" },
      { lastVerified: "2026-06-11" },
    )
    const b: ScoredApi = scoreFn(
      { name: "Foo", description: "y", auth: "no", https: "yes", cors: "yes", url: "https://b" },
      { lastVerified: "2026-06-11" },
    )
    const out = makeIds([a, b])
    expect(out.map((x) => x.id)).toEqual(["foo", "foo-2"])
  })

  it("orders by quality desc, name asc", () => {
    const low: ScoredApi = scoreFn(
      { name: "Zeta", description: "", auth: "OAuth", https: "no", cors: "no", url: "https://a" },
      { lastVerified: "2026-06-11" },
    )
    const high: ScoredApi = scoreFn(
      { name: "Alpha", description: "long enough description for a good score", auth: "no", https: "yes", cors: "yes", url: "https://b" },
      { lastVerified: "2026-06-11" },
    )
    const ordered = orderApis([low, high])
    expect(ordered[0]?.name).toBe("Alpha")
    expect(ordered[0]?.quality_score).toBeGreaterThan(ordered[1]!.quality_score)
  })

  it("toRecord passes the Zod schema", () => {
    const a: ScoredApi = scoreFn(
      { name: "Bar", description: "desc", auth: "no", https: "yes", cors: "yes", url: "https://b" },
      { lastVerified: "2026-06-11" },
    )
    // makeIds is the one that slugifies; toRecord just persists.
    const [withId] = makeIds([a])
    const r = toRecord(withId!, "any")
    expect(r.id).toBe("bar")
    expect(r.category_id).toBe("any")
  })
})

describe("importPublicApis (end-to-end with local fixture)", () => {
  it("writes a real data dir and reports counts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "apimkt-import-e2e-"))
    try {
      const r = await importPublicApis({ input: FIXTURE, dataDir: dir })
      expect(r.sections).toBe(4)
      expect(r.apis).toBe(8)
      expect(r.categories).toBe(3) // empty category dropped
      // Sanity: stat a written dir
      const s = await stat(join(dir, "categories", "weather"))
      expect(s.isDirectory()).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
