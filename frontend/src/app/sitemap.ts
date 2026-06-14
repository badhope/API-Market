import type { MetadataRoute } from "next"
import { loadAllApis, loadCategories } from "@/lib/data-server"

// Next.js 16 requires this for static export.
export const dynamic = "force-static"

// Allow the deployer to override the canonical origin at build time. Falls
// back to the default GitHub Pages URL for a project page (`<owner>.github.io/<repo>`).
// For custom domains, set NEXT_PUBLIC_SITE_URL in the deploy environment.
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market").replace(/\/+$/, "")

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [apis, categories] = await Promise.all([
    loadAllApis(),
    loadCategories(),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
  ]

  // Add all category pages
  const categoryPages: MetadataRoute.Sitemap = categories.items.map((category) => ({
    url: `${baseUrl}/categories/${category.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  // Add all API detail pages
  const apiPages: MetadataRoute.Sitemap = apis.map((api) => ({
    url: `${baseUrl}/apis/${api.id}`,
    lastModified: new Date(api.updated_at || Date.now()),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...staticPages, ...categoryPages, ...apiPages]
}