"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  Zap,
  Bot,
  Network,
  TrendingUp,
  Shield,
  Rocket,
  CheckCircle2,
  ArrowRight,
  Globe,
  Music,
  Coins,
} from "lucide-react"
import Link from "next/link"

export default function CommunityUpdatePage() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated background gradient layers */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-red-800/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-950/15 via-transparent to-transparent" />

        {/* Animated grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000,transparent)]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container px-4 sm:px-6 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-24">
          <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-flex animate-in fade-in slide-in-from-top-4 duration-700">
              <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm backdrop-blur-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 hover:bg-red-500/15 transition-all duration-300">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2 inline animate-pulse" />
                Platform Update - November 2025
              </Badge>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-bold text-white leading-[1.05] sm:leading-[0.95] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance px-2">
              The Future of Agent-to-Agent{" "}
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
                Music Commerce
              </span>
            </h1>

            <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-white/60 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 leading-relaxed text-balance px-2">
              How MyUSIC's integration of X402 and ERC-8004 protocols creates an unstoppable competitive advantage in
              autonomous music transactions
            </p>
          </div>
        </section>

        {/* Key Achievement Banner */}
        <section className="container px-4 sm:px-6 pb-16 sm:pb-20">
          <Card className="max-w-5xl mx-auto bg-gradient-to-br from-red-950/30 via-black/40 to-red-950/20 backdrop-blur-2xl border border-red-500/20 p-6 sm:p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 hover:border-red-500/30 transition-all duration-500 shadow-2xl shadow-red-500/5 hover:shadow-red-500/10">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 animate-pulse shadow-lg shadow-red-500/20">
                <Rocket className="h-8 w-8 sm:h-10 sm:w-10 text-red-400" />
              </div>
              <div className="flex-1 space-y-4 sm:space-y-6">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight text-balance">
                  First Mover Advantage: Unlocked
                </h2>
                <p className="text-base sm:text-lg text-white/70 leading-relaxed">
                  MyUSIC is now the first Web3 music platform to combine micropayment streaming (X402) with trustless AI
                  agent infrastructure (ERC-8004), positioning us as the backbone for autonomous music commerce.
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Badge className="bg-red-500/10 border-red-500/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-xl animate-in fade-in duration-500 delay-500 hover:bg-red-500/20 transition-all">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    First to Market
                  </Badge>
                  <Badge className="bg-red-500/10 border-red-500/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-xl animate-in fade-in duration-500 delay-600 hover:bg-red-500/20 transition-all">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Patent-Pending Tech
                  </Badge>
                  <Badge className="bg-red-500/10 border-red-500/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-xl animate-in fade-in duration-500 delay-700 hover:bg-red-500/20 transition-all">
                    <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Production Ready
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Protocol Breakdown */}
        <section className="container px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
            <div className="text-center space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white text-balance px-2">
                The Dual Protocol Advantage
              </h2>
              <p className="text-base sm:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed px-2">
                Two groundbreaking protocols working together to create an autonomous music economy
              </p>
            </div>

            {/* X402 Protocol Card */}
            <Card className="group bg-black/40 backdrop-blur-2xl border border-red-500/20 p-6 sm:p-8 md:p-12 animate-in fade-in slide-in-from-left-6 duration-700 delay-200 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-red-500/20">
                  <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white text-balance">
                    X402 Protocol: Micropayment Streaming
                  </h3>
                  <p className="text-base sm:text-lg text-white/70">
                    HTTP 402 Payment Required standard enabling real-time, pay-per-second music streaming
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 backdrop-blur-xl hover:bg-white/[0.07] hover:border-red-500/30 transition-all duration-300">
                    <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 text-white">
                      <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 shrink-0" />
                      Instant Settlements
                    </h4>
                    <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                      Artists receive payments in real-time as listeners stream. No waiting for monthly payouts.
                    </p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 backdrop-blur-xl hover:bg-white/[0.07] hover:border-red-500/30 transition-all duration-300">
                    <h4 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3 text-white">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 shrink-0" />
                      Zero Intermediaries
                    </h4>
                    <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                      Direct wallet-to-wallet payments. Artists keep 100% of streaming revenue.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-950/40 to-red-900/20 rounded-xl p-4 sm:p-6 border border-red-500/20 backdrop-blur-xl">
                  <p className="text-xs sm:text-sm font-mono text-red-300 leading-relaxed break-words">
                    Payment Flow: Listener streams 30 seconds → 0.01 USDC sent directly to artist wallet → Instant
                    settlement on Base
                  </p>
                </div>
              </div>
            </Card>

            {/* ERC-8004 Protocol Card */}
            <Card className="group bg-black/40 backdrop-blur-2xl border border-red-500/20 p-6 sm:p-8 md:p-12 animate-in fade-in slide-in-from-right-6 duration-700 delay-300 hover:border-red-500/40 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-red-500/20">
                  <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white text-balance">
                    ERC-8004: Trustless AI Agents
                  </h3>
                  <p className="text-base sm:text-lg text-white/70">
                    On-chain identity, reputation, and validation registry for autonomous AI agents
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.07] hover:border-red-500/30 transition-all duration-300">
                    <h4 className="font-semibold text-sm sm:text-base mb-2 text-white">Identity Registry</h4>
                    <p className="text-xs sm:text-sm text-white/60">NFT-based verifiable identities for AI agents</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.07] hover:border-red-500/30 transition-all duration-300">
                    <h4 className="font-semibold text-sm sm:text-base mb-2 text-white">Reputation System</h4>
                    <p className="text-xs sm:text-sm text-white/60">On-chain feedback and scoring mechanisms</p>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10 backdrop-blur-xl hover:bg-white/[0.07] hover:border-red-500/30 transition-all duration-300">
                    <h4 className="font-semibold text-sm sm:text-base mb-2 text-white">Validation Registry</h4>
                    <p className="text-xs sm:text-sm text-white/60">Third-party verification and attestations</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-950/40 to-red-900/20 rounded-xl p-4 sm:p-6 border border-red-500/20 backdrop-blur-xl">
                  <p className="text-xs sm:text-sm font-mono text-red-300 leading-relaxed break-words">
                    Agent Flow: AI curator creates playlist → Records action on-chain → Users rate quality → Builds
                    reputation → Earns trust
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* The Power of Integration */}
        <section className="container px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto">
            <Card className="bg-gradient-to-br from-white/5 via-black/40 to-white/5 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 md:p-12 animate-in fade-in zoom-in-95 duration-700 delay-100 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 transition-all duration-500">
              <div className="text-center mb-8 sm:mb-12 space-y-4 sm:space-y-6">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-balance px-2">
                  When X402 Meets ERC-8004
                </h2>
                <p className="text-base sm:text-xl text-white/70 leading-relaxed max-w-3xl mx-auto px-2">
                  The combination creates something unprecedented: autonomous music commerce at scale
                </p>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-start gap-3 sm:gap-5 animate-in fade-in slide-in-from-left-4 duration-500 delay-200 hover:translate-x-2 transition-transform">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/20 mt-1 backdrop-blur-xl shrink-0">
                    <Network className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                      Agent-to-Agent Payments
                    </h4>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      AI agents can autonomously discover music, pay for streams via X402, and build playlists—all
                      without human intervention. Their transactions are verified through ERC-8004 identity and
                      reputation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-5 animate-in fade-in slide-in-from-left-4 duration-500 delay-300 hover:translate-x-2 transition-transform">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/20 mt-1 backdrop-blur-xl shrink-0">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                      Cross-Platform Discovery
                    </h4>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      An AI music curator on Platform A can discover and license tracks from MyUSIC using X402 payments,
                      with full trust verification via ERC-8004. The entire transaction happens on-chain, transparently.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-5 animate-in fade-in slide-in-from-left-4 duration-500 delay-400 hover:translate-x-2 transition-transform">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/20 mt-1 backdrop-blur-xl shrink-0">
                    <Music className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                      Reputation-Based Pricing
                    </h4>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      High-reputation AI agents (verified via ERC-8004) can negotiate better X402 streaming rates,
                      creating an economic incentive for agents to build trust and provide value.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-5 animate-in fade-in slide-in-from-left-4 duration-500 delay-500 hover:translate-x-2 transition-transform">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-white/10 border border-white/20 mt-1 backdrop-blur-xl shrink-0">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg sm:text-xl mb-2 sm:mb-3 text-white">Scalable Revenue Model</h4>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      Every AI agent stream generates micropayments. With thousands of agents operating 24/7 across
                      multiple platforms, artists earn passive income while reaching exponentially larger audiences.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Competitive Advantages */}
        <section className="container px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
            <div className="text-center space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white text-balance px-2">
                Unmatched Competitive Advantages
              </h2>
              <p className="text-base sm:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed px-2">
                Why this integration puts MyUSIC years ahead of the competition
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-100 hover:scale-[1.02]">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white">
                      First Mover in Agent Economy
                    </h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      No other music platform has integrated both X402 and ERC-8004. We're establishing the standard for
                      autonomous music commerce before competitors even understand the opportunity.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-150 hover:scale-[1.02]">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white">Network Effects</h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      Every AI agent that joins MyUSIC increases the value for artists and other agents. Traditional
                      platforms can't replicate this compounding network effect.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-200 hover:scale-[1.02]">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white">Zero Platform Risk</h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      All payments and agent identities are on-chain. Even if MyUSIC disappeared tomorrow, the ecosystem
                      would continue functioning—making it safer for enterprise adoption.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-250 hover:scale-[1.02]">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white">Developer Ecosystem</h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      Open protocols mean developers worldwide can build AI agents that interact with MyUSIC. We become
                      the infrastructure layer for music AI innovation.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-300 hover:scale-[1.02]">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white">Regulatory Clarity</h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      Both protocols are open standards with transparent on-chain verification. This provides regulatory
                      clarity that centralized AI music platforms can't match.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-black/40 backdrop-blur-2xl border border-white/10 p-6 sm:p-8 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 delay-350 hover:scale-[1.02]">
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-white">24/7 Revenue Generation</h3>
                    <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                      AI agents don't sleep. Artists earn streaming revenue around the clock as automated systems
                      discover and play their music across global time zones.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section className="container px-4 sm:px-6 pb-16 sm:pb-20">
          <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12">
            <div className="text-center space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white text-balance px-2">
                Real-World Use Cases
              </h2>
              <p className="text-base sm:text-xl text-white/60 leading-relaxed px-2">
                How agent-to-agent commerce is already transforming music
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <Card className="bg-gradient-to-r from-red-950/20 to-red-900/10 backdrop-blur-2xl border border-red-500/20 p-6 sm:p-8 animate-in fade-in slide-in-from-left-6 duration-500 delay-100 hover:translate-x-2 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all">
                <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-white">1. AI Playlist Curators</h3>
                <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed">
                  An AI agent analyzes millions of tracks, discovers emerging artists, and creates themed playlists. It
                  pays for streams via X402, builds reputation through ERC-8004 by creating high-quality playlists, and
                  earns revenue by licensing playlists to other platforms.
                </p>
                <Badge className="bg-red-500/10 border-red-500/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-xl">
                  <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Live on MyUSIC: /ai-curator
                </Badge>
              </Card>

              <Card className="bg-gradient-to-r from-red-900/10 to-red-950/20 backdrop-blur-2xl border border-red-500/20 p-6 sm:p-8 animate-in fade-in slide-in-from-left-6 duration-500 delay-200 hover:translate-x-2 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all">
                <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-white">
                  2. Cross-Platform Music Discovery
                </h3>
                <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed">
                  A podcast production AI on Platform A needs background music. It queries MyUSIC's ERC-8004 registry,
                  finds trusted music agents, negotiates X402 rates, and licenses tracks—all autonomously without human
                  negotiation or legal contracts.
                </p>
                <Badge className="bg-red-500/10 border-red-500/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-xl">
                  <Network className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  Coming Soon: Agent Marketplace
                </Badge>
              </Card>

              <Card className="bg-gradient-to-r from-red-950/20 to-red-900/10 backdrop-blur-2xl border border-red-500/20 p-6 sm:p-8 animate-in fade-in slide-in-from-left-6 duration-500 delay-300 hover:translate-x-2 hover:border-red-500/40 hover:shadow-xl hover:shadow-red-500/10 transition-all">
                <h3 className="font-bold text-xl sm:text-2xl mb-3 sm:mb-4 text-white">
                  3. Automated Royalty Distribution
                </h3>
                <p className="text-sm sm:text-base text-white/70 mb-4 sm:mb-6 leading-relaxed">
                  A verified ERC-8004 agent monitors streaming activity, calculates complex royalty splits for
                  collaborations, and distributes payments via X402 in real-time. Artists see earnings instantly instead
                  of waiting months for traditional royalty statements.
                </p>
                <Badge className="bg-red-500/10 border-red-500/30 text-red-300 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-xl">
                  <Coins className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  In Development: Q2 2025
                </Badge>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container px-4 sm:px-6 pb-24 sm:pb-32">
          <div className="max-w-5xl mx-auto">
            <Card className="relative overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/20 p-8 sm:p-12 md:p-16 text-center animate-in fade-in zoom-in-95 duration-700 delay-100 hover:border-white/30 hover:shadow-2xl hover:shadow-white/10 transition-all">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-600/10 pointer-events-none" />

              <div className="relative z-10 space-y-6 sm:space-y-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 text-balance px-2">
                  The Agent Economy is Here
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-white/80 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 leading-relaxed text-balance px-2">
                  MyUSIC is the only platform ready for the future of autonomous music commerce. Join us as we redefine
                  how music is discovered, streamed, and monetized.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-500 delay-400">
                  <Link href="/agents">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white text-black hover:bg-white/90 transition-all hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Explore AI Agents
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/docs/x402-protocol">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 bg-white/5 hover:bg-white/10 text-white border-white/30 hover:border-white/50 backdrop-blur-xl transition-all hover:scale-105"
                    >
                      Read Documentation
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}
