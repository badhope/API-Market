// Server-side locale lookup. With `output: "export"` we cannot read
// cookies/headers at build time, so every server component starts with
// "en" and the client picks up the user's stored/browser preference on
// hydration via `I18nProvider`. The two are guaranteed to agree on the
// first render (the provider also initialises to "en"), so there is no
// hydration mismatch — content just snaps to the user's chosen language
// after mount.
import type { Locale } from "./translations"

export async function getServerLocale(): Promise<Locale> {
  return "en"
}
