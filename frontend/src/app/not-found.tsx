"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileQuestion } from "lucide-react"
import { useTranslation } from "@/i18n/context"

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-2">{t("notFound")}</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t("notFoundDesc")}
      </p>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        {t("goHome")}
      </Link>
    </div>
  )
}
