import type { Metadata, Viewport } from "next"
import { Fraunces, JetBrains_Mono } from "next/font/google"
import { Providers } from "@/components/providers"
import { CommandPaletteRoot } from "@/components/codex/command-palette-root"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import "./globals.css"

/**
 * Display serif. Variable axes we use via globals.css:
 *   - opsz (optical size) 14..144
 *   - SOFT (softness)      0..100
 *   - WONK (alt-g)         0/1
 * The display title on the home page sets `opsz:144, SOFT:20` to
 * get the chunky magazine-letter look; body text uses `opsz:24,
 * SOFT:50` for a softer reading feel.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4EFE6" },
    { media: "(prefers-color-scheme: dark)",  color: "#0E0E0C" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"
  ),
  title: {
    default: "API-Market — The Codex",
    template: "%s · API-Market",
  },
  description:
    "A curated, quality-scored directory of free public APIs. Every record is hand-reviewed, tested, and ready to use. No sign-up, no API key, no middleman. Browse APIs across dozens of categories from weather to machine learning.",
  keywords: [
    "public APIs",
    "API directory",
    "open data",
    "OpenAPI",
    "free APIs",
    "no authentication APIs",
    "REST APIs",
    "API catalog",
    "developer resources",
    "API documentation",
    "free public APIs",
    "API marketplace",
    "open source APIs",
    "API testing",
    "API quality score",
  ],
  authors: [{ name: "API-Market", url: "https://github.com/badhope/API-Market" }],
  creator: "API-Market",
  publisher: "API-Market",
  openGraph: {
    type: "website",
    title: "API-Market — The Codex",
    description:
      "A curated, quality-scored directory of free public APIs. Every record is hand-reviewed and ready to use.",
    siteName: "API-Market",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "API-Market — The Codex",
    description: "A curated, quality-scored directory of free public APIs.",
    creator: "@API_Market",
  },
  robots: { 
    index: true, 
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "./",
  },
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${jetbrains.variable}`}
    >
      <body>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-[var(--paper)] focus:px-3 focus:py-2 focus:text-[var(--ink)] focus:font-mono focus:text-[0.75rem] focus:uppercase focus:tracking-[0.14em] focus:border focus:border-[var(--accent)]"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="min-h-[calc(100vh-4rem)]">
            {children}
          </main>
          <Footer />
          <CommandPaletteRoot />
        </Providers>
      </body>
    </html>
  )
}
