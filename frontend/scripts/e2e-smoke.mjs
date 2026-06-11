// E2E sanity smoke for the API-Market frontend.
// Walks every visible route, exercises the search/command-palette
// interactions, captures console + network errors, and saves
// screenshots to /tmp/api-market-shots/.
/* eslint-disable no-console -- this is a CLI reporter */
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"

const BASE = process.env.BASE_URL || "http://localhost:3000"
const OUT = "/tmp/api-market-shots"

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})

const errors = []
const requestFails = []
const consoleMsgs = []
const pageReports = []

function attachWatchers(page, label) {
  page.on("console", async (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const loc = msg.location()
      const text = msg.text()
      // Browsers always log a console.error for any 4xx/5xx network
      // response. The intentional 404 for the not-found probe is
      // expected and shouldn't fail the smoke run.
      if (text.includes("404") && loc.url?.includes("this-does-not-exist")) {
        return
      }
      consoleMsgs.push({
        label,
        type: msg.type(),
        text: msg.text(),
        url: loc.url,
        line: loc.lineNumber,
        args: msg
          .args()
          .map((a) => {
            try {
              return a.toString().slice(0, 300)
            } catch {
              return "<unserializable>"
            }
          })
          .join(" | "),
      })
    }
  })
  page.on("pageerror", (err) => {
    errors.push({ label, msg: err.message, stack: err.stack })
  })
  page.on("requestfinished", async (req) => {
    try {
      const res = await req.response()
      if (!res) return
      if (res.status() >= 400 && !res.url().includes("this-does-not-exist")) {
        consoleMsgs.push({
          label,
          type: "error",
          text: `${res.status()} ${res.url()} (failed)`,
        })
      }
    } catch {}
  })
  page.on("response", (res) => {
    const status = res.status()
    if (status >= 400) {
      // 404 for the explicit "not found" route is expected.
      if (status === 404 && res.url().includes("this-does-not-exist")) return
      requestFails.push({ label, url: res.url(), status })
    }
  })
  page.on("requestfailed", (req) => {
    requestFails.push({ label, url: req.url(), reason: req.failure()?.errorText })
  })
}

async function shot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
}

async function visit(page, path, name) {
  const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 30_000 })
  if (!res) throw new Error(`no response for ${path}`)
  await page.waitForTimeout(400)
  await shot(page, name)
  return { path, status: res.status(), title: await page.title() }
}

const page = await ctx.newPage()
attachWatchers(page, "main")

const routes = [
  { path: "/", name: "01-home" },
  { path: "/categories", name: "02-categories" },
  { path: "/search", name: "03-search" },
  { path: "/stats", name: "04-stats" },
  { path: "/this-does-not-exist-12345", name: "05-not-found" },
]

for (const r of routes) {
  try {
    pageReports.push(await visit(page, r.path, r.name))
  } catch (e) {
    errors.push({ label: r.name, msg: e.message })
  }
}

const cats = await page.evaluate(async () => {
  const r = await fetch("/data/categories.json")
  return (await r.json()).items
})
const sample = cats.slice(0, 5)
for (const c of sample) {
  try {
    pageReports.push(
      await visit(page, `/categories/${c.id}`, `06-cat-${c.id}`),
    )
  } catch (e) {
    errors.push({ label: `cat-${c.id}`, msg: e.message })
  }
}

const apis = await page.evaluate(async () => {
  const r = await fetch("/data/all.json")
  return r.json()
})
const apiSample = apis.slice(0, 5)
for (const a of apiSample) {
  try {
    pageReports.push(
      await visit(page, `/apis/${a.id}`, `07-api-${a.id}`),
    )
  } catch (e) {
    errors.push({ label: `api-${a.id}`, msg: e.message })
  }
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
const search = page.getByRole("searchbox").first()
if (await search.count()) {
  await search.fill("weather")
  await page.waitForTimeout(300)
  await shot(page, "08-home-search-typed")
  await search.press("Enter")
  await page.waitForTimeout(1500)
  await shot(page, "09-home-search-results")
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
const isMac = process.platform === "darwin"
await page.keyboard.press(isMac ? "Meta+K" : "Control+K")
await page.waitForTimeout(500)
await shot(page, "10-cmdk-open")
const paletteInput = page.locator('[cmdk-input], input[placeholder*="Search" i]').first()
if (await paletteInput.count()) {
  await paletteInput.fill("cat")
  await page.waitForTimeout(400)
  await shot(page, "11-cmdk-typed")
  await page.keyboard.press("Escape")
}

await page.goto(`${BASE}/categories`, { waitUntil: "networkidle" })
const firstLink = page.getByRole("link").filter({ hasText: /./ }).nth(2)
if (await firstLink.count()) {
  await firstLink.click().catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, "12-categories-first-click")
}

await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
const apiLink = page.getByRole("link").filter({ hasText: /View|Detail|→|›/i }).first()
if (await apiLink.count()) {
  await apiLink.click().catch(() => {})
  await page.waitForTimeout(1000)
  await shot(page, "13-api-detail-click")
}

await page.goto(`${BASE}/search?q=weather`, { waitUntil: "networkidle" })
await page.waitForTimeout(800)
await shot(page, "14-search-results")

const mob = await browser.newContext({ viewport: { width: 390, height: 844 } })
const mp = await mob.newPage()
attachWatchers(mp, "mobile")
await mp.goto(`${BASE}/`, { waitUntil: "networkidle" })
await mp.screenshot({ path: `${OUT}/15-mobile-home.png`, fullPage: true })
await mp.goto(`${BASE}/categories`, { waitUntil: "networkidle" })
await mp.screenshot({ path: `${OUT}/16-mobile-categories.png`, fullPage: true })
if (apiSample[0]) {
  await mp.goto(`${BASE}/apis/${apiSample[0].id}`, { waitUntil: "networkidle" })
  await mp.screenshot({ path: `${OUT}/17-mobile-api.png`, fullPage: true })
}

const report = {
  base: BASE,
  pages: pageReports,
  errors,
  consoleErrors: consoleMsgs.filter((m) => m.type === "error"),
  consoleWarnings: consoleMsgs.filter((m) => m.type === "warning"),
  requestFails,
}
await writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2))

console.log("\n=== PAGES ===")
for (const p of pageReports) console.log(`  ${p.status}  ${p.path}  ${p.title}`)
console.log("\n=== ERRORS ===")
for (const e of errors) console.log(`  ${e.label}: ${e.msg}`)
console.log("\n=== CONSOLE ERRORS ===")
for (const m of report.consoleErrors) {
  console.log(`  [${m.label}] ${m.text}`)
  if (m.url) console.log(`     at ${m.url}:${m.line}`)
  if (m.args) console.log(`     args: ${m.args}`)
}
console.log("\n=== CONSOLE WARNINGS ===")
for (const m of report.consoleWarnings) console.log(`  [${m.label}] ${m.text}`)
console.log("\n=== REQUEST FAILS (4xx/5xx/failed) ===")
for (const r of requestFails) console.log(`  [${r.label}] ${r.status ?? r.reason}  ${r.url}`)
console.log(`\nScreenshots: ${OUT}`)

await browser.close()
process.exit(errors.length > 0 || report.consoleErrors.length > 0 ? 1 : 0)
