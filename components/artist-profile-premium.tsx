"use client"

import { TopNav } from "@/components/artist-profile/top-nav"
import { TokenBanner } from "@/components/artist-profile/token-banner"
import { HeroCard } from "@/components/artist-profile/hero-card"
import { EarningsCard } from "@/components/artist-profile/earnings-card"
import { StatCard } from "@/components/artist-profile/stat-card"
import { BottomNav } from "@/components/artist-profile/bottom-nav"
import { Button } from "@/components/ui/button"

interface ArtistProfilePremiumProps {
  artist: {
    artist_name: string
    avatar_url: string
    bio: string
    wallet_address: string
    verified?: boolean
  }
  stats: {
    totalEarnings: number
    trackCount: number
    followerCount: number
  }
}

export function ArtistProfilePremium({ artist, stats }: ArtistProfilePremiumProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      {/* Top Nav */}
      <TopNav walletAddress={artist.wallet_address} />

      {/* Scrollable Content */}
      <div className="pt-16 pb-24">
        {/* Token Banner */}
        <TokenBanner />

        {/* Hero Card */}
        <HeroCard
          name={artist.artist_name || "Artist"}
          avatar={artist.avatar_url || ""}
          walletAddress={artist.wallet_address}
          bio={artist.bio || ""}
          verified={artist.verified}
        />

        {/* Earnings Card */}
        <EarningsCard amount={stats.totalEarnings} currency="USDC" />

        {/* Stats Grid */}
        <div className="px-6 mb-6 grid grid-cols-2 gap-4">
          <StatCard
            icon="tracks"
            value={stats.trackCount}
            label="TRACKS"
            description="Total released"
          />
          <StatCard
            icon="followers"
            value={stats.followerCount}
            label="FOLLOWERS"
            description="Total followers"
          />
        </div>

        {/* Additional Content Space */}
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-500">More coming soon...</p>
        </div>
      </div>

      {/* Bottom Site Pill */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl">
          <span className="text-xs text-gray-400">🔒</span>
          <span className="text-xs font-medium text-gray-300">mymusic.xyz</span>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab="artists" />
    </div>
  )
}
