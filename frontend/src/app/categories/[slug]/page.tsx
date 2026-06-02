import { Suspense } from "react"
import { ListSkeleton } from "@/components/ui/loading"
import { CategoryDetailContent } from "./category-detail-content"
import { promises as fs } from "fs"
import path from "path"

export async function generateStaticParams() {
  try {
    const file = path.join(process.cwd(), "public", "data", "manifest.json")
    const raw = await fs.readFile(file, "utf-8")
    const manifest = JSON.parse(raw) as { category_files?: string[] }
    return (manifest.category_files || []).map((id) => ({ slug: id }))
  } catch {
    return []
  }
}

export const dynamicParams = false

export default function CategoryDetailPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8"><ListSkeleton rows={12} /></div>}>
      <CategoryDetailContent />
    </Suspense>
  )
}
