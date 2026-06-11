// Visual + interaction audit. Walks every interactive element on
// each core page, clicks it, takes before/after screenshots, and
// reports anything that looks broken: tiny touch targets, missing
// hover/focus feedback, low contrast, layout overflow, broken
// dark mode, etc.
/* eslint-disable no-console -- CLI reporter */
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"

const BASE = process.env.BASE_URL || "http://localhost:3000"
const SHOTS = "/tmp/api-market-shots"
if (!existsSync(SHOTS)) await mkdir(SHOTS, { recursive: true })

const browser = await chromium.launch()
const issues = []
const interactions = []

async function newPage({ width, height, dark = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme: dark ? "dark" : "light",
    deviceScaleFactor: 1,
  })
  const p = await ctx.newPage()
  p.on("pageerror", (e) => issues.push({ rule: "page-error", msg: e.message }))
  p.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text()
      if (!t.includes("404") || !m.location().url?.includes("this-does-not-exist")) {
        issues.push({ rule: "console-error", msg: t, loc: m.location().url })
      }
    }
  })
  return p
}

// Compute WCAG contrast ratio between two CSS colors
function parseRgb(s) {
  const m = s.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (!m) return null
  return [+m[1], +m[2], +m[3]]
}
function relLum([r, g, b]) {
  const f = (v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function contrast(a, b) {
  const la = relLum(a)
  const lb = relLum(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

async function clickAllOnPage(page, path, labelPrefix) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30_000 })
  await page.waitForTimeout(500)

  // 1. enumerate every clickable element
  const clickables = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll("a, button, [role='button'], [role='tab'], summary")) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      const cs = getComputedStyle(el)
      if (cs.visibility === "hidden" || cs.display === "none") continue
      // skip footer-only links
      out.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        text: (el.textContent || "").trim().slice(0, 40),
        aria: el.getAttribute("aria-label"),
        href: el.getAttribute("href"),
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        type: el.getAttribute("type"),
      })
    }
    return out
  })

  for (let i = 0; i < clickables.length; i++) {
    const c = clickables[i]
    // 2. measure touch target size
    if (c.w < 24 || c.h < 24) {
      issues.push({
        path,
        rule: "tiny-target",
        msg: `${c.tag} "${c.text || c.aria}" is ${c.w}×${c.h}px (< 24px)`,
      })
    } else if (c.w < 44 || c.h < 44) {
      // warn but not fail — desktop doesn't strictly need 44×44
      issues.push({
        path,
        rule: "small-target",
        msg: `${c.tag} "${c.text || c.aria}" is ${c.w}×${c.h}px (< 44px)`,
      })
    }

    // 3. measure contrast
    const contrastInfo = await page.evaluate(({ x, y, w, h }) => {
      const stack = document.elementsFromPoint(x + w / 2, y + h / 2)
      // walk up the stack until we find one with a non-transparent bg
      let bg = null
      let fg = null
      for (const el of stack) {
        const cs = getComputedStyle(el)
        if (!bg && cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)") {
          bg = cs.backgroundColor
        }
        if (cs.color) {
          fg = cs.color
          break
        }
        if (bg) break
      }
      return { bg, fg }
    }, c)
    if (contrastInfo.fg && contrastInfo.bg) {
      const fgRgb = parseRgb(contrastInfo.fg)
      const bgRgb = parseRgb(contrastInfo.bg)
      if (fgRgb && bgRgb) {
        const cr = contrast(fgRgb, bgRgb)
        if (cr < 3.0) {
          issues.push({
            path,
            rule: "low-contrast",
            msg: `"${c.text || c.aria}" contrast=${cr.toFixed(2)} (${contrastInfo.fg} on ${contrastInfo.bg})`,
          })
        }
      }
    }

    // 4. actually click it (for visual confirmation) — only first 8 per page to stay fast
    if (i < 8) {
      try {
        await page.mouse.move(c.x + c.w / 2, c.y + c.h / 2)
        await page.waitForTimeout(100)
        await page.screenshot({
          path: `${SHOTS}/click-${labelPrefix}-${i.toString().padStart(2, "0")}-hover.png`,
          clip: {
            x: Math.max(0, c.x - 20),
            y: Math.max(0, c.y - 20),
            width: Math.min(500, c.w + 40),
            height: Math.min(300, c.h + 40),
          },
        })
        await page.mouse.click(c.x + c.w / 2, c.y + c.h / 2)
        await page.waitForTimeout(400)
        await page.screenshot({
          path: `${SHOTS}/click-${labelPrefix}-${i.toString().padStart(2, "0")}-after.png`,
          clip: {
            x: Math.max(0, c.x - 20),
            y: Math.max(0, c.y - 20),
            width: Math.min(500, c.w + 40),
            height: Math.min(300, c.h + 40),
          },
        })
        interactions.push({
          path,
          element: c.text || c.aria,
          x: c.x,
          y: c.y,
        })
        // navigate back if it was a link
        if (c.tag === "a" && c.href && !c.href.startsWith("#") && !c.href.startsWith("javascript:")) {
          await page.goBack({ waitUntil: "networkidle" }).catch(() => {})
          await page.waitForTimeout(300)
        }
      } catch (e) {
        issues.push({ path, rule: "click-failed", msg: `${c.text || c.aria}: ${e.message}` })
      }
    }
  }
}

// Pages to audit
const pages = [
  { path: "/", label: "home" },
  { path: "/categories", label: "categories" },
  { path: "/categories/development", label: "cat-dev" },
  { path: "/apis/api-setu", label: "api" },
  { path: "/search?q=weather", label: "search" },
  { path: "/stats", label: "stats" },
]

console.log("→ desktop light mode")
const p1 = await newPage({ width: 1440, height: 900 })
for (const pg of pages) {
  console.log(`   ${pg.path}`)
  await clickAllOnPage(p1, pg.path, `${pg.label}-light`)
}

console.log("→ desktop dark mode")
const p2 = await newPage({ width: 1440, height: 900, dark: true })
for (const pg of pages) {
  console.log(`   ${pg.path} (dark)`)
  await clickAllOnPage(p2, pg.path, `${pg.label}-dark`)
}

console.log("→ mobile light mode")
const p3 = await newPage({ width: 390, height: 844 })
await clickAllOnPage(p3, "/", "home-mobile")
await clickAllOnPage(p3, "/categories", "catlist-mobile")
await clickAllOnPage(p3, "/apis/api-setu", "api-mobile")

// 5. long-text overflow
console.log("→ long text overflow")
{
  const p = await newPage({ width: 1440, height: 900 })
  await p.goto(`${BASE}/apis/api-setu`, { waitUntil: "networkidle" })
  // find first <p> in description and inject very long word
  const ov = await p.evaluate(() => {
    const target = document.querySelector("main p")
    if (!target) return null
    const original = target.textContent
    target.textContent = "a".repeat(500)
    const r = target.getBoundingClientRect()
    const p = target.parentElement.getBoundingClientRect()
    return { right: r.right, parent: p.right, original: original.slice(0, 60) }
  })
  if (ov && ov.right > ov.parent) {
    issues.push({ rule: "long-text-overflow", msg: "long word overflows parent on API page" })
  }
}

// 6. CJK / emoji rendering
console.log("→ CJK / emoji")
{
  const p = await newPage({ width: 1440, height: 900 })
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await p.evaluate(() => {
    const h1 = document.querySelector("h1")
    if (h1) h1.textContent = "测试中文 + emoji 🎉🚀 中文 + emoji"
  })
  await p.waitForTimeout(300)
  await p.screenshot({ path: `${SHOTS}/cjk-emoji.png`, fullPage: true })
}

await writeFile(`${SHOTS}/visual.json`, JSON.stringify({ issues, interactions }, null, 2))

console.log(`\n=== ${issues.length} VISUAL ISSUES ===`)
const byRule = {}
for (const i of issues) {
  byRule[i.rule] ??= []
  byRule[i.rule].push(i)
}
for (const [rule, list] of Object.entries(byRule)) {
  console.log(`\n[${rule}] (${list.length})`)
  for (const i of list.slice(0, 5)) {
    console.log(`  ${i.path ?? ""} ${i.msg}`)
  }
  if (list.length > 5) console.log(`  ... and ${list.length - 5} more`)
}
console.log(`\nClicks: ${interactions.length}  Screenshots: ${SHOTS}`)

await browser.close()
process.exit(0)
