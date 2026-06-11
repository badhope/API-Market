import Link from "next/link"
import { Hairline } from "@/components/codex/hairline"
import { internalHref } from "@/lib/links"

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-32 border-t border-[var(--rule)]">
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10 py-16">
        <Hairline className="mb-12" />

        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-serif text-[1.5rem] tracking-[-0.015em] leading-snug max-w-[28ch]">
              <em className="italic-display not-italic font-normal">A small,</em>{" "}
              curated directory of <em className="italic">public</em> APIs —
              <br className="hidden sm:block" />
              read like a codex, not a spreadsheet.
            </p>
            <p className="mt-6 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)]">
              © {year} API-Market · MIT License
            </p>
          </div>

          <FooterCol heading="Browse">
            <Link href={internalHref("/categories")} className="footer-link">All categories</Link>
            <Link href={internalHref("/search")} className="footer-link">Search the codex</Link>
            <Link href={internalHref("/stats")} className="footer-link">Statistics</Link>
          </FooterCol>

          <FooterCol heading="Project">
            <a href="https://github.com/badhope/API-Market" className="footer-link" target="_blank" rel="noopener noreferrer">Source</a>
            <a href="https://github.com/badhope/API-Market/blob/main/CONTRIBUTING.md" className="footer-link" target="_blank" rel="noopener noreferrer">Contribute</a>
            <a href="https://github.com/badhope/API-Market/blob/main/CHANGELOG.md" className="footer-link" target="_blank" rel="noopener noreferrer">Changelog</a>
          </FooterCol>

          <FooterCol heading="Built with">
            <span className="footer-link !cursor-default">Next.js 16</span>
            <span className="footer-link !cursor-default">Zod · Orama · JSONL</span>
            <span className="footer-link !cursor-default">Fraunces · JetBrains Mono</span>
          </FooterCol>
        </div>

        <p className="mt-16 font-mono text-[0.625rem] tracking-[0.18em] uppercase text-[var(--ink-faint)] text-center">
          ◇ &nbsp; A static codex. No cookies. No tracking. &nbsp; ◇
        </p>
      </div>

      <style>{`
        .footer-link {
          display: block;
          font-size: 0.875rem;
          line-height: 1.4;
          padding: 0.5rem 0;
          color: var(--ink-soft);
        }
        .footer-link:hover { color: var(--accent); }
      `}</style>
    </footer>
  )
}

function FooterCol({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="eyebrow mb-4">{heading}</h4>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}
