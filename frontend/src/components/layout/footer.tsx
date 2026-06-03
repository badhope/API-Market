"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "@/i18n/context"
import { SOURCE_LINKS } from "@/lib/constants"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

export function Footer() {
  const { t } = useTranslation()
  // `new Date().getFullYear()` at module / render time is server-vs-client
  // dependent: a footer built at 23:59 UTC on Dec 31 vs opened at 00:01
  // on Jan 1 in another timezone hydrates with mismatched text. Pin the
  // year to the client clock after mount instead.
  const [year, setYear] = useState<number | null>(null)
  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("siteName")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("projectIntro")}
            </p>
            <a
              href="https://github.com/badhope/API-Market"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <GithubIcon className="h-3.5 w-3.5" />
              {t("viewOnGitHub")}
            </a>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t("browse")}</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/categories" className="text-sm text-muted-foreground hover:text-foreground">
                {t("categories")}
              </Link>
              <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
                {t("search")}
              </Link>
              <Link href="/stats" className="text-sm text-muted-foreground hover:text-foreground">
                {t("statistics")}
              </Link>
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t("dataSourcesTitle")}</h4>
            <nav className="flex flex-col gap-2">
              {Object.entries(SOURCE_LINKS).map(([name, url]) => (
                <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground">
                  {name}
                </a>
              ))}
            </nav>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t("aboutTitle")}</h4>
            <p className="text-xs text-muted-foreground">
              {t("builtWith")} <span className="font-medium">{t("builtWithTech")}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t("copyright")}
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {year ?? new Date().getFullYear()} {t("siteName")}. {t("copyright")}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {t("builtWith")} <Heart className="h-3 w-3 text-red-500 fill-red-500" /> {t("using")}
          </p>
        </div>
      </div>
    </footer>
  )
}
