"use client"

import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useTranslation } from "@/i18n/context"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-3 sm:px-4 py-12 sm:py-16 text-center">
      <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive mx-auto mb-4 sm:mb-6" />
      <h1 className="text-2xl sm:text-3xl font-bold mb-2 break-words">{t("errorBoundary")}</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t("errorBoundaryDesc")}
      </p>
      <Button onClick={reset}>
        {t("retry")}
      </Button>
    </div>
  )
}
