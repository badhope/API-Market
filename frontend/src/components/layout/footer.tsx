// Server-rendered footer. Only the copyright year is dynamic and it
// lives in a tiny client island (`FooterYear`) so the rest of the
// footer ships as static HTML.
import Link from "next/link"
import { Heart } from "lucide-react"
import { FooterYear } from "./footer-year"
import { getServerLocale } from "@/i18n/server-locale"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

const t = {
  en: {
    siteName: "API-Market",
    projectIntro: "A comprehensive, quality-scored collection of public APIs from across the internet.",
    viewOnGitHub: "View on GitHub",
    browse: "Browse",
    categories: "Categories",
    search: "Search",
    statistics: "Statistics",
    dataSourcesTitle: "Data Sources",
    aboutTitle: "About",
    builtWith: "Built with",
    builtWithTech: "Next.js, FastAPI, SQLite",
    using: "by the open-source community",
  },
  zh: {
    siteName: "API 市场",
    projectIntro: "来自互联网的、质量评分的公开 API 综合目录。",
    viewOnGitHub: "在 GitHub 上查看",
    browse: "浏览",
    categories: "分类",
    search: "搜索",
    statistics: "统计",
    dataSourcesTitle: "数据源",
    aboutTitle: "关于",
    builtWith: "基于",
    builtWithTech: "Next.js、FastAPI、SQLite",
    using: "由开源社区贡献",
  },
  ja: {
    siteName: "API マーケット",
    projectIntro: "インターネット上の公開 API を品質スコア付きでまとめた包括的ディレクトリ。",
    viewOnGitHub: "GitHub で見る",
    browse: "閲覧",
    categories: "カテゴリ",
    search: "検索",
    statistics: "統計",
    dataSourcesTitle: "データソース",
    aboutTitle: "概要",
    builtWith: "Built with",
    builtWithTech: "Next.js、FastAPI、SQLite",
    using: "オープンソースコミュニティによって",
  },
} as const

const SOURCE_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["apis.guru", "https://apis.guru"],
  ["public-apis", "https://github.com/public-apis/public-apis"],
  ["marcelscruz/public-apis", "https://github.com/marcelscruz/public-apis"],
  ["n0shake/Public-APIs", "https://github.com/n0shake/Public-APIs"],
  ["public-api-lists", "https://github.com/public-api-lists/public-api-lists"],
  ["keploy/public-api-lists", "https://github.com/keploy/public-api-lists"],
] as const

export async function Footer() {
  const locale = await getServerLocale()
  const tr = t[locale]
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{tr.siteName}</h3>
            <p className="text-sm text-muted-foreground">{tr.projectIntro}</p>
            <a
              href="https://github.com/badhope/API-Market"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              {tr.viewOnGitHub}
            </a>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{tr.browse}</h4>
            <nav className="flex flex-col gap-2" aria-label="Browse">
              <Link
                href="/categories"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {tr.categories}
              </Link>
              <Link
                href="/search"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {tr.search}
              </Link>
              <Link
                href="/stats"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {tr.statistics}
              </Link>
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{tr.dataSourcesTitle}</h4>
            <nav className="flex flex-col gap-2" aria-label="Data sources">
              {SOURCE_LINKS.map(([name, url]) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {name}
                </a>
              ))}
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{tr.aboutTitle}</h4>
            <p className="text-xs text-muted-foreground">
              {tr.builtWith} <span className="font-medium">{tr.builtWithTech}</span>
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {tr.using} <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t">
          <p className="text-xs text-muted-foreground text-center">
            &copy; <FooterYear /> {tr.siteName}. {tr.builtWith}{" "}
            <span className="font-medium">{tr.builtWithTech}</span>.
          </p>
        </div>
      </div>
    </footer>
  )
}
