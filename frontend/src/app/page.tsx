import { Hero } from "@/components/home/hero"
import { StatsBar } from "@/components/home/stats-bar"
import { FeaturedCategories } from "@/components/home/featured-categories"
import { FeaturedApis } from "@/components/home/featured-apis"

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="container mx-auto px-4">
        <StatsBar />
        <FeaturedCategories />
        <FeaturedApis />
      </div>
    </>
  )
}