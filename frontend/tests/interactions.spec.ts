import { test, expect } from '@playwright/test'

test.describe('Header Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
  })

  test('mobile menu button should open and close sidebar', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Find hamburger menu button
    const menuButton = page.locator('button[aria-label="Open menu"]')
    await expect(menuButton).toBeVisible()
    
    // Click to open
    await menuButton.click()
    
    // Wait for menu to appear - check for the open state class
    const mobileMenu = page.locator('#mobile-menu')
    await expect(mobileMenu).toHaveClass(/max-h-96/)
    
    // Check that backdrop appears
    const backdrop = page.locator('.fixed.inset-0.bg-black\\/20')
    await expect(backdrop).toBeVisible()
    
    // Click backdrop to close
    await backdrop.click()
    
    // Menu should be closed - check for the closed state class
    await expect(mobileMenu).toHaveClass(/max-h-0/)
  })

  test('theme toggle button should switch themes', async ({ page }) => {
    // Find theme toggle button (moon/sun icon)
    const themeButton = page.locator('button[aria-label*="Switch to"]')
    await expect(themeButton).toBeVisible()
    
    // Get initial theme
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')
    
    // Click to toggle theme
    await themeButton.click()
    await page.waitForTimeout(300)
    
    // Check that class changed
    const newClass = await html.getAttribute('class')
    expect(newClass).not.toEqual(initialClass)
    
    // Click again to toggle back
    await themeButton.click()
    await page.waitForTimeout(300)
    
    const finalClass = await html.getAttribute('class')
    expect(finalClass).toEqual(initialClass)
  })

  test('search button should open command palette', async ({ page }) => {
    // Desktop search button
    const searchButton = page.locator('button[aria-label="Open search (⌘K)"]')
    
    // Check if visible (desktop)
    if (await searchButton.isVisible()) {
      await searchButton.click()
      
      // Command palette should appear
      const commandPalette = page.locator('[role="dialog"]')
      await expect(commandPalette).toBeVisible()
      
      // Close with Escape
      await page.keyboard.press('Escape')
      await expect(commandPalette).not.toBeVisible()
    }
  })

  test('mobile search button should open command palette', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Mobile search button
    const searchButton = page.locator('button[aria-label="Open search"]')
    await expect(searchButton).toBeVisible()
    
    await searchButton.click()
    
    // Command palette should appear
    const commandPalette = page.locator('[role="dialog"]')
    await expect(commandPalette).toBeVisible()
    
    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(commandPalette).not.toBeVisible()
  })

  test('navigation links should work', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    
    // Test desktop nav - use more specific selector
    const categoriesLink = page.locator('nav[aria-label="Primary"] a[href="/categories"]')
    
    if (await categoriesLink.isVisible()) {
      await categoriesLink.click()
      await page.waitForLoadState('networkidle')
      
      // Should be on categories page
      await expect(page).toHaveURL(/\/categories/)
      
      // Go back
      await page.goBack()
      await page.waitForLoadState('networkidle')
    }
  })

  test('mobile navigation links should work', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open menu
    const menuButton = page.locator('button[aria-label="Open menu"]')
    await menuButton.click()
    await page.waitForTimeout(300)
    
    // Click categories link
    const categoriesLink = page.locator('#mobile-menu a[href="/categories"]')
    await expect(categoriesLink).toBeVisible()
    await categoriesLink.click()
    
    await page.waitForLoadState('networkidle')
    
    // Should be on categories page
    await expect(page).toHaveURL(/\/categories/)
  })

  test('keyboard shortcut Cmd+K should open command palette', async ({ page }) => {
    // Press Cmd+K (or Ctrl+K on Windows/Linux)
    await page.keyboard.press('Control+k')
    
    // Command palette should appear
    const commandPalette = page.locator('[role="dialog"]')
    await expect(commandPalette).toBeVisible()
    
    // Close with Escape
    await page.keyboard.press('Escape')
    await expect(commandPalette).not.toBeVisible()
  })
})

test.describe('API Card Interactions', () => {
  test('API cards should be clickable and navigate', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Find first API card
    const apiCard = page.locator('article').first()
    await expect(apiCard).toBeVisible()
    
    // Find the link inside
    const apiLink = apiCard.locator('a').first()
    const href = await apiLink.getAttribute('href')
    
    // Click the card
    await apiLink.click()
    await page.waitForLoadState('networkidle')
    
    // Should navigate to API detail page
    await expect(page).toHaveURL(new RegExp(href!))
  })
})

test.describe('Search Interactions', () => {
  test('search input should accept text and show results', async ({ page }) => {
    await page.goto('http://localhost:3000/search')
    await page.waitForLoadState('networkidle')
    
    // Find search input
    const searchInput = page.locator('input[type="search"]')
    await expect(searchInput).toBeVisible()
    
    // Type search query
    await searchInput.fill('weather')
    await page.waitForTimeout(500) // Wait for debounce
    
    // Results should appear
    const results = page.locator('article')
    await expect(results.first()).toBeVisible()
  })

  test('filter buttons should work', async ({ page }) => {
    await page.goto('http://localhost:3000/search')
    await page.waitForLoadState('networkidle')
    
    // Type something first
    const searchInput = page.locator('input[type="search"]')
    await searchInput.fill('api')
    await page.waitForTimeout(500)
    
    // Click grade filter
    const gradeButton = page.locator('button:has-text("Grade A")')
    if (await gradeButton.isVisible()) {
      await gradeButton.click()
      await page.waitForTimeout(300)
      
      // Button should be active
      await expect(gradeButton).toHaveClass(/bg-\[var\(--ink\)\]/)
    }
  })
})

test.describe('Responsive Design', () => {
  test('should adapt to mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Desktop nav should be hidden
    const desktopNav = page.locator('nav.hidden.md\\:flex')
    await expect(desktopNav).not.toBeVisible()
    
    // Mobile menu button should be visible
    const mobileMenuButton = page.locator('button[aria-label="Open menu"]')
    await expect(mobileMenuButton).toBeVisible()
  })

  test('should adapt to tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    
    // Desktop nav should be visible
    const desktopNav = page.locator('nav.hidden.md\\:flex')
    await expect(desktopNav).toBeVisible()
    
    // Mobile menu button should be hidden
    const mobileMenuButton = page.locator('button[aria-label="Open menu"]')
    await expect(mobileMenuButton).not.toBeVisible()
  })
})
