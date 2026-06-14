// UX / a11y audit. Loads the home page, runs axe-core, then walks
// every visible element to check overflow / contrast / alt text.
/* eslint-disable no-console -- this is a CLI reporter */
import { chromium } from "playwright"
import { writeFile } from "node:fs/promises"

const BASE = process.env.BASE_URL || "http://localhost:3000"

const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const axeSrc = await (await fetch("https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js")).text()

const routes = [
  "/",
  "/categories",
  "/categories/development",
  "/apis/api-setu",
  "/search?q=weather",
  "/stats",
]

const issues = []
for (const path of routes) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30_000 })
  await page.waitForTimeout(500)

  // 1. inject axe and run
  await page.addScriptTag({ content: axeSrc })
  const axe = await page.evaluate(async () => {
    return await window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
    })
  })
  for (const v of axe.violations) {
    for (const n of v.nodes) {
      issues.push({
        path,
        rule: v.id,
        impact: v.impact,
        help: v.help,
        target: n.target,
        html: n.html?.slice(0, 200),
      })
    }
  }

  // 2. overflow check: ignore -mx-* hover-overlay rows (they're
  //    intentionally wider than their parent on hover).
  const overflows = await page.evaluate(() => {
    const out = []
    const all = document.querySelectorAll("body *")
    for (const el of all) {
      const cls = el.className?.toString() || ""
      if (cls.includes("-mx-")) continue
      const r = el.getBoundingClientRect()
      const p = el.parentElement?.getBoundingClientRect()
      if (!p) continue
      if (r.right > p.right + 1) {
        out.push({
          tag: el.tagName.toLowerCase(),
          class: cls.slice(0, 80),
          text: (el.textContent?.trim() || "").slice(0, 60),
          width: Math.round(r.width),
          right: Math.round(r.right),
          parent_right: Math.round(p.right),
        })
      }
    }
    return out.slice(0, 20)
  })
  for (const o of overflows) {
    issues.push({ path, rule: "overflow-x", ...o })
  }

  // 3. buttons / links without accessible name
  const nameless = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll("a, button, [role='button']")) {
      const hasText = el.textContent?.trim()
      const aria = el.getAttribute("aria-label")
      if (!hasText && !aria) {
        out.push({
          tag: el.tagName.toLowerCase(),
          html: el.outerHTML.slice(0, 150),
        })
      }
    }
    return out.slice(0, 10)
  })
  for (const n of nameless) {
    issues.push({ path, rule: "no-accessible-name", ...n })
  }

  // 4. images without alt
  const imgsNoAlt = await page.evaluate(() => {
    const out = []
    for (const el of document.querySelectorAll("img")) {
      if (el.getAttribute("alt") === null) {
        out.push({ src: el.getAttribute("src") })
      }
    }
    return out.slice(0, 5)
  })
  for (const i of imgsNoAlt) {
    issues.push({ path, rule: "img-no-alt", ...i })
  }
}

await writeFile("/tmp/api-market-shots/a11y.json", JSON.stringify(issues, null, 2))

console.log(`\n=== ${issues.length} ISSUES ===`)
const byPath = {}
for (const i of issues) {
  byPath[i.path] ??= []
  byPath[i.path].push(i)
}
for (const [p, list] of Object.entries(byPath)) {
  console.log(`\n${p} (${list.length})`)
  for (const i of list) {
    console.log(`  [${i.impact ?? "—"}] ${i.rule}: ${i.help ?? ""}`)
    if (i.html) console.log(`    ${i.html}`)
  }
}

await browser.close()
process.exit(0)
