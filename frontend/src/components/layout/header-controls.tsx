"use client"

// Tiny client island for the bits of the header that actually need
// browser-only state: the search form (uses useSearchParams so it MUST
// live in a <Suspense>), the theme toggle, and the language switcher.
// Everything else is server-rendered in `header.tsx`.
import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import { Search, Sun, Moon, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/i18n/context"
import type { Locale } from "@/i18n/translations"

interface HeaderControlsProps {
  locale: Locale
}

function LanguageSwitcher() {
  const { t, locale, setLocale } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const toggleLocale = useCallback(() => {
    const next: Record<Locale, Locale> = { en: "zh", zh: "ja", ja: "en" }
    setLocale(next[locale])
  }, [locale, setLocale])
  if (!mounted) {
    // Reserve the same footprint on the server to avoid CLS once the
    // controls hydrate.
    return <div className="h-8 w-8" aria-hidden="true" />
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      aria-label={t("language")}
      title={
        locale === "en" ? t("switchToZh") : locale === "zh" ? t("switchToJa") : t("switchToEn")
      }
    >
      <Languages className="h-5 w-5" />
    </Button>
  )
}

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden="true" />
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={t("toggleTheme")}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}

function HeaderSearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [value, setValue] = useState(() => searchParams.get("q") || "")

  useEffect(() => {
    setValue(searchParams.get("q") || "")
  }, [searchParams])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = value.trim()
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4"
      role="search"
    >
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          placeholder={t("searchPlaceholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-9 pr-4 h-9 appearance-none [&::-webkit-search-cancel-button]:hidden"
          aria-label={t("search")}
          autoComplete="off"
        />
      </div>
      <Button type="submit" size="sm">
        {t("search")}
      </Button>
    </form>
  )
}

export function HeaderControls({ locale: _locale }: HeaderControlsProps) {
  return (
    <>
      <Suspense
        fallback={
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md mx-4" aria-hidden="true">
            <div className="h-9 w-full rounded-md bg-muted/50" />
            <div className="h-9 w-16 rounded-md bg-muted/50" />
          </div>
        }
      >
        <HeaderSearchInput />
      </Suspense>
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </>
  )
}
