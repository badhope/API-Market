// Server-rendered footer. One row of text links, one line of
// copyright. Wraps to multiple rows on mobile so the links don't get
// crushed on a 320px viewport.
import Link from "next/link"

import { getServerLocale } from "@/i18n/server-locale"

const t = {
  en: {
    categories: "Categories",
    search: "Search",
    statistics: "Statistics",
    dataSources: "Data sources",
    builtWith: "Built with Next.js, FastAPI, and SQLite.",
    updatedDaily: "Data refreshed daily from public sources.",
  },
  zh: {
    categories: "分类",
    search: "搜索",
    statistics: "统计",
    dataSources: "数据源",
    builtWith: "基于 Next.js、FastAPI、SQLite 构建。",
    updatedDaily: "每日从公共来源更新数据。",
  },
  ja: {
    categories: "カテゴリ",
    search: "検索",
    statistics: "統計",
    dataSources: "データソース",
    builtWith: "Next.js、FastAPI、SQLite で構築。",
    updatedDaily: "データは公共ソースから毎日更新されます。",
  },
} as const

export async function Footer() {
  const locale = await getServerLocale()
  const tr = t[locale]
  return (
    <footer className="border-t bg-background text-xs text-muted-foreground">
      <div className="container mx-auto px-3 sm:px-4 py-3 max-w-5xl flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Footer">
          <Link
            href="/categories"
            className="hover:underline hover:text-foreground"
          >
            {tr.categories}
          </Link>
          <Link
            href="/search"
            className="hover:underline hover:text-foreground"
          >
            {tr.search}
          </Link>
          <Link
            href="/stats"
            className="hover:underline hover:text-foreground"
          >
            {tr.statistics}
          </Link>
          <a
            href="https://github.com/badhope/API-Market"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground"
          >
            GitHub
          </a>
        </nav>
        <p className="break-words">{tr.builtWith} {tr.updatedDaily}</p>
      </div>
    </footer>
  )
}
