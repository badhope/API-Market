"use client"

// Mobile-only slide-down menu. Kept separate from the main Header (which
// is a server component) because it needs useState to toggle.
import { useState } from "react"
import Link from "next/link"
import { Menu, X, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/context"
import type { Locale } from "@/i18n/translations"

const t = {
  en: { categories: "Categories", stats: "Statistics", toggleMenu: "Toggle menu", search: "Search" },
  zh: { categories: "分类", stats: "统计", toggleMenu: "切换菜单", search: "搜索" },
  ja: { categories: "カテゴリ", stats: "統計", toggleMenu: "メニュー切替", search: "検索" },
} as const

export function MobileMenu({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const router = useRouter()
  const { t: tr } = useTranslation()
  const tr2 = t[locale]

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label={tr2.toggleMenu}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      {open && (
        <div className="absolute top-16 left-0 right-0 md:hidden border-b bg-background shadow-sm">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <form onSubmit={onSubmit} className="flex gap-2" role="search">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  name="q"
                  placeholder={tr("searchPlaceholder")}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-9"
                  aria-label={tr2.search}
                />
              </div>
              <Button type="submit" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <nav className="flex flex-col gap-3" aria-label="Mobile">
              <Link
                href="/categories"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {tr2.categories}
              </Link>
              <Link
                href="/stats"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                {tr2.stats}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
