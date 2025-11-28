"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
  Music,
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
import { cn } from "@/lib/utils"

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Spinning vinyl records */}
        <div className="absolute top-20 left-10 w-32 h-32 opacity-5">
          <Disc3 className="w-full h-full text-red-500 animate-spin" style={{ animationDuration: "8s" }} />
        </div>
        <div className="absolute bottom-40 right-20 w-48 h-48 opacity-5">
          <Disc3 className="w-full h-full text-red-500 animate-spin" style={{ animationDuration: "12s" }} />
        </div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 opacity-5">
          <Disc3 className="w-full h-full text-red-500 animate-spin" style={{ animationDuration: "6s" }} />
        </div>

        {/* Sound wave lines */}
        <div className="absolute top-1/3 right-0 flex items-center gap-1 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-gradient-to-t from-red-500 to-red-600 rounded-full animate-pulse"
              style={{
                height: `${20 + Math.sin(i * 0.8) * 30}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>

        {/* Floating music notes effect */}
        <div className="absolute bottom-20 left-1/3 opacity-5">
          <Music className="w-16 h-16 text-red-500 animate-bounce" style={{ animationDuration: "3s" }} />
        </div>
        <div className="absolute top-40 right-1/3 opacity-5">
          <Headphones
            className="w-20 h-20 text-red-500 animate-bounce"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          />
        </div>
      </div>

      <div className="container max-w-6xl px-4 py-8 sm:py-12 mx-auto flex flex-col items-center relative z-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <div className="relative">
              <Disc3 className="h-5 w-5 text-red-500 animate-spin" style={{ animationDuration: "3s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              </div>
            </div>
            <span className="text-sm font-medium text-red-500">Now Spinning</span>
            <div className="flex items-center gap-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${8 + i * 4}px`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
            Where Do You Want To Vibe?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Your backstage pass to the decentralized music revolution. Pick your destination.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full max-w-7xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isDisabled = item.requiresAuth && !isConnected

            return (
              <Link
                key={item.href}
                href={isDisabled ? "#" : item.href}
                className={cn(
                  "group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/20 bg-card/50 backdrop-blur-sm transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/50",
                  "active:scale-95",
                  isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault()
                  }
                }}
              >
                {/* Gradient Background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/5 transition-all duration-300" />

                {/* Content */}
                <div className="relative p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 min-h-[140px] sm:min-h-[160px]">
                  {/* Icon - unified red gradient */}
                  <div className="relative">
                    <div
                      className={cn(
                        "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center",
                        "shadow-lg shadow-red-500/25 group-hover:shadow-xl group-hover:shadow-red-500/40 transition-all duration-300 group-hover:scale-110",
                      )}
                    >
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </div>
                    {/* Pulse ring effect on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl bg-red-500/20 scale-100 opacity-0 group-hover:scale-150 group-hover:opacity-0 transition-all duration-500 animate-ping"
                      style={{ animationDuration: "2s" }}
                    />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                  {/* Auth Badge */}
                  {item.requiresAuth && !isConnected && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
                      <span className="text-[10px] font-medium text-red-400">Connect Wallet</span>
                    </div>
                  )}
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer Note */}
        {!isConnected && (
          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <Headphones className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Connect your wallet to unlock all backstage features</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
