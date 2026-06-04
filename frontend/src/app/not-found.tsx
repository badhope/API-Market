import Link from "next/link"
import type { Metadata } from "next"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowLeft, Search } from "lucide-react"

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <p className="text-sm font-semibold text-primary mb-2">404</p>
      <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">
        Page Not Found
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
        It may have been removed during a daily refresh if it was a specific API
        or category.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <Link
          href="/search"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Search className="h-4 w-4" />
          Search APIs
        </Link>
      </div>
    </div>
  )
}
