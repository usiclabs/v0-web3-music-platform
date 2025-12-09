"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/web3/wallet-context"
import {
  Home,
  TrendingUp,
  Search,
  LayoutDashboard,
  Upload,
  User,
  History,
  Heart,
  BookOpen,
  FileText,
  Shield,
  Zap,
  BarChart3,
  DollarSign,
  ArrowLeftRight,
  Coins,
  Wallet,
  Gift,
  UserCheck,
  Droplets,
  Radio,
  Info,
  Activity,
  Sparkles,
  Disc3,
  Headphones,
  Mic2,
} from "lucide-react"
import { HomepageHero } from "@/components/homepage-hero"
import { HomepageSections } from "@/components/homepage-sections"
import { TrendingWidget } from "@/components/trending-widget"
import { FeaturedArtistsCarousel } from "@/components/featured-artists-carousel"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  description: string
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Main Stage",
    href: "/landing",
    icon: Home,
    description: "Return to the spotlight",
  },
  {
    title: "Sound Safari",
    href: "/discover",
    icon: Headphones,
    description: "Hunt for fresh beats",
  },
  {
    title: "Hot Charts",
    href: "/trending",
    icon: TrendingUp,
    description: "Tracks on fire right now",
  },
  {
    title: "First Set",
    href: "/onboarding",
    icon: Zap,
    description: "Learn the ropes",
  },
  {
    title: "Backstage Pass",
    href: "/community-update",
    icon: Sparkles,
    description: "X402 & ERC-8004 drops",
  },
  {
    title: "Live Wire",
    href: "/activity-feed",
    icon: Activity,
    description: "Real-time platform pulse",
  },
  {
    title: "AI DJ",
    href: "/ai-curator",
    icon: Disc3,
    description: "Smart playlists that get you",
  },
  {
    title: "Release Notes",
    href: "/changelog",
    icon: FileText,
    description: "What's new in the studio",
  },
  {
    title: "Deep Dive",
    href: "/explore",
    icon: Search,
    description: "Search the entire catalog",
  },
  {
    title: "Your Feed",
    href: "/following",
    icon: UserCheck,
    description: "Drops from your favorites",
    requiresAuth: true,
  },
  {
    title: "The Roster",
    href: "/artists",
    icon: Mic2,
    description: "Meet the creators",
  },
  {
    title: "On Air",
    href: "/live",
    icon: Radio,
    description: "Live sessions happening now",
  },
  {
    title: "Sound Coins",
    href: "/tokens",
    icon: Coins,
    description: "Own pieces of music",
  },
  {
    title: "Control Room",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your artist HQ",
    requiresAuth: true,
  },
  {
    title: "Drop a Track",
    href: "/dashboard/upload",
    icon: Upload,
    description: "Release your sound",
    requiresAuth: true,
  },
  {
    title: "Artist Profile",
    href: "/profile",
    icon: User,
    description: "Your public identity",
    requiresAuth: true,
  },
  {
    title: "Vault",
    href: "/wallet",
    icon: Wallet,
    description: "Your digital treasury",
    requiresAuth: true,
  },
  {
    title: "Free Drops",
    href: "/airdrop",
    icon: Gift,
    description: "Claim your rewards",
  },
  {
    title: "The Numbers",
    href: "/analytics",
    icon: BarChart3,
    description: "Platform performance",
  },
  {
    title: "Royalties",
    href: "/dashboard/earnings",
    icon: DollarSign,
    description: "Your streaming revenue",
    requiresAuth: true,
  },
  {
    title: "Token Mixer",
    href: "/swap",
    icon: ArrowLeftRight,
    description: "Trade sound coins",
  },
  {
    title: "Liquidity Pool",
    href: "/lp-manager",
    icon: Droplets,
    description: "Provide trading depth",
  },
  {
    title: "Stake & Earn",
    href: "/staking",
    icon: Coins,
    description: "Lock tokens for rewards",
  },
  {
    title: "Play History",
    href: "/profile?tab=history",
    icon: History,
    description: "Your listening journey",
    requiresAuth: true,
  },
  {
    title: "Favorites",
    href: "/profile?tab=liked",
    icon: Heart,
    description: "Tracks you love",
    requiresAuth: true,
  },
  {
    title: "The Story",
    href: "/about",
    icon: Info,
    description: "Our mission",
  },
  {
    title: "Guidebook",
    href: "/docs",
    icon: BookOpen,
    description: "How it all works",
  },
  {
    title: "Terms",
    href: "/terms",
    icon: FileText,
    description: "The fine print",
  },
  {
    title: "Privacy",
    href: "/privacy",
    icon: Shield,
    description: "Your data, protected",
  },
]

export default function HomePage() {
  const { isConnected } = useWallet()
  const router = useRouter()

  useEffect(() => {
    const hasVisited = localStorage.getItem("hasVisitedBefore")

    if (!hasVisited) {
      router.push("/landing")
    }
  }, [router])

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
