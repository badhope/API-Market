import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_ICONS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function formatDate(dateStr: string | null, locale?: string): string {
  if (!dateStr) return "N/A"
  return new Date(dateStr).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function getGradeColor(grade: string | null): string {
  if (!grade) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  const colors: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
    D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    F: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  }
  return colors[grade] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
}

export function getCategoryIcon(categoryId: string): string {
  return CATEGORY_ICONS[categoryId] || "📦"
}
