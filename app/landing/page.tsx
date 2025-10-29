"use client"

import { useEffect } from "react"
import { HomepageHero } from "@/components/homepage-hero"
import { HomepageSections } from "@/components/homepage-sections"

export default function LandingPage() {
  useEffect(() => {
    localStorage.setItem("hasVisitedBefore", "true")
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <HomepageHero />
      <HomepageSections />
    </div>
  )
}
