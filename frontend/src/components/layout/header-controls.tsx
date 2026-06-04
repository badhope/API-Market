"use client"

// Tiny client island for the bits of the header that need
// browser-only state: the theme toggle and the language switcher.
// Everything else is server-rendered in `header.tsx`. (We dropped the
// header search input — the search box lives on the home and search
// pages, where it gets to be the first thing the user sees.)
import { useCallback, useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Languages, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/context"
import type { Locale } from "@/i18n/translations"

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
    // controls hydrate. h-9 (36px) is a comfortable touch target on
    // mobile while still feeling compact at desktop sizes.
    return <div className="h-9 w-9" aria-hidden="true" />
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLocale}
      aria-label={t("language")}
      title={
        locale === "en"
          ? t("switchToZh")
          : locale === "zh"
            ? t("switchToJa")
            : t("switchToEn")
      }
      className="h-9 w-9 sm:h-8 sm:w-8"
    >
      <span className="text-xs font-semibold">
        {locale === "en" ? "EN" : locale === "zh" ? "中" : "日"}
      </span>
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
    return <div className="h-9 w-9 sm:h-8 sm:w-8" aria-hidden="true" />
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={t("toggleTheme")}
      className="h-9 w-9 sm:h-8 sm:w-8"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export function HeaderControls() {
  return (
    <div className="flex items-center gap-1">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  )
}

// `Languages` is imported above to make it easy to swap to a globe icon
// later without re-touching this file's JSX. Re-export to keep the
// import list in `header.tsx` clean even if the export isn't used.
export { Languages }
