/** @type {import('next').NextConfig} */
const isExport = process.env.STATIC_EXPORT === "true"

// `basePath` is the URL prefix GitHub Pages prepends when the site is
// served from a project page (`<owner>.github.io/<repo>`). Set
// `NEXT_PUBLIC_BASE_PATH=""` in the deploy environment for a custom
// domain, otherwise asset URLs will be prefixed with the repo name.
const basePath = isExport ? process.env.NEXT_PUBLIC_BASE_PATH || "/API-Market" : ""

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isExport ? "export" : "standalone",
  basePath,
  trailingSlash: isExport,
  images: {
    unoptimized: true,
  },
  // GitHub Pages does not run a server. The standalone mode (`pnpm
  // dev`) reads the same JSON files from `public/data/` directly —
  // there is no backend to rewrite to.
}

export default nextConfig
