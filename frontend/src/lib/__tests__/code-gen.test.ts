/**
 * Tests for the code-sample generator. The generator is a pure
 * string-template function; we just check that every sample carries
 * the API's URL, that the labels are stable, and that quotes in the
 * URL are escaped.
 */
import { describe, it, expect } from "vitest"
import { codeSamples } from "@/lib/code-gen"
import type { ApiSummary } from "@/types"

const baseApi: ApiSummary = {
  id: "x",
  name: "X",
  url: "https://api.example.com/v1/things",
  description: "test",
  category_id: "test",
  auth: "none",
  https: true,
  cors: true,
  source: "test",
  source_url: null,
  quality_score: 0,
  quality_grade: null,
  tags: [],
  status: "active",
  deprecated: false,
  last_verified: null,
  created_at: null,
  updated_at: null,
}

describe("codeSamples", () => {
  it("returns the four expected languages", () => {
    const samples = codeSamples(baseApi)
    expect(samples.map((s) => s.id)).toEqual(["curl", "fetch", "python", "go"])
  })

  it("embeds the API URL in every snippet", () => {
    const samples = codeSamples(baseApi)
    for (const s of samples) {
      expect(s.code).toContain(baseApi.url)
    }
  })

  it("escapes double quotes in the URL", () => {
    const samples = codeSamples({ ...baseApi, url: `https://x.test/?a="b"` })
    for (const s of samples) {
      expect(s.code).not.toContain(`"b"`)
      expect(s.code).toContain(`\\"b\\"`)
    }
  })

  it("uses stable labels", () => {
    const labels = codeSamples(baseApi).map((s) => s.label)
    expect(labels).toEqual(["curl", "JavaScript", "Python", "Go"])
  })

  it("curl snippet is a single-line command", () => {
    const curl = codeSamples(baseApi).find((s) => s.id === "curl")!
    expect(curl.code.startsWith("curl")).toBe(true)
    expect(curl.code.includes("\n")).toBe(false)
  })

  it("fetch snippet calls .json()", () => {
    const fetch = codeSamples(baseApi).find((s) => s.id === "fetch")!
    expect(fetch.code).toMatch(/await fetch\(".*"\)/)
    expect(fetch.code).toMatch(/await res\.json\(\)/)
  })

  it("python snippet uses requests", () => {
    const py = codeSamples(baseApi).find((s) => s.id === "python")!
    expect(py.code).toMatch(/import requests/)
    expect(py.code).toMatch(/requests\.get\("https:\/\/[^"]+"/)
    expect(py.code).toMatch(/r\.raise_for_status\(\)/)
  })

  it("go snippet compiles a runnable main", () => {
    const go = codeSamples(baseApi).find((s) => s.id === "go")!
    expect(go.code).toMatch(/^package main/)
    expect(go.code).toMatch(/import \(/)
    expect(go.code).toMatch(/func main\(\)/)
    expect(go.code).toMatch(/http\.Get\(".*"\)/)
  })
})
