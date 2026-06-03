/** @type {import('next').NextConfig} */
const isExport = process.env.STATIC_EXPORT === "true"

// basePath is the URL prefix GitHub Pages prepends when the site is served
// from a project page (`<owner>.github.io/<repo>`). For a custom domain,
// set NEXT_PUBLIC_BASE_PATH="" (or "/") in the deploy environment so
// internal asset URLs aren't prefixed with the repo name.
const basePath = isExport ? process.env.NEXT_PUBLIC_BASE_PATH || "/API-Market" : ""

const nextConfig = {
  output: isExport ? "export" : "standalone",
  basePath,
  trailingSlash: isExport,
  images: {
    unoptimized: true,
  },
  ...(isExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/:path*`,
            },
          ]
        },
      }),
}

export default nextConfig
