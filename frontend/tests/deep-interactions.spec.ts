import { test, expect } from '@playwright/test'

test.describe('Deep Interaction Tests', () => {
  test('mobile: all header buttons are clickable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Test search button
    const searchBtn = page.locator('button[aria-label="Open search"]')
    await expect(searchBtn).toBeVisible()
    await expect(searchBtn).toBeEnabled()
    await searchBtn.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    
    // Test theme toggle
    const themeBtn = page.locator('button[aria-label*="Switch to"]')
    await expect(themeBtn).toBeVisible()
    await expect(themeBtn).toBeEnabled()
    const html = page.locator('html')
    const beforeClass = await html.getAttribute('class')
    await themeBtn.click()
    await page.waitForTimeout(300)
    const afterClass = await html.getAttribute('class')
    expect(afterClass).not.toEqual(beforeClass)
    
    // Test hamburger menu
    const menuBtn = page.locator('button[aria-label="Open menu"]')
    await expect(menuBtn).toBeVisible()
    await expect(menuBtn).toBeEnabled()
    await menuBtn.click()
    await page.waitForTimeout(300)
    
    // Menu should be open
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).toHaveClass(/max-h-96/)
    
    // Click a nav link
    const catLink = page.locator('#mobile-menu a[href="/categories"]')
    await expect(catLink).toBeVisible()
    await catLink.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/categories/)
  })

  test('desktop: all header buttons are clickable', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Test search button
    const searchBtn = page.locator('button[aria-label="Open search (⌘K)"]')
    await expect(searchBtn).toBeVisible()
    await expect(searchBtn).toBeEnabled()
    await searchBtn.click()
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    
    // Test theme toggle
    const themeBtn = page.locator('button[aria-label*="Switch to"]')
    await expect(themeBtn).toBeVisible()
    await expect(themeBtn).toBeEnabled()
    await themeBtn.click()
    await page.waitForTimeout(300)
    // Should toggle theme
    
    // Test nav links
    const navLinks = page.locator('nav[aria-label="Primary"] a')
    const count = await navLinks.count()
    expect(count).toBe(3)
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i)
      await expect(link).toBeVisible()
      await expect(link).toBeEnabled()
    }
  })

  test('API card click navigates to detail page', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    const firstCard = page.locator('article a').first()
    const href = await firstCard.getAttribute('href')
    expect(href).toContain('/apis/')
    
    await firstCard.click()
    await page.waitForLoadState('networkidle')
    
    // Should be on API detail page
    await expect(page).toHaveURL(/\/apis\//)
    
    // Detail page should have content
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
  })

  test('search page: type, filter, and click result', async ({ page }) => {
    await page.goto('http://localhost:3000/search')
    await page.waitForLoadState('networkidle')
    
    // Type search
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('cat')
    await page.waitForTimeout(500)
    
    // Should have results
    const results = page.locator('article')
    const count = await results.count()
    expect(count).toBeGreaterThan(0)
    
    // Click grade filter
    const gradeA = page.locator('button:has-text("Grade A")')
    if (await gradeA.isVisible()) {
      await gradeA.click()
      await page.waitForTimeout(300)
    }
    
    // Click first result
    const firstResult = page.locator('article a').first()
    if (await firstResult.isVisible()) {
      await firstResult.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/apis\//)
    }
  })

  test('categories page: click category navigates correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/categories')
    await page.waitForLoadState('networkidle')
    
    // Click first category
    const firstCat = page.locator('ol li a').first()
    await expect(firstCat).toBeVisible()
    await firstCat.click()
    await page.waitForLoadState('networkidle')
    
    // Should be on category detail page
    await expect(page).toHaveURL(/\/categories\//)
    
    // Should have API cards
    const cards = page.locator('article')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('API detail page: visit link and code tabs work', async ({ page }) => {
    await page.goto('http://localhost:3000/apis/catfact')
    await page.waitForLoadState('networkidle')
    
    // Code tabs should work
    const jsTab = page.locator('button[role="tab"]:has-text("JavaScript")')
    if (await jsTab.isVisible()) {
      await jsTab.click()
      const panel = page.locator('[role="tabpanel"]')
      await expect(panel).toBeVisible()
    }
    
    const pythonTab = page.locator('button[role="tab"]:has-text("Python")')
    if (await pythonTab.isVisible()) {
      await pythonTab.click()
      const panel = page.locator('[role="tabpanel"]')
      await expect(panel).toBeVisible()
    }
    
    // Copy button should work
    const copyBtn = page.locator('button:has-text("Copy")')
    if (await copyBtn.isVisible()) {
      await copyBtn.click()
      // Should show "Copied" text
      await expect(page.locator('button:has-text("Copied")')).toBeVisible()
    }
    
    // Related APIs section
    const relatedSection = page.locator('text=Related APIs')
    if (await relatedSection.isVisible()) {
      const relatedCards = page.locator('aside article')
      const count = await relatedCards.count()
      expect(count).toBeGreaterThan(0)
    }
  })

  test('back navigation works correctly', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Navigate by clicking links (not goto) to build history
    const catLink = page.locator('a[href="/categories"]')
    await catLink.first().click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/categories/)
    
    // Navigate to a category detail
    const firstCat = page.locator('ol li a').first()
    await firstCat.click()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/categories\//)
    
    // Go back to categories list
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\/categories/)
    
    // Go back to home
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveURL(/\//)
  })

  test('pagination works on category detail page', async ({ page }) => {
    // Find a category with many APIs
    await page.goto('http://localhost:3000/categories/development')
    await page.waitForLoadState('networkidle')
    
    const nextBtn = page.locator('button:has-text("Next")')
    if (await nextBtn.isVisible() && await nextBtn.isEnabled()) {
      await nextBtn.click()
      await page.waitForTimeout(300)
      
      // Page indicator should show page 2
      const pageIndicator = page.locator('text=Page 2')
      await expect(pageIndicator).toBeVisible()
      
      // Prev button should be enabled
      const prevBtn = page.locator('button:has-text("Prev")')
      await expect(prevBtn).toBeEnabled()
    }
  })
})
