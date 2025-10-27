import { HomepageHero } from "@/components/homepage-hero"
import { HomepageSections } from "@/components/homepage-sections"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <HomepageHero />
      <HomepageSections />
    </div>
  )
}
