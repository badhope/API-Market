export default function Loading() {
  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl">
      <div className="h-3 w-3/4 bg-muted rounded mb-3 animate-pulse" />
      <div className="h-6 w-1/3 bg-muted rounded mb-4 animate-pulse" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-5 bg-muted/60 rounded animate-pulse" />
        ))}
      </div>
    </div>
  )
}
