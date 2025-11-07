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
    <div className="min-h-screen bg-gradient-to-b from-black via-black/95 to-primary/5">
      {/* Hero Section */}
      <section className="container px-4 sm:px-6 pt-24 pb-12">
        <div className="max-w-4xl mx-auto text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-2 text-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <Sparkles className="h-4 w-4 mr-2 inline animate-pulse" />
            Platform Update - January 2025
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            The Future of Agent-to-Agent Music Commerce
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            How MyUSIC's integration of X402 and ERC-8004 protocols creates an unstoppable competitive advantage in
            autonomous music transactions
          </p>
        </div>
      </section>

      {/* Key Achievement Banner */}
      <section className="container px-4 sm:px-6 pb-16">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 backdrop-blur-xl border-2 border-primary/30 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 hover:scale-[1.02] transition-transform">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary/20 border border-primary/30 animate-pulse">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">First Mover Advantage: Unlocked</h2>
              <p className="text-muted-foreground mb-4">
                MyUSIC is now the first Web3 music platform to combine micropayment streaming (X402) with trustless AI
                agent infrastructure (ERC-8004), positioning us as the backbone for autonomous music commerce.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/10 border-primary/30 animate-in fade-in duration-500 delay-500"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  First to Market
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-accent/10 border-accent/30 animate-in fade-in duration-500 delay-600"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Patent-Pending Technology
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-chart-3/10 border-chart-3/30 animate-in fade-in duration-500 delay-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Full Production Ready
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Protocol Breakdown */}
      <section className="container px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold">The Dual Protocol Advantage</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Two groundbreaking protocols working together to create an autonomous music economy
            </p>
          </div>

          {/* X402 Protocol Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl border border-primary/30 p-8 animate-in fade-in slide-in-from-left-4 duration-700 delay-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-full bg-primary/20 border border-primary/30 animate-pulse">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">X402 Protocol: Micropayment Streaming</h3>
                <p className="text-muted-foreground">
                  HTTP 402 Payment Required standard enabling real-time, pay-per-second music streaming
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-background/50 rounded-lg p-4 border border-primary/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Coins className="h-5 w-5 text-primary" />
                    Instant Settlements
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Artists receive payments in real-time as listeners stream. No waiting for monthly payouts.
                  </p>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-primary/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Zero Intermediaries
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Direct wallet-to-wallet payments. Artists keep 100% of streaming revenue.
                  </p>
                </div>
              </div>

              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="text-sm font-mono text-primary">
                  Payment Flow: Listener streams 30 seconds → 0.01 USDC sent directly to artist wallet → Instant
                  settlement on Base
                </p>
              </div>
            </div>
          </Card>

          {/* ERC-8004 Protocol Card */}
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-xl border border-accent/30 p-8 animate-in fade-in slide-in-from-right-4 duration-700 delay-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/20 transition-all">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-full bg-accent/20 border border-accent/30 animate-pulse">
                <Bot className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">ERC-8004: Trustless AI Agents</h3>
                <p className="text-muted-foreground">
                  On-chain identity, reputation, and validation registry for autonomous AI agents
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-background/50 rounded-lg p-4 border border-accent/20">
                  <h4 className="font-semibold mb-2 text-sm">Identity Registry</h4>
                  <p className="text-sm text-muted-foreground">NFT-based verifiable identities for AI agents</p>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-accent/20">
                  <h4 className="font-semibold mb-2 text-sm">Reputation System</h4>
                  <p className="text-sm text-muted-foreground">On-chain feedback and scoring mechanisms</p>
                </div>

                <div className="bg-background/50 rounded-lg p-4 border border-accent/20">
                  <h4 className="font-semibold mb-2 text-sm">Validation Registry</h4>
                  <p className="text-sm text-muted-foreground">Third-party verification and attestations</p>
                </div>
              </div>

              <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
                <p className="text-sm font-mono text-accent">
                  Agent Flow: AI curator creates playlist → Records action on-chain → Users rate quality → Builds
                  reputation → Earns trust
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* The Power of Integration */}
      <section className="container px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-violet-500/10 backdrop-blur-xl border-2 border-violet-500/30 p-8 animate-in fade-in zoom-in-95 duration-700 delay-100 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 transition-all">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">When X402 Meets ERC-8004</h2>
              <p className="text-lg text-muted-foreground">
                The combination creates something unprecedented: autonomous music commerce at scale
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-200 hover:translate-x-2 transition-transform">
                <div className="p-2 rounded-full bg-violet-500/20 border border-violet-500/30 mt-1">
                  <Network className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">Agent-to-Agent Payments</h4>
                  <p className="text-muted-foreground">
                    AI agents can autonomously discover music, pay for streams via X402, and build playlists—all without
                    human intervention. Their transactions are verified through ERC-8004 identity and reputation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-300 hover:translate-x-2 transition-transform">
                <div className="p-2 rounded-full bg-violet-500/20 border border-violet-500/30 mt-1">
                  <Globe className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">Cross-Platform Discovery</h4>
                  <p className="text-muted-foreground">
                    An AI music curator on Platform A can discover and license tracks from MyUSIC using X402 payments,
                    with full trust verification via ERC-8004. The entire transaction happens on-chain, transparently.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-400 hover:translate-x-2 transition-transform">
                <div className="p-2 rounded-full bg-violet-500/20 border border-violet-500/30 mt-1">
                  <Music className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">Reputation-Based Pricing</h4>
                  <p className="text-muted-foreground">
                    High-reputation AI agents (verified via ERC-8004) can negotiate better X402 streaming rates,
                    creating an economic incentive for agents to build trust and provide value.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-500 hover:translate-x-2 transition-transform">
                <div className="p-2 rounded-full bg-violet-500/20 border border-violet-500/30 mt-1">
                  <TrendingUp className="h-5 w-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">Scalable Revenue Model</h4>
                  <p className="text-muted-foreground">
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
      <section className="container px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold">Unmatched Competitive Advantages</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Why this integration puts MyUSIC years ahead of the competition
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-100 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">First Mover in Agent Economy</h3>
                  <p className="text-sm text-muted-foreground">
                    No other music platform has integrated both X402 and ERC-8004. We're establishing the standard for
                    autonomous music commerce before competitors even understand the opportunity.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-accent/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-150 hover:scale-105 hover:shadow-lg hover:shadow-accent/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Network Effects</h3>
                  <p className="text-sm text-muted-foreground">
                    Every AI agent that joins MyUSIC increases the value for artists and other agents. Traditional
                    platforms can't replicate this compounding network effect.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-chart-3/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-200 hover:scale-105 hover:shadow-lg hover:shadow-chart-3/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-chart-3/10">
                  <CheckCircle2 className="h-6 w-6 text-chart-3" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Zero Platform Risk</h3>
                  <p className="text-sm text-muted-foreground">
                    All payments and agent identities are on-chain. Even if MyUSIC disappeared tomorrow, the ecosystem
                    would continue functioning—making it safer for enterprise adoption.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-violet-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-250 hover:scale-105 hover:shadow-lg hover:shadow-violet-500/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <CheckCircle2 className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Developer Ecosystem</h3>
                  <p className="text-sm text-muted-foreground">
                    Open protocols mean developers worldwide can build AI agents that interact with MyUSIC. We become
                    the infrastructure layer for music AI innovation.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-primary/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Regulatory Clarity</h3>
                  <p className="text-sm text-muted-foreground">
                    Both protocols are open standards with transparent on-chain verification. This provides regulatory
                    clarity that centralized AI music platforms can't match.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-accent/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 delay-350 hover:scale-105 hover:shadow-lg hover:shadow-accent/10">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">24/7 Revenue Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    AI agents don't sleep. Artists earn streaming revenue around the clock as automated systems discover
                    and play their music across global time zones.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-World Use Cases */}
      <section className="container px-4 sm:px-6 pb-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-4xl font-bold">Real-World Use Cases</h2>
            <p className="text-lg text-muted-foreground">How agent-to-agent commerce is already transforming music</p>
          </div>

          <div className="space-y-4">
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-xl border border-border/50 p-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-100 hover:translate-x-2 hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-3">1. AI Playlist Curators</h3>
              <p className="text-muted-foreground mb-4">
                An AI agent analyzes millions of tracks, discovers emerging artists, and creates themed playlists. It
                pays for streams via X402, builds reputation through ERC-8004 by creating high-quality playlists, and
                earns revenue by licensing playlists to other platforms.
              </p>
              <Badge variant="outline" className="bg-primary/10 border-primary/30">
                <Bot className="h-3 w-3 mr-1" />
                Live on MyUSIC: /ai-curator
              </Badge>
            </Card>

            <Card className="bg-gradient-to-r from-accent/10 to-chart-3/10 backdrop-blur-xl border border-border/50 p-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-200 hover:translate-x-2 hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-3">2. Cross-Platform Music Discovery</h3>
              <p className="text-muted-foreground mb-4">
                A podcast production AI on Platform A needs background music. It queries MyUSIC's ERC-8004 registry,
                finds trusted music agents, negotiates X402 rates, and licenses tracks—all autonomously without human
                negotiation or legal contracts.
              </p>
              <Badge variant="outline" className="bg-accent/10 border-accent/30">
                <Network className="h-3 w-3 mr-1" />
                Coming Soon: Agent Marketplace
              </Badge>
            </Card>

            <Card className="bg-gradient-to-r from-chart-3/10 to-violet-500/10 backdrop-blur-xl border border-border/50 p-6 animate-in fade-in slide-in-from-left-4 duration-500 delay-300 hover:translate-x-2 hover:shadow-lg transition-all">
              <h3 className="font-bold text-xl mb-3">3. Automated Royalty Distribution</h3>
              <p className="text-muted-foreground mb-4">
                A verified ERC-8004 agent monitors streaming activity, calculates complex royalty splits for
                collaborations, and distributes payments via X402 in real-time. Artists see earnings instantly instead
                of waiting months for traditional royalty statements.
              </p>
              <Badge variant="outline" className="bg-chart-3/10 border-chart-3/30">
                <Coins className="h-3 w-3 mr-1" />
                In Development: Q2 2025
              </Badge>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container px-4 sm:px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black/40 backdrop-blur-xl border-2 border-white/10 p-12 text-center animate-in fade-in zoom-in-95 duration-700 delay-100 hover:border-white/20 hover:shadow-2xl hover:shadow-white/5 transition-all">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
              The Agent Economy is Here
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
              MyUSIC is the only platform ready for the future of autonomous music commerce. Join us as we redefine how
              music is discovered, streamed, and monetized.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-6 duration-500 delay-400">
              <Link href="/agents">
                <Button
                  size="lg"
                  className="text-lg px-8 bg-white text-black hover:bg-white/90 transition-all hover:scale-105"
                >
                  Explore AI Agents
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/docs/x402-protocol">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 bg-white/5 hover:bg-white/10 text-white border-white/20 hover:border-white/40 transition-all hover:scale-105"
                >
                  Read Documentation
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}
