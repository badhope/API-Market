import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import dynamic from "next/dynamic"
import { ExternalLink } from "lucide-react"
import { internalHref, safeHref } from "@/lib/links"
import { loadAllApis } from "@/lib/data-server"
import { CATEGORY_TAG_FOR } from "@/lib/constants"
import { formatDate } from "@/lib/format"
import { codeSamples } from "@/lib/code-gen"
import { GradeBadge } from "@/components/codex/grade-badge"
import { Hairline } from "@/components/codex/hairline"
import { MetaRow, MetaLabel, MetaValue } from "@/components/codex/meta"
import { ApiCard } from "@/components/codex/api-card"

const CodeTabs = dynamic(() => import("@/components/codex/code-tabs").then(mod => ({ default: mod.CodeTabs })), {
  loading: () => <div className="animate-pulse h-48 bg-[var(--paper-deep)] rounded" />
})

interface Props {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  // Static export requires that every dynamic route enumerate its
  // params at build time. We just hand back every API id we know
  // about. Reading the file directly (via `loadAllApis`) keeps this
  // out of the network — there is no server to fetch from.
  const all = await loadAllApis()
  return all.map((a) => ({ id: a.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const items = await loadAllApis()
  const api = items.find((a) => a.id === id)
  
  if (!api) {
    return {
      title: "API Not Found",
      description: "The requested API could not be found.",
    }
  }
  
  const authInfo = api.auth === "none" ? "No authentication required" : 
                   api.auth === "apiKey" ? "API key required" :
                   api.auth === "oauth2" ? "OAuth 2.0 required" :
                   api.auth === "xAuth" ? "Custom authentication required" : "Authentication required"
  
  const freeInfo = api.auth === "none" ? "Completely free, no sign-up needed" : "Free tier available"
  
  return {
    title: `${api.name} - Free Public API`,
    description: `${api.description || api.name} - ${freeInfo}. ${authInfo}. Category: ${api.category_id}. Quality grade: ${api.quality_grade}.`,
  }
}

async function loadAll() {
  return loadAllApis()
}

export default async function ApiDetailPage({ params }: Props) {
  const { id } = await params
  const items = await loadAll()
  const api = items.find((a) => a.id === id) ?? null
  if (!api) notFound()

  const samples = codeSamples(api)
  const samplesObj = {
    curl: samples.find((s) => s.id === "curl")!.code,
    fetch: samples.find((s) => s.id === "fetch")!.code,
    python: samples.find((s) => s.id === "python")!.code,
    go: samples.find((s) => s.id === "go")!.code,
  }

  // Related: same category, not the same id
  const related = items
    .filter((a) => a.category_id === api.category_id && a.id !== api.id)
    .sort((a, b) => (b.quality_score ?? 0) - (a.quality_score ?? 0))
    .slice(0, 5)

  const href = safeHref(api.url)
  const isExternal = href?.startsWith("http")

  // JSON-LD structured data for API detail page
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebAPI",
    "name": api.name,
    "description": api.description || api.name,
    "url": `${process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market"}/apis/${api.id}`,
    "category": CATEGORY_TAG_FOR(api.category_id),
    "documentation": api.url,
    "termsOfService": api.auth === "none" ? "No authentication required" : `${api.auth} authentication required`,
    "additionalType": "REST API",
    "potentialAction": {
      "@type": "Action",
      "name": "Call API",
      "target": api.url
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-[1320px] px-6 sm:px-10">
      <header className="pt-16 sm:pt-24 pb-10 animate-fade-in">
        <p className="eyebrow mb-6 flex items-center gap-2 animate-fade-in-up">
          <span>API</span>
          <span aria-hidden="true">·</span>
          <Link
            href={internalHref(`/categories/${api.category_id}`)}
            className="inline-block text-[var(--ink-mute)] hover:text-[var(--accent)] py-1.5"
          >
            {CATEGORY_TAG_FOR(api.category_id)}
          </Link>
        </p>

        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="animate-fade-in-up-delayed">
            <h1 className="font-serif text-[clamp(2.5rem,6.5vw,5rem)] leading-[0.96] tracking-[-0.03em] font-medium">
              {api.name}.
            </h1>
            {api.description && (
              <p className="mt-6 font-serif text-[1.125rem] leading-[1.6] text-[var(--ink-soft)] max-w-[60ch]">
                {api.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-3 animate-fade-in-right">
            <GradeBadge grade={api.quality_grade} score={api.quality_score} size="md" />
            {isExternal && (
              <a
                href={href!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[0.6875rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] hover:text-[var(--accent)] py-1.5"
              >
                Visit <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </header>

      <Hairline className="mb-2" />

      {/* ─── Two-column body ─────────────────────────────── */}
      <div className="grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-20 pt-10">
        {/* LEFT: meta + code */}
        <div>
          <p className="eyebrow mb-6">Properties</p>
          <dl>
            <MetaRow>
              <MetaLabel>URL</MetaLabel>
              <MetaValue>
                <code className="break-all text-[0.8125rem]">{api.url}</code>
              </MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>Category</MetaLabel>
              <MetaValue>
                <Link
                  href={internalHref(`/categories/${api.category_id}`)}
                  className="inline-block hover:text-[var(--accent)] py-1.5"
                >
                  {CATEGORY_TAG_FOR(api.category_id)} — {api.category_id}
                </Link>
              </MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>Auth</MetaLabel>
              <MetaValue>
                <span className="font-mono text-[0.875rem]">{api.auth || "none"}</span>
              </MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>HTTPS</MetaLabel>
              <MetaValue>
                <span className="font-mono text-[0.875rem]">
                  {api.https === true ? "yes" : api.https === false ? "no" : "—"}
                </span>
              </MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>CORS</MetaLabel>
              <MetaValue>
                <span className="font-mono text-[0.875rem]">
                  {api.cors === true ? "yes" : api.cors === false ? "no" : "unknown"}
                </span>
              </MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>Source</MetaLabel>
              <MetaValue>
                {api.source_url ? (
                  <a
                    href={api.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block hover:text-[var(--accent)] break-all py-1.5"
                  >
                    {api.source || api.source_url}
                  </a>
                ) : (
                  <span className="font-mono text-[0.875rem]">{api.source || "—"}</span>
                )}
              </MetaValue>
            </MetaRow>
            {api.tags?.length > 0 && (
              <MetaRow>
                <MetaLabel>Tags</MetaLabel>
                <MetaValue>
                  <ul className="flex flex-wrap gap-1.5">
                    {api.tags.map((t) => (
                      <li
                        key={t}
                        className="font-mono text-[0.6875rem] tracking-[0.12em] uppercase px-1.5 py-0.5 border border-[var(--rule)] text-[var(--ink-mute)]"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </MetaValue>
              </MetaRow>
            )}
            <MetaRow>
              <MetaLabel>Last verified</MetaLabel>
              <MetaValue>
                <span className="font-mono text-[0.8125rem]">
                  {formatDate(api.last_verified)}
                </span>
              </MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>Updated</MetaLabel>
              <MetaValue>
                <span className="font-mono text-[0.8125rem]">
                  {formatDate(api.updated_at)}
                </span>
              </MetaValue>
            </MetaRow>
          </dl>

          {/* Code samples */}
          <p className="eyebrow mt-16 mb-6">How to call</p>
          <CodeTabs samples={samplesObj} />

          {/* Free usage guide */}
          <div className="mt-16 p-6 border border-[var(--rule)] bg-[var(--paper-soft)]/40">
            <p className="eyebrow mb-4 flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              Free to use
            </p>
            <p className="font-serif text-[1rem] leading-[1.6] text-[var(--ink-soft)]">
              {api.auth === "none" ? (
                <>
                  <strong className="text-[var(--ink)]">No sign-up required.</strong> You can start calling this API immediately. No API key, no registration, no credit card. Just copy the code above and run it.
                </>
              ) : (
                <>
                  <strong className="text-[var(--ink)]">Free tier available.</strong> This API requires {api.auth === "apiKey" ? "an API key" : api.auth === "oauth2" ? "OAuth authentication" : "authentication"}, but offers a free tier. Visit the{" "}
                  {isExternal && (
                    <a
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      official documentation
                    </a>
                  )}{" "}
                  to sign up and get your credentials.
                </>
              )}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 font-mono text-[0.75rem]">
              <div>
                <p className="text-[var(--ink-mute)] uppercase tracking-wider mb-1">Auth</p>
                <p className="text-[var(--ink)]">{api.auth || "none"}</p>
              </div>
              <div>
                <p className="text-[var(--ink-mute)] uppercase tracking-wider mb-1">HTTPS</p>
                <p className="text-[var(--ink)]">{api.https === true ? "yes" : api.https === false ? "no" : "—"}</p>
              </div>
              <div>
                <p className="text-[var(--ink-mute)] uppercase tracking-wider mb-1">CORS</p>
                <p className="text-[var(--ink)]">{api.cors === true ? "yes" : api.cors === false ? "no" : "unknown"}</p>
              </div>
              <div>
                <p className="text-[var(--ink-mute)] uppercase tracking-wider mb-1">Quality</p>
                <p className="text-[var(--ink)]">Grade {api.quality_grade} ({api.quality_score}/100)</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: related */}
        <aside>
          <p className="eyebrow mb-6">Related APIs</p>
          {related.length === 0 ? (
            <p className="font-serif text-[1.0625rem] text-[var(--ink-mute)]">
              No other APIs in this category.
            </p>
          ) : (
            <ol className="border-t border-[var(--rule)]">
              {related.map((r, i) => (
                <li key={r.id}>
                  <ApiCard api={r} index={i + 1} total={related.length} />
                </li>
              ))}
            </ol>
          )}

          <Link
            href={internalHref(`/categories/${api.category_id}`)}
            className="mt-8 inline-block font-mono text-[0.75rem] tracking-[0.14em] uppercase text-[var(--ink-mute)] hover:text-[var(--accent)] py-2"
          >
            See all in this category →
          </Link>
        </aside>
      </div>
    </div>
    </>
  )
}
