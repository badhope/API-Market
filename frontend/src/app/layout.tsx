import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import "./globals.css"

// Geist (variable) + Geist Mono shipped in `src/app/fonts/`. We use the
// local file instead of `next/font/google` so the build is hermetic and
// the Pages deploy does not pull fonts from Google's CDN at runtime.
const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  display: "swap",
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  display: "swap",
})

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.145 0 0)" },
  ],
  width: "device-width",
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"
  ),
  title: {
    default: "API-Market — Discover 14,000+ Public APIs",
    template: "%s | API-Market",
  },
  description:
    "A comprehensive, quality-scored directory of 14,000+ public APIs. Browse by category, search across 5 quality dimensions, and find the perfect API for your next project.",
  keywords: [
    "public APIs",
    "API directory",
    "REST API",
    "free APIs",
    "API marketplace",
    "OpenAPI",
    "JSON API",
  ],
  authors: [{ name: "API-Market", url: "https://github.com/badhope/API-Market" }],
  creator: "API-Market",
  publisher: "API-Market",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN", "ja_JP"],
    title: "API-Market — Discover 14,000+ Public APIs",
    description:
      "A comprehensive, quality-scored directory of 14,000+ public APIs from across the internet.",
    siteName: "API-Market",
  },
  twitter: {
    card: "summary_large_image",
    title: "API-Market — Discover 14,000+ Public APIs",
    description: "A quality-scored directory of 14,000+ public APIs.",
    creator: "@badhope",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
}

// Tiny synchronous `<html lang>` updater that runs before any framework JS.
// Mirrors the I18nProvider's initial state ("en") so there's no FOUC of
// mismatched language attributes during hydration.
function LocaleBoot() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem('api-market-locale');var l=((s==='zh'||s==='ja'||s==='en')?s:((navigator.language||'en').toLowerCase().indexOf('zh')===0?'zh':((navigator.language||'en').toLowerCase().indexOf('ja')===0?'ja':'en')));document.documentElement.lang=l;}catch(e){document.documentElement.lang='en';}})();`,
      }}
    />
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <LocaleBoot />
      </head>
      <body
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground focus:shadow-lg"
            >
              Skip to main content
            </a>
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
