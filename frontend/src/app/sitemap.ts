import type { MetadataRoute } from "next"

// Allow the deployer to override the canonical origin at build time. Falls
// back to the default GitHub Pages URL for a project page (`<owner>.github.io/<repo>`).
// For custom domains, set NEXT_PUBLIC_SITE_URL in the deploy environment.
const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://badhope.github.io/API-Market").replace(/\/+$/, "")

export default function sitemap(): MetadataRoute.Sitemap {
  return [
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
}