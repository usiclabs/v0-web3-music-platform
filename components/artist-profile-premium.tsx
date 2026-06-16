"use client"

import { TopNav } from "@/components/artist-profile/top-nav"
import { TokenBanner } from "@/components/artist-profile/token-banner"
import { HeroCard } from "@/components/artist-profile/hero-card"
import { EarningsCard } from "@/components/artist-profile/earnings-card"
import { StatCard } from "@/components/artist-profile/stat-card"
import { BottomNav } from "@/components/artist-profile/bottom-nav"
import { TracksGrid } from "@/components/artist-profile/tracks-grid"
import { SocialLinks } from "@/components/artist-profile/social-links"
import { Button } from "@/components/ui/button"
import { Heart, Share2, Play } from "lucide-react"
import { motion } from "framer-motion"

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
  tracks?: Array<{
    id: string
    title: string
    cover_url?: string
    duration?: number
    price_per_chunk?: number
  }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
}

export function ArtistProfilePremium({ artist, stats, tracks = [] }: ArtistProfilePremiumProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black">
      {/* Top Nav */}
      <TopNav walletAddress={artist.wallet_address} />

      {/* Scrollable Content */}
      <div className="pt-16 pb-32">
        {/* Token Banner */}
        <TokenBanner />

        {/* Hero Card with Enhanced Actions */}
        <motion.div
          className="px-6 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <HeroCard
            name={artist.artist_name || "Artist"}
            avatar={artist.avatar_url || ""}
            walletAddress={artist.wallet_address}
            bio={artist.bio || ""}
            verified={artist.verified}
          />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button className="flex-1 gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-500/30">
              <Play className="h-4 w-4 fill-white" />
              Play All
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Heart className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>

        {/* Earnings Card */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <EarningsCard amount={stats.totalEarnings} currency="USDC" />
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="px-6 mb-6 grid grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
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
        </motion.div>

        {/* Social Links */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <SocialLinks />
        </motion.div>

        {/* About Section */}
        {artist.bio && (
          <motion.div
            className="px-6 mb-6"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6">
              <h3 className="text-sm font-bold text-white tracking-wider mb-3">ABOUT</h3>
              <p className="text-sm text-gray-300 leading-relaxed">{artist.bio}</p>
            </div>
          </motion.div>
        )}

        {/* Tracks Section */}
        {tracks && tracks.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <TracksGrid tracks={tracks} />
          </motion.div>
        )}

        {/* Stats Breakdown Card */}
        <motion.div
          className="px-6 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-900/50 to-black border border-white/10 backdrop-blur-xl p-6">
            <h3 className="text-sm font-bold text-white tracking-wider mb-4">STATS</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">All-time earnings</span>
                <span className="text-sm font-bold text-red-400">${stats.totalEarnings.toFixed(4)} USDC</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Tracks published</span>
                <span className="text-sm font-bold text-white">{stats.trackCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Community followers</span>
                <span className="text-sm font-bold text-white">{stats.followerCount}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3 flex items-center justify-between">
                <span className="text-xs text-gray-400">Wallet address</span>
                <span className="text-xs font-mono text-gray-400">{`${artist.wallet_address.slice(0, 6)}...${artist.wallet_address.slice(-4)}`}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="px-6 mb-6"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="rounded-2xl bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent border border-red-500/20 backdrop-blur-xl p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Subscribe to This Artist</h3>
            <p className="text-sm text-gray-400 mb-4">Get notified for new releases and exclusive content</p>
            <Button className="gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-semibold shadow-lg shadow-red-500/30">
              Subscribe Now
            </Button>
          </div>
        </motion.div>

        {/* Spacer for bottom nav */}
        <div className="h-12" />
      </div>

      {/* Bottom Site Pill */}
      <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-white/10 backdrop-blur-xl">
          <span className="text-xs text-gray-400">🎵</span>
          <span className="text-xs font-medium text-gray-300">mymusic.xyz</span>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav activeTab="artists" />
    </div>
  )
}
