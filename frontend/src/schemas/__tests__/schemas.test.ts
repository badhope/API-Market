/**
 * Tests for the Zod schemas. These are the contract — the build script
 * and the frontend both import the inferred types and run validation
 * against the same source. A change to the schema that breaks any of
 * these tests is a deliberate contract change and needs a CHANGELOG
 * entry.
 */
import { describe, it, expect } from "vitest"
import {
  ApiRecordSchema,
  CategoryMetaSchema,
  splitTags,
  scoreToGrade,
  toApiView,
  gradeToOrder,
} from "@/schemas"

const baseApi = {
  id: "open-meteo",
  name: "Open-Meteo",
  url: "https://api.open-meteo.com/v1/forecast",
  description: "Free weather forecast.",
  category_id: "weather",
  auth: "none",
  https: true,
  cors: true,
  source: "open-meteo",
  source_url: "https://open-meteo.com",
  tags: "forecast,free,no-key",
  quality_score: 95,
  quality_grade: "A",
  deprecated: false,
  last_verified: "2026-06-01",
}

const baseCategory = {
  id: "weather",
  display_name: "Weather",
  icon: "wea",
  blurb: "Forecasts.",
  order: 1,
}

describe("ApiRecordSchema", () => {
  it("accepts a complete record", () => {
    const parsed = ApiRecordSchema.parse(baseApi)
    expect(parsed.id).toBe("open-meteo")
    expect(parsed.tags).toBe("forecast,free,no-key")
    expect(parsed.deprecated).toBe(false)
  })

  it("fills in defaults for missing optional fields", () => {
    const minimal = ApiRecordSchema.parse({
      id: "x",
      name: "X",
      url: "https://x.test",
      category_id: "weather",
      source: "x",
    })
    expect(minimal.description).toBe("")
    expect(minimal.tags).toBe("")
    expect(minimal.quality_score).toBe(0)
    expect(minimal.deprecated).toBe(false)
    expect(minimal.status).toBe("active")
  })

  it("rejects non-http URLs", () => {
    expect(() => ApiRecordSchema.parse({ ...baseApi, url: "ftp://x.test" })).toThrow(
      /url must be http/,
    )
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, url: "javascript:alert(1)" }),
    ).toThrow(/url must be http/)
  })

  it("rejects URLs with whitespace or angle brackets", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, url: "https://exa mple.com" }),
    ).toThrow()
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, url: "https://<script>" }),
    ).toThrow()
  })

  it("rejects unknown auth values", () => {
    expect(() => ApiRecordSchema.parse({ ...baseApi, auth: "magic" })).toThrow()
  })

  it("accepts every documented auth value", () => {
    for (const auth of ["none", "apiKey", "oauth2", "xAuth", "xAuth+apiKey"]) {
      expect(() => ApiRecordSchema.parse({ ...baseApi, auth })).not.toThrow()
    }
  })

  it("rejects unknown grade values", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, quality_grade: "Z" }),
    ).toThrow()
  })

  it("accepts every grade A–F", () => {
    for (const g of ["A", "B", "C", "D", "F"] as const) {
      expect(() =>
        ApiRecordSchema.parse({ ...baseApi, quality_grade: g }),
      ).not.toThrow()
    }
  })

  it("rejects scores outside 0..100", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, quality_score: -1 }),
    ).toThrow()
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, quality_score: 101 }),
    ).toThrow()
  })

  it("rejects non-integer scores", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, quality_score: 80.5 }),
    ).toThrow()
  })

  it("rejects bad last_verified format", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, last_verified: "01-06-2026" }),
    ).toThrow(/YYYY-MM-DD/)
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, last_verified: "2026/06/01" }),
    ).toThrow(/YYYY-MM-DD/)
  })

  it("accepts a well-formed last_verified", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, last_verified: "2026-06-01" }),
    ).not.toThrow()
  })

  it("truncates oversized id", () => {
    expect(() => ApiRecordSchema.parse({ ...baseApi, id: "x".repeat(129) })).toThrow()
  })

  it("rejects an empty id", () => {
    expect(() => ApiRecordSchema.parse({ ...baseApi, id: "" })).toThrow()
  })

  it("accepts a description that is exactly 500 chars", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, description: "a".repeat(500) }),
    ).not.toThrow()
  })

  it("rejects a description longer than 500 chars", () => {
    expect(() =>
      ApiRecordSchema.parse({ ...baseApi, description: "a".repeat(501) }),
    ).toThrow()
  })

  it("cors accepts boolean, 'unknown', or null", () => {
    for (const cors of [true, false, "unknown", null]) {
      expect(() => ApiRecordSchema.parse({ ...baseApi, cors })).not.toThrow()
    }
    expect(() => ApiRecordSchema.parse({ ...baseApi, cors: "maybe" })).toThrow()
  })
})

describe("CategoryMetaSchema", () => {
  it("accepts a complete meta", () => {
    const c = CategoryMetaSchema.parse(baseCategory)
    expect(c.id).toBe("weather")
  })

  it("fills default order when missing", () => {
    const c = CategoryMetaSchema.parse({ ...baseCategory, order: undefined })
    expect(c.order).toBe(99)
  })

  it("rejects uppercase id", () => {
    expect(() => CategoryMetaSchema.parse({ ...baseCategory, id: "Weather" })).toThrow(
      /kebab-case/,
    )
  })

  it("rejects id with spaces", () => {
    expect(() => CategoryMetaSchema.parse({ ...baseCategory, id: "open data" })).toThrow()
  })

  it("accepts kebab-case id with digits", () => {
    expect(() =>
      CategoryMetaSchema.parse({ ...baseCategory, id: "open-data-2" }),
    ).not.toThrow()
  })
})

describe("splitTags", () => {
  it("splits a comma-separated string", () => {
    expect(splitTags("a,b,c")).toEqual(["a", "b", "c"])
  })

  it("trims whitespace around tags", () => {
    expect(splitTags("  a , b  ,c ")).toEqual(["a", "b", "c"])
  })

  it("drops empty fragments", () => {
    expect(splitTags("a,,b,,,c,")).toEqual(["a", "b", "c"])
  })

  it("returns [] for empty / null / undefined", () => {
    expect(splitTags("")).toEqual([])
    expect(splitTags(null)).toEqual([])
    expect(splitTags(undefined)).toEqual([])
  })

  it("returns [] for whitespace only", () => {
    expect(splitTags("   ")).toEqual([])
  })
})

describe("scoreToGrade", () => {
  it("maps boundary scores to the right letter", () => {
    expect(scoreToGrade(100)).toBe("A")
    expect(scoreToGrade(90)).toBe("A")
    expect(scoreToGrade(89)).toBe("B")
    expect(scoreToGrade(75)).toBe("B")
    expect(scoreToGrade(74)).toBe("C")
    expect(scoreToGrade(60)).toBe("C")
    expect(scoreToGrade(59)).toBe("D")
    expect(scoreToGrade(40)).toBe("D")
    expect(scoreToGrade(39)).toBe("F")
    expect(scoreToGrade(0)).toBe("F")
  })

  it("clamps out-of-range scores", () => {
    expect(scoreToGrade(150)).toBe("A")
    expect(scoreToGrade(-5)).toBe("F")
  })

  it("rounds fractional scores", () => {
    expect(scoreToGrade(89.6)).toBe("A")
    expect(scoreToGrade(89.4)).toBe("B")
  })
})

describe("gradeToOrder", () => {
  it("orders grades A < B < C < D < F", () => {
    expect(gradeToOrder.A).toBeLessThan(gradeToOrder.B)
    expect(gradeToOrder.B).toBeLessThan(gradeToOrder.C)
    expect(gradeToOrder.C).toBeLessThan(gradeToOrder.D)
    expect(gradeToOrder.D).toBeLessThan(gradeToOrder.F)
  })
})

describe("toApiView", () => {
  it("converts a record to the outward-facing view shape", () => {
    const view = toApiView(ApiRecordSchema.parse(baseApi), "2026-06-11T00:00:00Z")
    expect(view.tags).toEqual(["forecast", "free", "no-key"])
    expect(view.created_at).toBe("2026-06-11T00:00:00Z")
    // updated_at is derived from last_verified when present
    expect(view.updated_at).toBe("2026-06-01T00:00:00Z")
    expect(view.status).toBe("active")
  })

  it("flips status to 'deprecated' when deprecated:true", () => {
    const view = toApiView(
      ApiRecordSchema.parse({ ...baseApi, deprecated: true }),
      "2026-06-11T00:00:00Z",
    )
    expect(view.status).toBe("deprecated")
    expect(view.deprecated).toBe(true)
  })

  it("derives updated_at from last_verified when present", () => {
    const view = toApiView(ApiRecordSchema.parse(baseApi), "2026-06-11T00:00:00Z")
    expect(view.updated_at).toBe("2026-06-01T00:00:00Z")
  })

  it("falls back to the build-time `now` when last_verified is missing", () => {
    const { last_verified, ...rest } = baseApi
    void last_verified
    const view = toApiView(ApiRecordSchema.parse(rest), "2026-06-11T00:00:00Z")
    expect(view.updated_at).toBe("2026-06-11T00:00:00Z")
  })

  it("preserves nulls for optional fields", () => {
    const view = toApiView(
      ApiRecordSchema.parse({
        id: "x",
        name: "X",
        url: "https://x.test",
        category_id: "weather",
        source: "x",
      }),
      "2026-06-11T00:00:00Z",
    )
    expect(view.auth).toBeNull()
    expect(view.https).toBeNull()
    expect(view.cors).toBeNull()
    expect(view.quality_grade).toBeNull()
    expect(view.last_verified).toBeNull()
    expect(view.tags).toEqual([])
  })
})
