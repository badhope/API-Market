"use client"

import { CategoryGrid } from "./category-grid"
import { useTranslation } from "@/i18n/context"

export default function CategoriesPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">{t("categoriesTitle")}</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          {t("categoriesDesc")}
        </p>
      </div>
      <CategoryGrid />
    </div>
  )
}
