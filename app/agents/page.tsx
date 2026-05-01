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
      title: "Liquidity Agent",
      description:
        "Provide liquidity to $USI token pools and earn trading fees. This agent automatically optimizes your liquidity positions across multiple pools.",
      icon: <Zap className="w-8 h-8" />,
      href: isConnected ? "/dashboard/agent/mm" : "/agents/market-maker",
      color: "from-blue-500 to-cyan-600",
      gradient: "group-hover:from-blue-600 group-hover:to-cyan-700",
      features: ["Liquidity Pools", "Fee Optimization", "Multi-chain Support"],
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
        {/* Header Section */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 animate-fade-in">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-white/80">Choose Your Agent</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent animate-slide-up">
            Select Your AI Agent
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-2 animate-slide-up animation-delay-2000">
            Choose from our suite of autonomous agents to automate your music career or investments
          </p>

          {!isConnected && (
            <p className="text-sm text-accent/80 animate-slide-up animation-delay-4000">
              Connect your wallet to access agent dashboards
            </p>
          )}

          {/* Quick Links to Skills & Docs */}
          <div className="mt-6 flex justify-center gap-4 flex-wrap animate-slide-up animation-delay-6000">
            <Link href="/agents/skills">
              <Button variant="outline" size="sm" className="border-white/20 hover:border-white/40 text-white/60 hover:text-white">
                <Zap className="w-4 h-4 mr-2" />
                Explore All Skills
              </Button>
            </Link>
            <Link href="/agents/documentation">
              <Button variant="outline" size="sm" className="border-white/20 hover:border-white/40 text-white/60 hover:text-white">
                <ArrowRight className="w-4 h-4 mr-2" />
                View Specifications
              </Button>
            </Link>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {agents.map((agent, index) => (
              <Link
                key={agent.id}
                href={agent.href}
                onMouseEnter={() => setHoveredCard(agent.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="group h-full"
              >
                <div
                  className="h-full relative perspective transition-all duration-500"
                  style={{
                    transform: hoveredCard === agent.id ? "translateY(-8px) scale(1.02)" : "translateY(0) scale(1)",
                  }}
                >
                  {/* Premium glass background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:from-white/[0.12] group-hover:to-white/[0.04]" />

                  {/* Main card */}
                  <div className="relative h-full p-6 rounded-2xl border border-white/10 group-hover:border-white/30 transition-colors duration-500 backdrop-blur-xl bg-white/[0.02] hover:bg-white/[0.04] overflow-hidden">
                    {/* Gradient accent */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col h-full">
                      {/* Icon section */}
                      <div className="mb-4">
                        <div
                          className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${agent.color} text-white shadow-lg transition-all duration-500 group-hover:shadow-xl group-hover:scale-110`}
                        >
                          {agent.icon}
                        </div>
                      </div>

                      {/* Title and subtitle */}
                      <div className="mb-3">
                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-accent transition-colors duration-300">
                          {agent.name}
                        </h3>
                        <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">{agent.title}</p>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-white/70 mb-4 flex-grow line-clamp-3 group-hover:text-white/80 transition-colors duration-300">
                        {agent.description}
                      </p>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {agent.features.map((feature, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded-full bg-white/5 text-white/60 border border-white/10 group-hover:bg-white/10 group-hover:text-white/80 transition-all duration-300"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <div className="mt-auto">
                        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 border border-white/20 text-white/80 hover:text-white font-medium text-sm transition-all duration-300 group-hover:border-white/30">
                          <span>View Agent</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </button>
                      </div>
                    </div>

                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Section */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center animate-slide-up animation-delay-2000">
                <div className="text-4xl font-bold text-accent mb-2">4</div>
                <p className="text-white/60">Pre-built Agents</p>
              </div>
              <div className="text-center animate-slide-up animation-delay-4000">
                <div className="text-4xl font-bold text-accent mb-2">6</div>
                <p className="text-white/60">Core Skills</p>
              </div>
              <div className="text-center animate-slide-up animation-delay-6000">
                <div className="text-4xl font-bold text-accent mb-2">24/7</div>
                <p className="text-white/60">Always Working</p>
              </div>
              <div className="text-center animate-slide-up animation-delay-8000">
                <div className="text-4xl font-bold text-accent mb-2">∞</div>
                <p className="text-white/60">Earning Potential</p>
              </div>
            </div>
          </div>

          {/* Agent Skills Highlight */}
          <div className="mt-16 pt-12 border-t border-white/10">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Agent Skills Framework</h2>
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <h3 className="font-semibold text-white mb-2">Discovery Skills</h3>
                  <p className="text-sm text-white/60 mb-3">Autonomously identify emerging artists and investment opportunities</p>
                  <ul className="text-xs text-white/50 space-y-1">
                    <li>✓ Artist Discovery Engine</li>
                    <li>✓ Token Sniper</li>
                    <li>✓ Social Amplifier</li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <h3 className="font-semibold text-white mb-2">Portfolio Skills</h3>
                  <p className="text-sm text-white/60 mb-3">Manage and optimize your token holdings automatically</p>
                  <ul className="text-xs text-white/50 space-y-1">
                    <li>✓ Portfolio Rebalancer</li>
                    <li>✓ Risk Management</li>
                    <li>✓ Performance Tracking</li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <h3 className="font-semibold text-white mb-2">Trading Skills</h3>
                  <p className="text-sm text-white/60 mb-3">Execute trades and provide autonomous market making</p>
                  <ul className="text-xs text-white/50 space-y-1">
                    <li>✓ Market Maker Bot</li>
                    <li>✓ Liquidity Management</li>
                    <li>✓ Spread Optimization</li>
                  </ul>
                </div>
                <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <h3 className="font-semibold text-white mb-2">Streaming Skills</h3>
                  <p className="text-sm text-white/60 mb-3">Maximize artist revenue through intelligent optimization</p>
                  <ul className="text-xs text-white/50 space-y-1">
                    <li>✓ Streaming Optimizer</li>
                    <li>✓ Revenue Forecasting</li>
                    <li>✓ Split Configuration</li>
                  </ul>
                </div>
              </div>
              <div className="text-center">
                <Link href="/agents/skills">
                  <Button className="bg-accent hover:bg-accent/90">
                    Explore All Skills & Workflows
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          {!isConnected && (
            <div className="mt-12 text-center">
              <p className="text-white/60 mb-4">Ready to automate? Connect your wallet to get started</p>
              <Button size="lg" className="animate-fade-in">
                <Link href="/dashboard">Connect Wallet</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
