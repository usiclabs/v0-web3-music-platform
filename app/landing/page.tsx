import { HomepageHero } from "@/components/homepage-hero"
import { HomepageSections } from "@/components/homepage-sections"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <HomepageHero />
      <HomepageSections />
    </div>
  )
}
