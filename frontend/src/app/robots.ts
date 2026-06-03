import type { MetadataRoute } from "next"

// Same env-overridable origin as sitemap.ts; see the comment there.
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market").replace(/\/+$/, "")

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}