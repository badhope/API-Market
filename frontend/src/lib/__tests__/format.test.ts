/**
 * Tests for the pure display-formatting helpers. No React, no DOM.
 */
import { describe, it, expect } from "vitest"
import { formatCount, indexNum, roman, formatDate, truncate } from "@/lib/format"

describe("formatCount", () => {
  it("renders < 1000 as a plain locale string", () => {
    expect(formatCount(0)).toBe("0")
    expect(formatCount(42)).toBe("42")
    expect(formatCount(999)).toBe("999")
  })

  it("renders 1k–9999 with one decimal and K suffix", () => {
    expect(formatCount(1_000)).toBe("1.0K")
    expect(formatCount(8_300)).toBe("8.3K")
    expect(formatCount(9_999)).toBe("10.0K")
  })

  it("renders 10k–999_999 as a full locale string (no K suffix)", () => {
    expect(formatCount(10_000)).toBe("10,000")
    expect(formatCount(14_405)).toBe("14,405")
    expect(formatCount(999_999)).toBe("999,999")
  })

  it("renders ≥ 1_000_000 with M suffix", () => {
    expect(formatCount(1_000_000)).toBe("1.0M")
    expect(formatCount(1_500_000)).toBe("1.5M")
    expect(formatCount(2_500_000)).toBe("2.5M")
  })
})

describe("indexNum", () => {
  it("pads to at least 3 digits", () => {
    expect(indexNum(1, 50)).toBe("001")
    expect(indexNum(7, 50)).toBe("007")
  })
  it("extends padding when total is wider", () => {
    expect(indexNum(1, 1234)).toBe("0001")
    expect(indexNum(999, 1234)).toBe("0999")
  })
})

describe("roman", () => {
  it("renders the standard cases", () => {
    expect(roman(1)).toBe("I")
    expect(roman(2)).toBe("II")
    expect(roman(3)).toBe("III")
    expect(roman(4)).toBe("IV")
    expect(roman(5)).toBe("V")
    expect(roman(9)).toBe("IX")
    expect(roman(10)).toBe("X")
    expect(roman(40)).toBe("XL")
    expect(roman(50)).toBe("L")
    expect(roman(90)).toBe("XC")
    expect(roman(100)).toBe("C")
    expect(roman(400)).toBe("CD")
    expect(roman(500)).toBe("D")
    expect(roman(900)).toBe("CM")
    expect(roman(1000)).toBe("M")
    expect(roman(1999)).toBe("MCMXCIX")
    expect(roman(2024)).toBe("MMXXIV")
  })
  it("renders 0 as empty string", () => {
    expect(roman(0)).toBe("")
  })
})

describe("formatDate", () => {
  it("returns em-dash for nullish or invalid input", () => {
    expect(formatDate(null)).toBe("—")
    expect(formatDate(undefined)).toBe("—")
    expect(formatDate("not a date")).toBe("—")
  })
  it("formats a plain YYYY-MM-DD as if it were UTC", () => {
    const formatted = formatDate("2024-03-12")
    expect(formatted).toMatch(/Mar/i)
    expect(formatted).toMatch(/2024/)
  })
  it("preserves the Z suffix and timezone offsets", () => {
    expect(formatDate("2024-03-12T15:30:00Z")).toMatch(/2024/)
  })
})

describe("truncate", () => {
  it("returns input unchanged when shorter than n", () => {
    expect(truncate("short", 100)).toBe("short")
  })
  it("cuts on the last space and adds an ellipsis", () => {
    const s = "The quick brown fox jumps over the lazy dog"
    const out = truncate(s, 20)
    expect(out.endsWith("…")).toBe(true)
    expect(out.length).toBeLessThanOrEqual(20)
    expect(out.includes(" ")).toBe(true)
  })
  it("falls back to a hard cut when there is no space", () => {
    expect(truncate("abcdefghij", 5)).toBe("abcde…")
  })
})
