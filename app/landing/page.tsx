"use client"

import { useEffect } from "react"
import { HomepageHero } from "@/components/homepage-hero"
import { HomepageSections } from "@/components/homepage-sections"
import { TrendingWidget } from "@/components/trending-widget"
import { FeaturedArtistsCarousel } from "@/components/featured-artists-carousel"

export default function LandingPage() {
  useEffect(() => {
    localStorage.setItem("hasVisitedBefore", "true")
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <HomepageHero />

      <div className="container max-w-7xl mx-auto px-4 py-12 space-y-8">
        <FeaturedArtistsCarousel />
        <TrendingWidget />
      </div>

      <HomepageSections />
    </div>
  )
}
