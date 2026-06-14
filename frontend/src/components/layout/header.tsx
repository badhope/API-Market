"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Moon, Sun, Search, Menu, X } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/cn"
import { internalHref } from "@/lib/links"
import { OPEN_PALETTE_EVENT } from "@/components/codex/command-palette-root"

const NAV = [
  { href: "/categories", label: "Categories" },
  { href: "/search", label: "Search" },
  { href: "/stats", label: "Statistics" },
] as const

/**
 * Site header. Desktop: full nav + a search trigger that opens the
 * command palette. Mobile (< md): collapses nav into a slide-down
 * panel toggled by a hamburger button. The panel also includes the
 * theme toggle and the search shortcut so everything stays
 * single-tap on a phone.
 */
export function Header() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted ? resolvedTheme === "dark" : false

  // Close the mobile menu on any hash navigation or resize past the
  // desktop breakpoint, so it doesn't get stuck open while rotating
  // the device.
  useEffect(() => {
    if (!menuOpen) return
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  const openPalette = () => {
    window.dispatchEvent(new Event(OPEN_PALETTE_EVENT))
  }

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-[var(--rule)]",
          "bg-[color-mix(in_oklch,var(--paper)_92%,transparent)]",
          "backdrop-blur-md",
        )}
      >
        <div className="mx-auto max-w-[1320px] px-6 sm:px-10 h-16 flex items-center justify-between gap-6">
          {/* Brand */}
          <Link
            href={internalHref("/")}
            className="flex items-baseline gap-2 shrink-0"
            aria-label="API-Market — Home"
            onClick={() => setMenuOpen(false)}
          >
            <span className="font-serif text-[1.25rem] tracking-[-0.02em] font-medium">
              API-Market
            </span>
            <span className="hidden sm:inline font-mono text-[0.625rem] tracking-[0.18em] uppercase text-[var(--ink-mute)]">
              The Codex
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]"
            aria-label="Primary"
          >
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={internalHref(n.href)}
                className="hover:text-[var(--ink)] px-3 py-2.5"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          {/* Tools */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openPalette}
              aria-label="Open search (⌘K)"
              className="hidden sm:inline-flex items-center gap-2 px-3 h-10 border border-[var(--rule)] text-[var(--ink-mute)] hover:text-[var(--ink)] hover:border-[var(--ink-faint)] transition-colors"
            >
              <Search className="size-3.5" aria-hidden="true" />
              <span className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase">
                Search
              </span>
              <kbd className="ml-1 font-mono text-[0.625rem] tracking-[0.12em] opacity-60">
                ⌘K
              </kbd>
            </button>

            {/* Mobile-only search shortcut */}
            <button
              type="button"
              onClick={openPalette}
              aria-label="Open search"
              className="sm:hidden inline-flex items-center justify-center size-10 text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors"
            >
              <Search className="size-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
              className="inline-flex items-center justify-center size-10 text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors"
            >
              {isDark ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </button>

            <a
              href="https://github.com/badhope/API-Market"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
              className="hidden sm:inline-flex items-center justify-center size-10 text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.7-1.4-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.4 3.6 1 .1-.8.4-1.4.8-1.7-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
              </svg>
            </a>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="md:hidden inline-flex items-center justify-center size-10 text-[var(--ink-mute)] hover:text-[var(--ink)] transition-colors"
            >
              {menuOpen ? (
                <X className="size-4" aria-hidden="true" />
              ) : (
                <Menu className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu backdrop - outside header to avoid z-index conflicts */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu panel - outside header */}
      <div
        id="mobile-menu"
        className={cn(
          "md:hidden fixed top-16 left-0 right-0 z-50 border-t border-[var(--rule)] bg-[var(--paper)]",
          "transition-all duration-300 ease-out",
          menuOpen ? "max-h-96 opacity-100 shadow-lg" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        <nav
          className="px-6 sm:px-10 py-4 flex flex-col gap-1"
          aria-label="Mobile primary"
        >
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={internalHref(n.href)}
              onClick={() => setMenuOpen(false)}
              className="font-mono text-[0.75rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] hover:text-[var(--ink)] py-3 border-b border-[var(--rule)] transition-colors"
            >
              {n.label}
            </Link>
          ))}
          <a
            href="https://github.com/badhope/API-Market"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[0.75rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] hover:text-[var(--ink)] py-3 transition-colors"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </>
  )
}
