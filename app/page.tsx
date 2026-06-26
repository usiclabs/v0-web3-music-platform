"use client"

import { HomepageHero } from "@/components/homepage-hero"
import { HomepageSections } from "@/components/homepage-sections"
import { TrendingWidget } from "@/components/trending-widget"
import { FeaturedArtistsCarousel } from "@/components/featured-artists-carousel"
import { Separator } from "@/components/ui/separator"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <HomepageHero />

      <Separator className="border-border/30" />

      <div className="container max-w-7xl mx-auto px-4 py-12 space-y-12">
        <FeaturedArtistsCarousel />
        <TrendingWidget />
      </div>

      <HomepageSections />
    </div>
  )
}
