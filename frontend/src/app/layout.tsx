import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Suspense } from "react"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: "API-Market — Discover 14,000+ Public APIs",
    template: "%s | API-Market",
  },
  description:
    "A comprehensive, quality-scored collection of 14,000+ public APIs from across the internet. Find the perfect API for your next project.",
  keywords: ["public APIs", "API directory", "REST API", "free APIs", "API marketplace"],
  authors: [{ name: "API-Market" }],
  openGraph: {
    title: "API-Market — Discover 14,000+ Public APIs",
    description: "A comprehensive, quality-scored collection of 14,000+ public APIs.",
    type: "website",
  },
}

function LocaleUpdater() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var stored = localStorage.getItem('api-market-locale');
              if (stored === 'zh' || stored === 'en' || stored === 'ja') {
                document.documentElement.lang = stored;
              } else {
                var navLang = (navigator.language || 'en').toLowerCase();
                if (navLang.startsWith('zh')) {
                  document.documentElement.lang = 'zh';
                } else if (navLang.startsWith('ja')) {
                  document.documentElement.lang = 'ja';
                } else {
                  document.documentElement.lang = 'en';
                }
              }
            } catch(e) {}
          })();
        `,
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
        <LocaleUpdater />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Suspense fallback={<div className="h-16 border-b" />}>
              <Header />
            </Suspense>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
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
