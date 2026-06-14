import { test, expect } from '@playwright/test'

test.describe('Visual & Functional Checks', () => {
  test('homepage screenshot desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/home-desktop.png', fullPage: true })
  })

  test('homepage screenshot mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/home-mobile.png', fullPage: true })
  })

  test('categories page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/categories')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/categories-desktop.png', fullPage: true })
  })

  test('search page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/search')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/search-desktop.png', fullPage: true })
  })

  test('stats page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/stats')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/stats-desktop.png', fullPage: true })
  })

  test('API detail page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/apis/catfact')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/api-detail-desktop.png', fullPage: true })
  })

  test('category detail page screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/categories/animals')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: 'test-results/category-detail-desktop.png', fullPage: true })
  })

  test('mobile menu open screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    const menuButton = page.locator('button[aria-label="Open menu"]')
    await menuButton.click()
    await page.waitForTimeout(300)
    await page.screenshot({ path: 'test-results/mobile-menu-open.png', fullPage: true })
  })

  test('dark mode screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Switch to dark mode
    const themeButton = page.locator('button[aria-label*="Switch to"]')
    await themeButton.click()
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/home-dark.png', fullPage: true })
  })

  test('command palette screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    await page.keyboard.press('Control+k')
    await page.waitForTimeout(300)
    
    // Type in the command palette
    const input = page.locator('[role="dialog"] input')
    if (await input.isVisible()) {
      await input.fill('weather')
      await page.waitForTimeout(500)
    }
    
    await page.screenshot({ path: 'test-results/command-palette.png' })
  })

  test('search with results screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000/search')
    await page.waitForLoadState('networkidle')
    
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('weather')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test-results/search-results.png', fullPage: true })
  })

  test('check for console errors on homepage', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))
    
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    if (errors.length > 0) {
      /* eslint-disable no-console */
      console.log('Console errors found:')
      errors.forEach(e => console.log('  -', e))
      /* eslint-enable no-console */
    }
    expect(errors.length).toBe(0)
  })

  test('check for console errors on search page', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', (err) => errors.push(err.message))
    
    await page.goto('http://localhost:3000/search')
    await page.waitForLoadState('networkidle')
    
    // Type a search
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('api')
    await page.waitForTimeout(500)
    
    if (errors.length > 0) {
      /* eslint-disable no-console */
      console.log('Console errors found:')
      errors.forEach(e => console.log('  -', e))
      /* eslint-enable no-console */
    }
    expect(errors.length).toBe(0)
  })

  test('check all internal links are not broken', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Get all internal links
    const links = await page.locator('a[href^="/"]').all()
    const hrefs = new Set<string>()
    
    for (const link of links) {
      const href = await link.getAttribute('href')
      if (href && !href.startsWith('/_next')) {
        hrefs.add(href)
      }
    }
    
    // Check each link returns 200
    let brokenCount = 0
    for (const href of hrefs) {
      const response = await page.goto(`http://localhost:3000${href}`)
      const status = response?.status()
      if (status !== 200) {
        brokenCount++
      }
      expect([200, 301, 302, 304]).toContain(status)
    }
    expect(brokenCount).toBe(0)
  })
})
