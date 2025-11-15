"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function ChangelogPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["2025-11-15"]))

  const toggleSection = (date: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedSections(newExpanded)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 space-y-4">
          <h1 className="text-4xl font-bold text-balance">Platform Changelog</h1>
          <p className="text-xl text-muted-foreground">Latest updates and improvements to MyUSIC</p>
        </div>

        {/* Changelog Entries */}
        <div className="space-y-4">
          {/* November 15, 2025 - Latest Changes */}
          <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection("2025-11-15")}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
                  <span className="text-xl">🎯</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">November 15, 2025</h2>
                  <p className="text-sm text-muted-foreground">Referral System, Builder Codes & Auth Upgrades</p>
                </div>
              </div>
              {expandedSections.has("2025-11-15") ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has("2025-11-15") && (
              <div className="px-6 pb-6 space-y-8 border-t">
                <section className="space-y-3 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gradient bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    <span className="text-base">🚀</span>
                    Comprehensive Referral & Rewards System
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-pink-500">•</span>
                      <span>
                        Built complete referral system with unique codes, tracking, and multi-tier rewards (USDC + credits)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-500">•</span>
                      <span>
                        Added social sharing buttons with pre-filled content for Twitter, Farcaster, Telegram, and native sharing
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-500">•</span>
                      <span>
                        Implemented referral leaderboard showing top referrers with medals, points earned, and USDC rewards
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-500">•</span>
                      <span>
                        Created achievement system with 6 milestone tiers (3, 5, 10, 25, 50, 100 referrals) with visual progress bars
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-500">•</span>
                      <span>
                        Integrated social share tracking into track detail pages for viral growth
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-pink-500">•</span>
                      <span>
                        Added reward distribution tables, campaign management, and analytics dashboard
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gradient bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                    <span className="text-base">🏗️</span>
                    ERC-8021 Builder Codes
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        Implemented ERC-8021 builder code standard for third-party app revenue sharing
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        Developers can now build apps on top of MYUSIC and earn 10% of platform fees automatically
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        Created builder code registry with automatic revenue tracking and leaderboard
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        Integrated builder codes into x402 payment metadata for seamless revenue splits
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        Added /builder-codes portal for developers to register and manage their codes
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>
                        Enables ecosystem of third-party music players, AI agents, and trading terminals
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gradient bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                    <span className="text-base">🔐</span>
                    Hybrid Authentication with Privy
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>
                        Integrated Privy embedded wallets alongside existing Wagmi wallet connection
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>
                        Users can now login with email, Google, Twitter, Discord, or Farcaster (no wallet needed)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>
                        Embedded wallets auto-created for social login users with hardware-secured SOC 2 compliance
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>
                        Traditional crypto wallet option still available for power users (MetaMask, Coinbase Wallet)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>
                        Created unified wallet context that manages both auth methods seamlessly
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>
                        Solves mobile wallet connectivity issues and enables automatic signing for micropayments
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gradient bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                    <span className="text-base">🎨</span>
                    Content Management & UX Improvements
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Admins and creators can now edit/upload thumbnails for tokenized songs via new ThumbnailUploadDialog
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Platform logo now used as default thumbnail for videos without featured images
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Improved scroll performance on track detail pages by removing janky parallax and optimizing renders
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Fixed duplicate close button in onboarding modal by correcting Dialog component props
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>
                        Added thumbnail editing capability to admin panel for managing tracks in bulk
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gradient bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                    <span className="text-base">📊</span>
                    Token Metrics & Analytics
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        Fixed token metrics not displaying on mobile by adding retry logic and timeout protection
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        Profile tokens now included in aggregate metrics (24h volume and market cap)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        Added comprehensive logging and error handling for DexScreener API calls
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        Implemented fallback values and skeleton loaders for better loading states
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        Enhanced cache headers and SWR configuration for reliable mobile performance
                      </span>
                    </li>
                  </ul>
                </section>

                <div className="grid gap-4 sm:grid-cols-3 pt-4">
                  <div className="rounded-lg border bg-gradient-to-br from-pink-500/10 to-purple-500/10 p-4 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                      3
                    </div>
                    <div className="text-sm text-muted-foreground">Major Systems</div>
                  </div>
                  <div className="rounded-lg border bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      25+
                    </div>
                    <div className="text-sm text-muted-foreground">New Features</div>
                  </div>
                  <div className="rounded-lg border bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 text-center">
                    <div className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                      10+
                    </div>
                    <div className="text-sm text-muted-foreground">Bug Fixes</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* November 6, 2025 - ERC-8004 Integration */}
          <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection("2025-11-06")}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="text-xl">🚀</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">November 6, 2025</h2>
                  <p className="text-sm text-muted-foreground">ERC-8004 Integration & Major Updates</p>
                </div>
              </div>
              {expandedSections.has("2025-11-06") ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has("2025-11-06") && (
              <div className="px-6 pb-6 space-y-8 border-t">
                <section className="space-y-3 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <span className="text-base">✨</span>
                    ERC-8004 Integration
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Integrated ERC-8004 Trustless Agents standard for autonomous AI agent identity, reputation, and
                        validation
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Created Identity Registry, Reputation Registry, and Validation Registry smart contracts
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Built complete agents system at /agents with browse, register, and detail pages</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Implemented agent feedback and rating system with database integration</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Added AI Playlist Curator at /ai-curator - first autonomous agent with verified on-chain
                        identity
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <span className="text-base">📢</span>
                    Community Features
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Published comprehensive community update at /community-update explaining X402 and ERC-8004
                        integration
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Added polished animations and glassmorphic design to community update page</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Highlighted MyUSIC's competitive advantage as early mover in agent-to-agent music commerce
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <span className="text-base">🐛</span>
                    Bug Fixes
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Fixed listening activity not displaying listener profile images on activity feed</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Fixed wallet address case sensitivity causing blank profile pages (normalized to lowercase)
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Fixed playlist activity links - creator and playlist now properly clickable</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Fixed users without profiles showing "Not found" errors - now display as non-clickable
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Fixed swap timestamps showing "in about 5 hours" by converting to timezone-aware timestamps
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Fixed AI Curator RLS policy issue - now uses admin client to bypass row-level security
                      </span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <span className="text-base">⚡</span>
                    Performance Improvements
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Dramatically optimized /artists page - replaced N+1 queries (80-100+ calls) with 5 batch queries
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Page load time improved 10-20x on slower devices</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Implemented client-side aggregation with Map objects for O(1) lookups</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <span className="text-base">🎨</span>
                    UI/UX Enhancements
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Fixed token supply formatting on /analytics - now displays "100 Billion" instead of "100000.00M"
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Enhanced activity feed filter tabs with vibrant gradient backgrounds and distinct accent colors
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>Added color variation to navigation icons (cyan, emerald, orange gradients)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        Improved visual hierarchy with pulsing animations and shadow glows on interactive elements
                      </span>
                    </li>
                  </ul>
                </section>

                <div className="grid gap-4 sm:grid-cols-3 pt-4">
                  <div className="rounded-lg border bg-muted/30 p-4 text-center">
                    <div className="text-3xl font-bold text-primary">15+</div>
                    <div className="text-sm text-muted-foreground">Bug Fixes</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4 text-center">
                    <div className="text-3xl font-bold text-primary">5</div>
                    <div className="text-sm text-muted-foreground">New Pages</div>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4 text-center">
                    <div className="text-3xl font-bold text-primary">20x</div>
                    <div className="text-sm text-muted-foreground">Faster Load</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection("2025-10")}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                  <span className="text-xl">🔴</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">October 2025</h2>
                  <p className="text-sm text-muted-foreground">Live Streaming & Video Platform</p>
                </div>
              </div>
              {expandedSections.has("2025-10") ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has("2025-10") && (
              <div className="px-6 pb-6 space-y-8 border-t">
                <section className="space-y-3 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-500">
                    <span className="text-base">📹</span>
                    Livepeer Live Streaming
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Integrated Livepeer for decentralized live streaming infrastructure</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Built /live/start broadcast studio for artists to go live</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Created /live browse page to discover active streams</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Added low-latency WebRTC playback with adaptive bitrate streaming</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Implemented real-time viewer counts and live status indicators</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Added artist eligibility check (3+ published tracks required)</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-red-500">
                    <span className="text-base">🎬</span>
                    Video Features
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Mobile-friendly broadcasting (works on phones and tablets)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Multi-quality streaming (720p, 480p, 360p)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-red-500">•</span>
                      <span>Optional automatic stream recording for VOD</span>
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection("2025-09")}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <span className="text-xl">💰</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">September 2025</h2>
                  <p className="text-sm text-muted-foreground">Automated Payouts & CDP Integration</p>
                </div>
              </div>
              {expandedSections.has("2025-09") ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has("2025-09") && (
              <div className="px-6 pb-6 space-y-8 border-t">
                <section className="space-y-3 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-500">
                    <span className="text-base">🏦</span>
                    Coinbase Developer Platform
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Integrated Coinbase Developer Platform SDK for backend operations</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Implemented automated artist payout system with batch processing</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Added gasless transactions via Paymaster for new user onboarding</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Created secure server-side wallet for platform operations</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Built /api/admin/payouts endpoint for scheduled artist payments</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-blue-500">
                    <span className="text-base">🤖</span>
                    Automation Features
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Aggregates unpaid streams and calculates earnings automatically</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Batch USDC transfers reduce transaction costs significantly</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-500">•</span>
                      <span>Ready for cron job integration for daily/weekly payouts</span>
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection("2025-08")}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <span className="text-xl">💳</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">August 2025</h2>
                  <p className="text-sm text-muted-foreground">X402 Micropayments Protocol</p>
                </div>
              </div>
              {expandedSections.has("2025-08") ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has("2025-08") && (
              <div className="px-6 pb-6 space-y-8 border-t">
                <section className="space-y-3 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-green-500">
                    <span className="text-base">⚡</span>
                    X402 Implementation
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Implemented full X402 protocol for chunk-based micropayments</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Audio divided into 30-second chunks with first chunk free for preview</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Created /api/x402/stream, /api/x402/verify, and /api/x402/settle endpoints</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Integrated EIP-3009 transferWithAuthorization for gasless payments</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Built seamless payment UI in audio player with automatic pause/resume</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-green-500">
                    <span className="text-base">🎯</span>
                    Payment Benefits
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>No gas fees - uses signature-based authorization</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Instant verification and settlement</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>Enables sub-cent payments per 30-second chunk</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>AI agents can pay programmatically</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">•</span>
                      <span>All payments transparent and recorded on-chain</span>
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection("2025-07")}
              className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                  <span className="text-xl">🎵</span>
                </div>
                <div className="text-left">
                  <h2 className="text-2xl font-bold">July 2025</h2>
                  <p className="text-sm text-muted-foreground">Platform Launch & Core Features</p>
                </div>
              </div>
              {expandedSections.has("2025-07") ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has("2025-07") && (
              <div className="px-6 pb-6 space-y-8 border-t">
                <section className="space-y-3 pt-6">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-500">
                    <span className="text-base">🚀</span>
                    Platform Foundation
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Built on Next.js 15+ with React 19 and Tailwind CSS v4</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Integrated wagmi v2 and viem for Web3 interactions</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Deployed on Base blockchain (mainnet & Sepolia testnet)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Set up Supabase PostgreSQL database with Row Level Security</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Created profiles, tracks, royalty_splits, and streams tables</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-500">
                    <span className="text-base">🎨</span>
                    Core Features
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Wallet-based authentication (MetaMask, Coinbase Wallet, WalletConnect)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Artist dashboard for uploading tracks and managing royalties</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Real-time analytics for plays, earnings, and listener demographics</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Audio player with playlist support and queue management</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Track discovery with search, filters, and trending pages</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Social features: likes, follows, and activity feed</span>
                    </li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-purple-500">
                    <span className="text-base">🪙</span>
                    Token Economics
                  </h3>
                  <ul className="ml-6 space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>$USI platform token (ERC-20) with 100 billion total supply</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>USDC payments for track streaming on Base network</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Built staking infrastructure for $USI holders to earn platform fees</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-500">•</span>
                      <span>Analytics dashboard showing token metrics and market data</span>
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            This changelog is continuously updated as new features are added to the platform.
            <br />
            Check back regularly for the latest improvements and updates.
          </p>
        </div>
      </div>
    </div>
  )
}
