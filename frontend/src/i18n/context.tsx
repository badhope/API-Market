"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { translations, type Locale, type TranslationKey } from "./translations"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en"
  const stored = localStorage.getItem("api-market-locale")
  if (stored === "zh" || stored === "en") return stored
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith("zh")) return "zh"
  return "en"
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== "undefined") {
      localStorage.setItem("api-market-locale", newLocale)
      document.documentElement.lang = newLocale
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale]?.common?.[key] || translations.en.common[key] || key
    },
    [locale]
  )

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

export function useTranslation() {
  const { t, locale, setLocale } = useI18n()
  return { t, locale, setLocale }
}
