import type { Metadata } from "next"
import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { StatsBar } from "@/components/home/stats-bar"
import { FeaturedCategories } from "@/components/home/featured-categories"
import { FeaturedApis } from "@/components/home/featured-apis"

export const metadata: Metadata = {
  description:
    "Discover 14,000+ quality-scored public APIs. Browse 60+ categories, search across 5 quality dimensions, and find the perfect API for your next project.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "API-Market — Discover 14,000+ Public APIs",
    description: "Discover 14,000+ quality-scored public APIs from across the internet.",
  },
}

export default function Home() {
  return (
    <>
      <Hero />
      <Suspense fallback={null}>
        <StatsBar />
      </Suspense>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <FeaturedCategories />
      </section>
      <section className="container mx-auto px-4 py-12 md:py-16">
        <FeaturedApis />
      </section>
    </>
  )
}
