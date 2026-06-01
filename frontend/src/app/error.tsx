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
    <div className="container mx-auto px-4 py-20 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
      <h1 className="text-3xl font-bold mb-2">{t("errorBoundary")}</h1>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {t("errorBoundaryDesc")}
      </p>
      <Button onClick={reset}>
        {t("retry")}
      </Button>
    </div>
  )
}
