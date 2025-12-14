"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { TrendingUp, Zap, Radio, Music, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Agent {
  id: string
  name: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  features: string[]
  gradient: string
}

export default function AgentsPage() {
  const router = useRouter()
  const { isConnected, address } = useAccount()
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTouchCard, setActiveTouchCard] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const agents: Agent[] = [
    {
      id: "beat-scout",
      name: "Beat Scout",
      title: "X402 Investment Agent",
      description:
        "Scan the platform for promising music drops and automatically invest in tracks that match your criteria. Your autonomous venture capital for music.",
      icon: <TrendingUp className="w-8 h-8" />,
      href: isConnected ? "/dashboard/agent" : "/agents/beat-scout",
      color: "from-violet-500 to-purple-600",
      gradient: "group-hover:from-violet-600 group-hover:to-purple-700",
      features: ["Auto-invest", "Signal Detection", "Portfolio Tracking"],
    },
    {
      id: "market-maker",
      name: "Market Maker",
      title: "Liquidity Agent (V3/V4)",
      description:
        "Provide liquidity to $USI token pools and earn trading fees. Supports both Uniswap V3 and V4 pools with automatic version selection.",
      icon: <Zap className="w-8 h-8" />,
      href: isConnected ? "/dashboard/agent/mm" : "/agents/market-maker",
      color: "from-blue-500 to-cyan-600",
      gradient: "group-hover:from-blue-600 group-hover:to-cyan-700",
      features: ["Uniswap V3/V4", "Fee Optimization", "Multi-chain Support"],
    },
    {
      id: "auto-stream",
      name: "Auto Stream",
      title: "Revenue Agent",
      description:
        "Automatically stream tracks and earn revenue. Generates passive income by streaming music 24/7 and tracking all earnings in real-time.",
      icon: <Radio className="w-8 h-8" />,
      href: isConnected ? "/dashboard/agent/auto-stream" : "/agents/auto-stream",
      color: "from-green-500 to-emerald-600",
      gradient: "group-hover:from-green-600 group-hover:to-emerald-700",
      features: ["24/7 Streaming", "Earnings Tracking", "Analytics"],
    },
    {
      id: "autonomous-artist",
      name: "Autonomous Artist",
      title: "Music Creator Agent",
      description:
        "Generate unique music automatically and list it on the platform. Your AI-powered music producer that creates and uploads tracks autonomously.",
      icon: <Music className="w-8 h-8" />,
      href: isConnected ? "/dashboard/agent/autonomous-artist" : "/agents/autonomous-artist",
      color: "from-pink-500 to-rose-600",
      gradient: "group-hover:from-pink-600 group-hover:to-rose-700",
      features: ["AI Generation", "Auto-Upload", "Style Control"],
    },
  ]

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
      {/* Background animated elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-violet-500 opacity-5 blur-3xl rounded-full animate-pulse-slow" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-blue-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Header Section - Enhanced mobile padding and font scaling */}
        <div className="pt-8 sm:pt-16 lg:pt-20 px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6 bg-white/5 backdrop-blur-xl rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-white/10 animate-fade-in">
            <Sparkles className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-accent" />
            <span className="text-xs sm:text-sm font-medium text-white/80">Choose Your Agent</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent animate-slide-up leading-tight">
            Select Your AI Agent
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-white/60 max-w-2xl mx-auto mb-2 px-2 animate-slide-up animation-delay-2000">
            Choose from our suite of autonomous agents to automate your music career or investments
          </p>

          {!isConnected && (
            <p className="text-xs sm:text-sm text-accent/80 mt-2 animate-slide-up animation-delay-4000">
              Connect your wallet to access agent dashboards
            </p>
          )}
        </div>

        {/* Cards Grid - Improved responsive columns and gap */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-12">
            {agents.map((agent, index) => (
              <Link
                key={agent.id}
                href={agent.href}
                onMouseEnter={() => setHoveredCard(agent.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setActiveTouchCard(activeTouchCard === agent.id ? null : agent.id)}
                className="group h-full active:scale-95 transition-transform duration-200 md:active:scale-100"
              >
                <div
                  className="h-full relative perspective transition-all duration-500"
                  style={{
                    transform:
                      hoveredCard === agent.id || activeTouchCard === agent.id
                        ? "translateY(-8px) scale(1.02)"
                        : "translateY(0) scale(1)",
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl blur-xl opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity duration-500 group-hover:from-white/[0.12] group-hover:to-white/[0.04]" />

                  {/* Main card */}
                  <div className="relative h-full p-4 sm:p-6 rounded-2xl border border-white/10 group-hover:border-white/30 md:group-hover:border-white/30 transition-colors duration-500 backdrop-blur-xl bg-white/[0.02] hover:bg-white/[0.04] md:hover:bg-white/[0.04] overflow-hidden">
                    {/* Gradient accent */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 md:group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="mb-3 sm:mb-4">
                        <div
                          className={`inline-flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 rounded-lg bg-gradient-to-br ${agent.color} text-white shadow-lg transition-all duration-500 group-hover:shadow-xl md:group-hover:shadow-xl group-hover:scale-110 md:group-hover:scale-110`}
                        >
                          {agent.icon}
                        </div>
                      </div>

                      <div className="mb-2 sm:mb-3">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-0.5 sm:mb-1 group-hover:text-accent md:group-hover:text-accent transition-colors duration-300">
                          {agent.name}
                        </h3>
                        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">{agent.title}</p>
                      </div>

                      <p className="text-sm text-white/70 mb-3 sm:mb-4 flex-grow line-clamp-2 sm:line-clamp-3 group-hover:text-white/80 md:group-hover:text-white/80 transition-colors duration-300">
                        {agent.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                        {agent.features.map((feature, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/60 border border-white/10 group-hover:bg-white/10 md:group-hover:bg-white/10 group-hover:text-white/80 md:group-hover:text-white/80 transition-all duration-300 whitespace-nowrap"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="mt-auto">
                        <button className="w-full inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 md:hover:from-white/20 hover:to-white/10 md:hover:to-white/10 border border-white/20 text-white/80 hover:text-white md:hover:text-white font-medium text-sm transition-all duration-300 group-hover:border-white/30 md:group-hover:border-white/30 min-h-[2.75rem] sm:min-h-[2.5rem]">
                          <span>View Agent</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 md:group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                      </div>
                    </div>

                    {/* Shine effect on hover - Disabled on mobile for performance */}
                    <div className="hidden md:block absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Section - Improved mobile layout */}
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4 sm:gap-8">
              <div className="text-center animate-slide-up animation-delay-2000">
                <div className="text-2xl sm:text-4xl font-bold text-accent mb-1 sm:mb-2">4</div>
                <p className="text-xs sm:text-base text-white/60">Autonomous Agents</p>
              </div>
              <div className="text-center animate-slide-up animation-delay-4000">
                <div className="text-2xl sm:text-4xl font-bold text-accent mb-1 sm:mb-2">24/7</div>
                <p className="text-xs sm:text-base text-white/60">Always Working</p>
              </div>
              <div className="text-center animate-slide-up animation-delay-4000">
                <div className="text-2xl sm:text-4xl font-bold text-accent mb-1 sm:mb-2">∞</div>
                <p className="text-xs sm:text-base text-white/60">Earning Potential</p>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="mt-8 sm:mt-12 text-center px-4">
              <p className="text-white/60 mb-4 text-sm sm:text-base">
                Ready to automate? Connect your wallet to get started
              </p>
              <Button size="lg" className="animate-fade-in w-full sm:w-auto">
                <Link href="/dashboard">Connect Wallet</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
