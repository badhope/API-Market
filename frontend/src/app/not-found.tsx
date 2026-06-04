import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-3xl text-center">
      <p className="text-5xl sm:text-6xl font-bold text-muted-foreground mb-2">404</p>
      <h1 className="text-lg sm:text-xl font-semibold mb-3">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The page or API you&rsquo;re looking for doesn&rsquo;t exist or has
        been moved. The catalog is dynamic — try a fresh search.
      </p>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
        <Link href="/" className="underline hover:no-underline">
          Home
        </Link>
        <Link href="/categories" className="underline hover:no-underline">
          Categories
        </Link>
        <Link href="/search" className="underline hover:no-underline">
          Search
        </Link>
      </div>
    </div>
  )
}
