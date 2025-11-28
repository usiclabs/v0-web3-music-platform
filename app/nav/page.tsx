"use client"

import type React from "react"
import { Info } from "lucide-react"

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
  BookOpen,
  FileText,
  Shield,
  BarChart3,
  DollarSign,
  ArrowLeftRight,
  Coins,
  Wallet,
  Gift,
  Droplets,
  Radio,
  Disc3,
  Headphones,
  Mic2,
  ListMusic,
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
    title: "Discover",
    href: "/discover",
    icon: Headphones,
    description: "Find your next favorite track",
  },
  {
    title: "Charts",
    href: "/trending",
    icon: TrendingUp,
    description: "Top tracks climbing the ranks",
  },
  {
    title: "Explore",
    href: "/explore",
    icon: Search,
    description: "Deep dive into the catalog",
  },
  {
    title: "Your Feed",
    href: "/following",
    icon: ListMusic,
    description: "Fresh drops from artists you follow",
    requiresAuth: true,
  },
  {
    title: "Artists",
    href: "/artists",
    icon: Mic2,
    description: "Meet the creators",
  },
  {
    title: "Live Sessions",
    href: "/live",
    icon: Radio,
    description: "Tune into live performances",
  },
  {
    title: "Sound Coins",
    href: "/tokens",
    icon: Disc3,
    description: "Invest in the music you love",
  },
  {
    title: "Studio",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your creative command center",
    requiresAuth: true,
  },
  {
    title: "Drop a Track",
    href: "/dashboard/upload",
    icon: Upload,
    description: "Release your sound to the world",
    requiresAuth: true,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    description: "Your artist identity",
    requiresAuth: true,
  },
  {
    title: "Wallet",
    href: "/wallet",
    icon: Wallet,
    description: "Royalties & holdings",
    requiresAuth: true,
  },
  {
    title: "Airdrop",
    href: "/airdrop",
    icon: Gift,
    description: "Claim your rewards",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Track your performance",
  },
  {
    title: "Royalties",
    href: "/dashboard/earnings",
    icon: DollarSign,
    description: "Your streaming revenue",
    requiresAuth: true,
  },
  {
    title: "Swap",
    href: "/swap",
    icon: ArrowLeftRight,
    description: "Trade artist tokens",
  },
  {
    title: "Liquidity",
    href: "/lp-manager",
    icon: Droplets,
    description: "Provide & earn from pools",
  },
  {
    title: "Staking",
    href: "/staking",
    icon: Coins,
    description: "Stake tokens, earn rewards",
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
    description: "Tracks you can't stop playing",
    requiresAuth: true,
  },
  {
    title: "About",
    href: "/about",
    icon: Info,
    description: "Our story & mission",
  },
  {
    title: "Docs",
    href: "/docs",
    icon: BookOpen,
    description: "Learn the platform",
  },
  {
    title: "Terms",
    href: "/terms",
    icon: FileText,
    description: "Legal fine print",
  },
  {
    title: "Privacy",
    href: "/privacy",
    icon: Shield,
    description: "How we protect you",
  },
]

export default function NavPage() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-red-950/10 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated sound wave lines */}
        <div className="absolute top-20 left-0 right-0 flex justify-center gap-1 opacity-10">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-red-500 rounded-full animate-pulse"
              style={{
                height: `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}px`,
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>
        {/* Floating vinyl records */}
        <div
          className="absolute top-40 left-10 w-32 h-32 rounded-full border border-red-500/10 animate-spin"
          style={{ animationDuration: "20s" }}
        >
          <div className="absolute inset-4 rounded-full border border-red-500/10" />
          <div className="absolute inset-8 rounded-full border border-red-500/10" />
          <div className="absolute inset-[45%] rounded-full bg-red-500/20" />
        </div>
        <div
          className="absolute bottom-40 right-10 w-48 h-48 rounded-full border border-red-500/5 animate-spin"
          style={{ animationDuration: "30s", animationDirection: "reverse" }}
        >
          <div className="absolute inset-6 rounded-full border border-red-500/5" />
          <div className="absolute inset-12 rounded-full border border-red-500/5" />
          <div className="absolute inset-[45%] rounded-full bg-red-500/10" />
        </div>
        {/* Gradient orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-red-600/5 rounded-full blur-3xl" />
      </div>

      <div className="container max-w-6xl px-4 py-8 sm:py-12 pb-24 mx-auto flex flex-col items-center relative z-10">
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
            <Disc3 className="h-4 w-4 text-red-500 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-sm font-medium text-red-500">Now Playing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
            Where Do You Want To{" "}
            <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">Vibe</span>?
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Your backstage pass to the decentralized music revolution. Pick your destination.
          </p>
          {/* Animated equalizer under header */}
          <div className="flex justify-center gap-1 pt-4">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500/60 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 w-full max-w-7xl mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isDisabled = item.requiresAuth && !isConnected

            return (
              <Link
                key={item.href}
                href={isDisabled ? "#" : item.href}
                className={cn(
                  "group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/10 bg-card/50 backdrop-blur-sm transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl hover:shadow-red-500/10 hover:border-red-500/30",
                  "active:scale-95",
                  isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault()
                  }
                }}
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-600/0 group-hover:from-red-500/10 group-hover:to-red-600/5 transition-all duration-300" />

                {/* Content */}
                <div className="relative p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 min-h-[140px] sm:min-h-[160px]">
                  {/* Icon - All using red color scheme */}
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:shadow-xl group-hover:shadow-red-500/30 transition-all duration-300 group-hover:scale-110">
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-red-500 transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                  {/* Auth Badge */}
                  {item.requiresAuth && !isConnected && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-red-500/10 backdrop-blur-sm border border-red-500/20">
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

        {!isConnected && (
          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <Headphones className="h-5 w-5 text-red-500" />
              <p className="text-sm text-muted-foreground">Connect your wallet to unlock the full experience</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
