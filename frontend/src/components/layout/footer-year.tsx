"use client"

// Pinned-to-client copyright year. The build-time year in the static
// HTML may differ from the user's clock (e.g. server built on Dec 31,
// user opens Jan 1 in another tz), so we wait for mount before
// updating. The first render is the build year (a stable number) so
// hydration matches.
import { useEffect, useState } from "react"

interface FooterYearProps {
  fallback?: number
}

export function FooterYear({ fallback = new Date().getUTCFullYear() }: FooterYearProps) {
  const [year, setYear] = useState<number>(fallback)
  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])
  return <span suppressHydrationWarning>{year}</span>
}
