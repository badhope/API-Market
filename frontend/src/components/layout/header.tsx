// Server-rendered header. All static markup (logo, nav, GitHub link, mobile
// menu shell) ships in the initial HTML so the page is navigable before
// React hydrates. The search form, theme toggle, and language switch are
// isolated into a small client island (`HeaderControls`) — the use of
// `useSearchParams` inside that island is wrapped in its own <Suspense> so
// only that subtree bails out to client rendering, not the whole header.
import Link from "next/link"
import { Database } from "lucide-react"
import { HeaderControls } from "./header-controls"
import { MobileMenu } from "./mobile-menu"
import { getServerLocale } from "@/i18n/server-locale"

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

const t = {
  en: {
    siteName: "API-Market",
    categories: "Categories",
    stats: "Statistics",
    search: "Search",
  },
  zh: {
    siteName: "API 市场",
    categories: "分类",
    stats: "统计",
    search: "搜索",
  },
  ja: {
    siteName: "API マーケット",
    categories: "カテゴリ",
    stats: "統計",
    search: "検索",
  },
} as const

export async function Header() {
  const locale = await getServerLocale()
  const tr = t[locale]
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Database className="h-6 w-6 text-primary" />
            <span className="hidden sm:inline">{tr.siteName}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 ml-8" aria-label="Primary">
            <Link
              href="/categories"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tr.categories}
            </Link>
            <Link
              href="/stats"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tr.stats}
            </Link>
          </nav>
        </div>

        <HeaderControls locale={locale} />

        <div className="flex items-center gap-1">
          <a
            href="https://github.com/badhope/API-Market"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hidden md:inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <GitHubIcon className="h-5 w-5" />
          </a>
          <MobileMenu locale={locale} />
        </div>
      </div>
    </header>
  )
}
