/**
 * Tests for the URL helpers in `@/lib/links`.
 *
 * `internalHref` and `safeHref` are pure functions — easy to test
 * directly. `BASE_PATH` is read from the environment at module-load
 * time, so we verify the resolved value rather than trying to mutate
 * env vars after import (Node caches modules; re-importing with a
 * different env is flaky under Vitest's module graph).
 */
import { describe, it, expect } from "vitest"
import { internalHref, safeHref, BASE_PATH, DATA_PATH } from "@/lib/links"

describe("BASE_PATH", () => {
  it("is a string (empty in dev, prefixed in prod export)", () => {
    expect(typeof BASE_PATH).toBe("string")
  })

  it("never carries a trailing slash", () => {
    expect(BASE_PATH.endsWith("/")).toBe(false)
  })
})

describe("DATA_PATH", () => {
  it("is BASE_PATH + /data", () => {
    expect(DATA_PATH).toBe(`${BASE_PATH}/data`)
  })
})

describe("internalHref", () => {
  it("prefixes a root-relative path with BASE_PATH", () => {
    expect(internalHref("/categories")).toBe(`${BASE_PATH}/categories`)
    expect(internalHref("/apis/foo")).toBe(`${BASE_PATH}/apis/foo`)
  })

  it("adds a leading slash when missing", () => {
    expect(internalHref("categories")).toBe(`${BASE_PATH}/categories`)
  })

  it("returns the root when given the root", () => {
    expect(internalHref("/")).toBe(`${BASE_PATH}/`)
  })

  it("passes http(s) URLs through untouched", () => {
    expect(internalHref("https://example.com/foo")).toBe("https://example.com/foo")
    expect(internalHref("http://example.com/bar")).toBe("http://example.com/bar")
  })

  it("handles a path that already starts with BASE_PATH", () => {
    // Not a real use case, but the function should be deterministic:
    // it always prepends BASE_PATH to non-http inputs.
    expect(internalHref(`${BASE_PATH}/x`)).toBe(`${BASE_PATH}${BASE_PATH}/x`)
  })
})

describe("safeHref", () => {
  it("accepts http and https URLs", () => {
    expect(safeHref("https://api.example.com/v1")).toBe("https://api.example.com/v1")
    expect(safeHref("http://api.example.com/v1")).toBe("http://api.example.com/v1")
  })

  it("rejects non-http schemes", () => {
    expect(safeHref("javascript:alert(1)")).toBeNull()
    expect(safeHref("data:text/html,<script>")).toBeNull()
    expect(safeHref("ftp://example.com")).toBeNull()
    expect(safeHref("mailto:foo@bar.com")).toBeNull()
  })

  it("rejects empty / nullish input", () => {
    expect(safeHref(null)).toBeNull()
    expect(safeHref(undefined)).toBeNull()
    expect(safeHref("")).toBeNull()
    expect(safeHref("   ")).toBeNull()
  })

  it("rejects URLs containing whitespace / control chars", () => {
    expect(safeHref("https://example.com/ evil")).toBeNull()
    expect(safeHref("https://example.com/\tfoo")).toBeNull()
    expect(safeHref("https://example.com/\nfoo")).toBeNull()
  })

  it("trims surrounding whitespace before validating", () => {
    expect(safeHref("  https://example.com/v1  ")).toBe("https://example.com/v1")
  })
})
