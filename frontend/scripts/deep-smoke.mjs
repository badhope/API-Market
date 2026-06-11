// Deep interaction test: mobile menu, theme toggle, keyboard nav,
// form submit. Treats the site as a human would — click, type, tab.
/* eslint-disable no-console -- this is a CLI reporter */
import { chromium } from "playwright"
import { mkdir, writeFile } from "node:fs/promises"

const BASE = "http://localhost:3000"
const SHOTS = "/tmp/api-market-shots"
await mkdir(SHOTS, { recursive: true })

const errors = []
const consoleErrors = []
const browser = await chromium.launch()

async function newPage(viewport) {
  const ctx = await browser.newContext({ viewport, hasTouch: viewport.width < 768 })
  const p = await ctx.newPage()
  p.on("pageerror", (e) => errors.push({ msg: e.message, stack: e.stack }))
  p.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text()
      if (!t.includes("404") || !m.location().url?.includes("this-does-not-exist")) {
        consoleErrors.push(t)
      }
    }
  })
  return p
}

// 1. MOBILE MENU TOGGLE
console.log("→ mobile menu toggle")
{
  const page = await newPage({ width: 390, height: 844 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  // wait for the client-side hydration to mount the menu button
  await page.waitForSelector("button[aria-controls='mobile-menu']", { timeout: 10_000 })
  const menu = page.locator("button[aria-controls='mobile-menu']")
  await menu.click()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/20-mobile-menu-open.png`, fullPage: true })
  const expanded = await menu.getAttribute("aria-expanded")
  if (expanded !== "true") errors.push({ msg: `mobile menu aria-expanded=${expanded}, want true` })
  // click a nav item → menu should close
  const cat = page.locator("#mobile-menu").getByRole("link", { name: "Categories" })
  await cat.click()
  await page.waitForTimeout(800)
  const expanded2 = await menu.getAttribute("aria-expanded")
  if (expanded2 !== "false") errors.push({ msg: `mobile menu still open after click (aria-expanded=${expanded2})` })
  // escape closes
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await page.waitForSelector("button[aria-controls='mobile-menu']", { timeout: 10_000 })
  await page.locator("button[aria-controls='mobile-menu']").click()
  await page.waitForTimeout(300)
  await page.keyboard.press("Escape")
  await page.waitForTimeout(300)
  const expanded3 = await page.locator("button[aria-controls='mobile-menu']").getAttribute("aria-expanded")
  if (expanded3 !== "false") errors.push({ msg: `Escape did not close menu (aria-expanded=${expanded3})` })
}

// 2. THEME TOGGLE
console.log("→ theme toggle")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  const html = page.locator("html")
  const before = await html.getAttribute("class")
  await page.getByRole("button", { name: /switch to .* theme/i }).click()
  await page.waitForTimeout(400)
  const after = await html.getAttribute("class")
  if (before === after) errors.push({ msg: "theme toggle did not change <html> class" })
  await page.screenshot({ path: `${SHOTS}/21-theme-toggled.png`, fullPage: true })
  // toggle back
  await page.getByRole("button", { name: /switch to .* theme/i }).click()
  await page.waitForTimeout(300)
  const final = await html.getAttribute("class")
  if (final !== before) errors.push({ msg: `theme toggle did not return to original (${final} vs ${before})` })
}

// 3. KEYBOARD NAV (Tab through focusable elements)
console.log("→ keyboard tab nav")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  const focusables = []
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press("Tab")
    const focused = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el === document.body) return null
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent || "").trim().slice(0, 30),
        aria: el.getAttribute("aria-label"),
        href: el.getAttribute("href"),
      }
    })
    if (focused) focusables.push(focused)
  }
  if (focusables.length < 5) errors.push({ msg: `only ${focusables.length} tab stops found` })
  console.log(`   ${focusables.length} focusable stops, first 5:`)
  for (const f of focusables.slice(0, 5)) console.log(`     ${f.tag} ${f.aria || f.text || f.href}`)
}

// 4. SEARCH FORM SUBMIT
console.log("→ search form submit")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  const search = page.getByRole("searchbox").first()
  await search.fill("weather")
  await search.press("Enter")
  await page.waitForTimeout(1500)
  const url = page.url()
  if (!url.includes("/search")) errors.push({ msg: `search submit did not navigate to /search (url=${url})` })
  await page.screenshot({ path: `${SHOTS}/22-search-submit.png`, fullPage: true })
}

// 5. COMMAND PALETTE CLICK NAVIGATION
console.log("→ command palette click")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  // click the search trigger instead of keyboard
  await page.getByRole("button", { name: /open search/i }).first().click()
  await page.waitForTimeout(500)
  await page.locator('[cmdk-input], input[placeholder*="Search" i]').first().fill("cat")
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${SHOTS}/23-palette-typed.png`, fullPage: true })
  // pick first option
  const opt = page.locator('[cmdk-item], [role="option"]').first()
  if (await opt.count()) {
    await opt.click()
    await page.waitForTimeout(800)
    const url = page.url()
    if (url === `${BASE}/`) errors.push({ msg: `palette click did not navigate (still on ${url})` })
    await page.screenshot({ path: `${SHOTS}/24-palette-clicked.png`, fullPage: true })
  } else {
    errors.push({ msg: "no palette options found after typing 'cat'" })
  }
}

// 6. EXTERNAL LINK (GitHub icon)
console.log("→ external link")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  const gh = page.getByRole("link", { name: /view source on github/i })
  const target = await gh.getAttribute("target")
  const rel = await gh.getAttribute("rel")
  if (target !== "_blank") errors.push({ msg: `github link target=${target}, want _blank` })
  if (!rel?.includes("noopener")) errors.push({ msg: `github link rel=${rel}, missing noopener` })
}

// 7. FOCUS RING VISIBLE
console.log("→ focus ring")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await page.keyboard.press("Tab")
  await page.keyboard.press("Tab")
  const visible = await page.evaluate(() => {
    const el = document.activeElement
    if (!el) return false
    const cs = getComputedStyle(el)
    return cs.outlineStyle !== "none" || cs.boxShadow !== "none"
  })
  if (!visible) errors.push({ msg: "no focus indicator on second tab stop" })
}

// 8. PERSIST THEME ACROSS RELOAD
console.log("→ theme persistence")
{
  const page = await newPage({ width: 1440, height: 900 })
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" })
  await page.getByRole("button", { name: /switch to .* theme/i }).click()
  await page.waitForTimeout(400)
  await page.reload({ waitUntil: "networkidle" })
  const html = page.locator("html")
  const cls = await html.getAttribute("class")
  if (!cls?.includes("dark")) errors.push({ msg: `theme did not persist across reload (class=${cls})` })
}

await writeFile(`${SHOTS}/deep.json`, JSON.stringify({ errors, consoleErrors }, null, 2))
console.log(`\n=== ${errors.length} INTERACTION ERRORS ===`)
for (const e of errors) console.log(`  - ${e.msg}` + (e.stack ? "\n    " + e.stack.split("\n").slice(0, 3).join("\n    ") : ""))
console.log(`\n=== ${consoleErrors.length} CONSOLE ERRORS ===`)
for (const c of consoleErrors) console.log(`  - ${c}`)

await browser.close()
process.exit(errors.length > 0 ? 1 : 0)
