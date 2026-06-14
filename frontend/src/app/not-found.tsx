import { Hairline } from "@/components/codex/hairline"

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1320px] px-6 sm:px-10 py-32 text-center">
      <Hairline className="max-w-xs mx-auto mb-12" />
      <p className="eyebrow mb-6 text-[var(--ink-mute)]">404 · Out of stock</p>
      <h1 className="font-serif text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] tracking-[-0.03em] font-medium">
        Not in the codex.
      </h1>
      <p className="mt-6 font-serif text-[1.0625rem] text-[var(--ink-soft)] max-w-md mx-auto">
        That entry isn’t in our directory — at least, not under the name
        you tried. Try the search.
      </p>
    </div>
  )
}
