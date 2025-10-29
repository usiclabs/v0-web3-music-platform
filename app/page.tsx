"use client"

import type React from "react"

import Link from "next/link"
import { useWallet } from "@/lib/web3/wallet-context"
import {
  Home,
  Compass,
  TrendingUp,
  Search,
  Users,
  LayoutDashboard,
  Upload,
  User,
  History,
  Heart,
  Music,
  BookOpen,
  FileText,
  Shield,
  Info,
  Zap,
  BarChart3,
  DollarSign,
  ArrowLeftRight,
  Coins,
  Wallet,
  Gift,
  UserCheck,
  Sparkles,
  Radio,
  TrendingDown as TrendingUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  description: string
  gradient: string
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/landing",
    icon: Home,
    description: "Back to homepage",
    gradient: "from-[#FF6B6B] to-[#FF5252]",
  },
  {
    title: "AI Create",
    href: "/create",
    icon: Sparkles,
    description: "Generate music with AI",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Discover",
    href: "/discover",
    icon: Compass,
    description: "Find new music",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Trending",
    href: "/trending",
    icon: TrendingUp,
    description: "What's hot now",
    gradient: "from-orange-500 to-red-500",
  },
  {
    title: "Live",
    href: "/live",
    icon: Radio,
    description: "Watch live streams",
    gradient: "from-red-500 to-rose-500",
  },
  {
    title: "Explore",
    href: "/explore",
    icon: Search,
    description: "Search all tracks",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Following",
    href: "/following",
    icon: UserCheck,
    description: "Tracks from artists you follow",
    gradient: "from-indigo-500 to-purple-500",
    requiresAuth: true,
  },
  {
    title: "Artists",
    href: "/artists",
    icon: Users,
    description: "Browse creators",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Your music hub",
    gradient: "from-violet-500 to-purple-500",
    requiresAuth: true,
  },
  {
    title: "Upload",
    href: "/dashboard/upload",
    icon: Upload,
    description: "Share your music",
    gradient: "from-[#FF6B6B] to-[#FF5252]",
    requiresAuth: true,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    description: "Your account",
    gradient: "from-pink-500 to-rose-500",
    requiresAuth: true,
  },
  {
    title: "Wallet",
    href: "/wallet",
    icon: Wallet,
    description: "Balances & history",
    gradient: "from-amber-500 to-orange-500",
    requiresAuth: true,
  },
  {
    title: "Auto-Invest",
    href: "/auto-invest",
    icon: TrendingUpDown,
    description: "Automated investments",
    gradient: "from-emerald-500 to-teal-500",
    requiresAuth: true,
  },
  {
    title: "Airdrop",
    href: "/airdrop",
    icon: Gift,
    description: "Check eligibility",
    gradient: "from-[#E53E3E] to-[#DC2626]",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Platform metrics",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    title: "Earnings",
    href: "/dashboard/earnings",
    icon: DollarSign,
    description: "Your revenue",
    gradient: "from-yellow-500 to-orange-500",
    requiresAuth: true,
  },
  {
    title: "Swap",
    href: "/swap",
    icon: ArrowLeftRight,
    description: "Swap tokens",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    title: "Staking",
    href: "/staking",
    icon: Coins,
    description: "Stake & earn",
    gradient: "from-emerald-500 to-green-500",
  },
  {
    title: "History",
    href: "/profile?tab=history",
    icon: History,
    description: "Listening history",
    gradient: "from-slate-500 to-gray-500",
    requiresAuth: true,
  },
  {
    title: "Liked",
    href: "/profile?tab=liked",
    icon: Heart,
    description: "Favorite tracks",
    gradient: "from-red-500 to-pink-500",
    requiresAuth: true,
  },
  {
    title: "About",
    href: "/about",
    icon: Info,
    description: "Learn more",
    gradient: "from-teal-500 to-cyan-500",
  },
  {
    title: "Docs",
    href: "/docs",
    icon: BookOpen,
    description: "Documentation",
    gradient: "from-amber-500 to-yellow-500",
  },
  {
    title: "Terms",
    href: "/terms",
    icon: FileText,
    description: "Terms of service",
    gradient: "from-gray-500 to-slate-500",
  },
  {
    title: "Privacy",
    href: "/privacy",
    icon: Shield,
    description: "Privacy policy",
    gradient: "from-blue-500 to-indigo-500",
  },
]

export default function HomePage() {
  const { isConnected } = useWallet()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container max-w-6xl px-4 py-8 sm:py-12 mx-auto flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Navigation Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Explore USIC
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            Your gateway to the decentralized music revolution. Choose where you want to go.
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
                  "group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300",
                  "hover:scale-105 hover:shadow-2xl hover:border-primary/50",
                  "active:scale-95",
                  isDisabled && "opacity-50 cursor-not-allowed hover:scale-100",
                )}
                onClick={(e) => {
                  if (isDisabled) {
                    e.preventDefault()
                  }
                }}
              >
                {/* Gradient Background */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300",
                    item.gradient,
                  )}
                />

                {/* Content */}
                <div className="relative p-4 sm:p-6 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3 min-h-[140px] sm:min-h-[160px]">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center",
                      "shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110",
                      item.gradient,
                    )}
                  >
                    <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>

                  {/* Auth Badge */}
                  {item.requiresAuth && !isConnected && (
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-muted/80 backdrop-blur-sm">
                      <span className="text-[10px] font-medium text-muted-foreground">Connect Wallet</span>
                    </div>
                  )}
                </div>

                {/* Shine Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Footer Note */}
        {!isConnected && (
          <div className="mt-8 sm:mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
              <Music className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Connect your wallet to unlock all features</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
