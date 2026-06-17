// @vitest-environment jsdom
/**
 * Tests for the Header. The mobile menu panel is the most-likely-to-
 * regress piece of UI in this file, so we focus on that. We also
 * verify the search buttons dispatch the open-palette event.
 */
import type { ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { Header } from "@/components/layout/header"
import { OPEN_PALETTE_EVENT } from "@/components/codex/command-palette-root"

// next-themes reads localStorage and attaches an effect to the DOM.
// Stub it to keep the test environment pure.
vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  }),
}))

// next/link is fine in jsdom but we don't need to assert on navigation.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode
    href: string
    [k: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

beforeEach(() => {
  // jsdom doesn't have a "narrow" viewport by default. We just make
  // sure the test doesn't rely on a specific width — the responsive
  // classes are tailwind, applied at runtime. The point of these
  // tests is to assert the *behavior* of the menu, not the layout.
  Object.defineProperty(window, "innerWidth", { value: 375, configurable: true })
})

describe("<Header /> — mobile menu", () => {
  it("renders the brand and a hamburger button", () => {
    render(<Header />)
    expect(screen.getByLabelText("API-Market — Home")).toBeDefined()
    expect(screen.getByRole("button", { name: /open menu/i })).toBeDefined()
  })

  it("starts with the mobile menu collapsed", () => {
    const { container } = render(<Header />)
    const panel = container.querySelector("#mobile-menu") as HTMLElement
    expect(panel).toBeDefined()
    // the collapsed class gives max-h-0 and opacity-0
    expect(panel.className).toMatch(/max-h-0/)
  })

  it("opens the mobile menu when the hamburger is clicked", () => {
    const { container } = render(<Header />)
    const toggle = screen.getByRole("button", { name: /open menu/i })
    act(() => { fireEvent.click(toggle) })
    const panel = container.querySelector("#mobile-menu") as HTMLElement
    expect(panel.className).toMatch(/max-h-96/)
    // Toggle button should now read "Close menu"
    expect(screen.getByRole("button", { name: /close menu/i })).toBeDefined()
  })

  it("closes the mobile menu when the close button is clicked", () => {
    const { container } = render(<Header />)
    const open = screen.getByRole("button", { name: /open menu/i })
    act(() => { fireEvent.click(open) })
    const close = screen.getByRole("button", { name: /close menu/i })
    act(() => { fireEvent.click(close) })
    const panel = container.querySelector("#mobile-menu") as HTMLElement
    expect(panel.className).toMatch(/max-h-0/)
  })

  it("renders all primary nav links inside the mobile panel", () => {
    const { container } = render(<Header />)
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /open menu/i }))
    })
    const panel = container.querySelector("#mobile-menu") as HTMLElement
    // The mobile panel is the one with the mobile nav aria-label.
    const mobileNav = panel.querySelector('[aria-label="Mobile primary"]')
    expect(mobileNav).toBeDefined()
    const links = mobileNav!.querySelectorAll("a")
    const hrefs = [...links].map((a) => a.getAttribute("href"))
    // `internalHref` prefixes the deployment basePath on every
    // internal link, so we assert by suffix rather than full URL.
    expect(hrefs).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/\/categories$/),
        expect.stringMatching(/\/search$/),
        expect.stringMatching(/\/stats$/),
      ]),
    )
  })

  it("dispatches the open-palette custom event when search is clicked", () => {
    const listener = vi.fn()
    window.addEventListener(OPEN_PALETTE_EVENT, listener)
    render(<Header />)
    // Two search triggers exist (desktop ⌘K chip + mobile icon);
    // `getAllByRole` returns both and we only need to verify that
    // clicking either one fires the event.
    const buttons = screen.getAllByRole("button", { name: /open search/i })
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    act(() => { fireEvent.click(buttons[0]!) })
    expect(listener).toHaveBeenCalledTimes(1)
    window.removeEventListener(OPEN_PALETTE_EVENT, listener)
  })
})
