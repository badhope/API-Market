export default function Loading() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10 py-16">
      <div className="h-3 w-3/4 bg-[var(--paper-soft)] rounded mb-3 animate-pulse" />
      <div className="h-6 w-1/3 bg-[var(--paper-soft)] rounded mb-6 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-5 bg-[var(--paper-soft)]/60 rounded animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  )
}
