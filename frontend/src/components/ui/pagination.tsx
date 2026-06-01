"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useTranslation } from "@/i18n/context"
import { Suspense } from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  total: number
}

function PaginationInner({ currentPage, totalPages }: PaginationProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`${pathname}?${params.toString()}`)
  }

  const pages: (number | "...")[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push("...")
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push("...")
    pages.push(totalPages)
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        aria-label={t("firstPage")}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label={t("previousPage")}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            className="h-8 w-8 text-sm"
            onClick={() => goToPage(page)}
            aria-label={`${t("page")} ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Button>
        )
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label={t("nextPage")}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        aria-label={t("lastPage")}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </nav>
  )
}

export function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={<div className="mt-8 h-8" />}>
      <PaginationInner {...props} />
    </Suspense>
  )
}
