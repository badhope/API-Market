"use client"

import { useEffect, useState, lazy, Suspense } from "react"

/**
 * Custom event name. Buttons that need to open the palette (e.g. the
 * header search trigger) dispatch this on `window` rather than
 * dispatching a synthetic `KeyboardEvent` — synthetic keyboard events
 * are unreliable across browsers when the modifier flag is set, and
 * the intent is "open the palette", not "pretend the user typed ⌘K".
 */
export const OPEN_PALETTE_EVENT = "apimarket:open-palette"

// Lazy load the CommandPalette component to reduce initial bundle size
// The search functionality (Orama) is only loaded when the palette opens
const CommandPalette = lazy(() => 
  import("./command-palette").then(module => ({ default: module.CommandPalette }))
)

/**
 * Listens for the ⌘K / Ctrl-K global shortcut and toggles the
 * command palette modal. Mounted once at the root layout.
 */
export function CommandPaletteRoot() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      if ((e.metaKey || e.ctrlKey) && k === "k") {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (k === "/" && !open) {
        const t = e.target as HTMLElement | null
        if (t && /^(input|textarea|select)$/i.test(t.tagName)) return
        if (t?.isContentEditable) return
        e.preventDefault()
        setOpen(true)
        return
      }
      if (k === "escape" && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen)
    }
  }, [open])

  return (
    <Suspense fallback={null}>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </Suspense>
  )
}
