"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { useTranslation } from "@/i18n/context"
import { SOURCE_LINKS } from "@/lib/constants"

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{t("siteName")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("aboutDesc")}
            </p>
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
            <h4 className="text-sm font-semibold">{t("about")}</h4>
            <p className="text-xs text-muted-foreground">
              {t("aboutDesc")}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t("copyright")}
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} {t("siteName")}. {t("copyright")}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {t("builtWith")} <Heart className="h-3 w-3 text-red-500 fill-red-500" /> {t("using")}
          </p>
        </div>
      </div>
    </footer>
  )
}
