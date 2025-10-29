"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Sparkles,
  Music,
  DollarSign,
  Heart,
  Users,
  Gift,
  TrendingUp,
  Clock,
  Trophy,
  Zap,
  Star,
  Copy,
  Check,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import useSWR from "swr"

interface AirdropScore {
  streamActivity: number
  artistUploads: number
  musicSales: number
  engagement: number
  earlyUser: number
  referrals: number
  total: number
  estimatedTokens: string
}

interface UserStats {
  totalStreams: number
  uniqueArtists: number
  fullTracksCompleted: number
  tracksUploaded: number
  totalRevenue: number
  likesGiven: number
  followsGiven: number
  accountAge: number
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AirdropPage() {
  const { address, isConnected, connect } = useWallet()
  const [score, setScore] = useState<AirdropScore | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { data: tokenMetrics } = useSWR("/api/token/metrics", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })

  const tokenPrice = tokenMetrics?.price || 0

  useEffect(() => {
    const targetDate = new Date("2026-01-01T00:00:00Z")

    const updateCountdown = () => {
      const now = new Date()
      const diff = targetDate.getTime() - now.getTime()

      if (diff > 0) {
        setCountdown({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!address || !isConnected) return

    const fetchEligibility = async () => {
      setLoading(true)
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const userAddress = address.toLowerCase()

        const { data: streams } = await supabase
          .from("streams")
          .select("*, tracks!inner(id, title, artist_id)")
          .eq("listener_address", userAddress)

        const { data: uploads } = await supabase.from("tracks").select("*, streams(count)").eq("artist_id", userAddress)

        const { data: likes } = await supabase.from("likes").select("*").eq("user_address", userAddress)

        const { data: follows } = await supabase.from("follows").select("*").eq("follower_address", userAddress)

        const { data: profile } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("wallet_address", userAddress)
          .single()

        const totalStreams = streams?.length || 0
        const uniqueArtists = new Set(streams?.map((s) => s.tracks?.artist_id)).size
        const fullTracksCompleted = streams?.filter((s) => s.chunks_played >= 10).length || 0
        const tracksUploaded = uploads?.length || 0
        const totalRevenue = streams?.reduce((sum, s) => sum + Number(s.total_paid || 0), 0) || 0
        const likesGiven = likes?.length || 0
        const followsGiven = follows?.length || 0
        const accountAge = profile?.created_at
          ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 0

        setStats({
          totalStreams,
          uniqueArtists,
          fullTracksCompleted,
          tracksUploaded,
          totalRevenue,
          likesGiven,
          followsGiven,
          accountAge,
        })

        let streamScore = totalStreams
        streamScore += fullTracksCompleted * 10
        if (uniqueArtists > 10) streamScore += 25

        const uploadScore = tracksUploaded * 100

        const revenueScore = totalRevenue

        const engagementScore = likesGiven * 5 + followsGiven * 10

        let earlyUserScore = 0
        if (accountAge > 180) earlyUserScore = 500

        const referralScore = 0

        const totalScore = streamScore + uploadScore + revenueScore + engagementScore + earlyUserScore + referralScore

        const estimatedTokens = ((totalScore / 10000) * 5000000000).toFixed(0)

        setScore({
          streamActivity: streamScore,
          artistUploads: uploadScore,
          musicSales: revenueScore,
          engagement: engagementScore,
          earlyUser: earlyUserScore,
          referrals: referralScore,
          total: totalScore,
          estimatedTokens,
        })
      } catch (error) {
        console.error("Failed to fetch airdrop eligibility:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEligibility()
  }, [address, isConnected])

  useEffect(() => {
    setMounted(true)
  }, [])

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const categories = [
    {
      name: "Stream Activity",
      icon: Music,
      score: score?.streamActivity || 0,
      weight: "30%",
      color: "from-red-500 to-orange-500",
    },
    {
      name: "Artist Uploads",
      icon: TrendingUp,
      score: score?.artistUploads || 0,
      weight: "20%",
      color: "from-orange-500 to-yellow-500",
    },
    {
      name: "Music Sales & Revenue",
      icon: DollarSign,
      score: score?.musicSales || 0,
      weight: "25%",
      color: "from-yellow-500 to-green-500",
    },
    {
      name: "Engagement & Support",
      icon: Heart,
      score: score?.engagement || 0,
      weight: "10%",
      color: "from-green-500 to-blue-500",
    },
    {
      name: "Early User Bonus",
      icon: Sparkles,
      score: score?.earlyUser || 0,
      weight: "10%",
      color: "from-blue-500 to-purple-500",
    },
    {
      name: "Referrals",
      icon: Users,
      score: score?.referrals || 0,
      weight: "5%",
      color: "from-purple-500 to-pink-500",
    },
  ]

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float animation-delay-4000" />
      </div>

      <div className="relative border-b border-border/50 bg-gradient-to-b from-accent/10 via-accent/5 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(229,62,62,0.15),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(220,38,38,0.1),transparent)]" />

        <div className="container relative mx-auto px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl text-center">
            <div
              className={`mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-6 py-3 text-sm font-medium text-accent backdrop-blur-xl shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/30 ${mounted ? "animate-scale-in" : "opacity-0"}`}
            >
              <Gift className="h-5 w-5 animate-pulse-slow" />
              <span className="font-bold">5 Billion $USI</span>
              <span className="text-accent/70">•</span>
              <span>5% Total Supply</span>
            </div>

            <h1
              className={`relative mb-6 text-5xl font-bold sm:text-7xl lg:text-8xl ${mounted ? "animate-slide-up" : "opacity-0"}`}
            >
              <span className="relative z-10 text-white drop-shadow-[0_0_30px_rgba(229,62,62,0.5)]">$USI Airdrop</span>
            </h1>

            <p
              className={`mb-12 text-lg text-muted-foreground sm:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed ${mounted ? "animate-fade-in" : "opacity-0"}`}
            >
              Rewarding early adopters, creators, and active contributors who shaped the future of decentralized music
            </p>

            <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
              {[
                { label: "Days", value: countdown.days },
                { label: "Hours", value: countdown.hours },
                { label: "Minutes", value: countdown.minutes },
                { label: "Seconds", value: countdown.seconds },
              ].map((item, index) => (
                <Card
                  key={item.label}
                  className={`group relative overflow-hidden border-accent/30 bg-gradient-to-br from-card/80 to-card/40 p-6 backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-accent/20 transition-all duration-300 hover:scale-105 hover:-translate-y-1 ${mounted ? "animate-scale-in" : "opacity-0"}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-4xl font-bold text-accent sm:text-5xl lg:text-6xl mb-2 tabular-nums">
                      {String(item.value).padStart(2, "0")}
                    </div>
                    <div className="text-xs text-muted-foreground sm:text-sm font-medium uppercase tracking-wider">
                      {item.label}
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 blur-2xl rounded-full" />
                </Card>
              ))}
            </div>

            {!isConnected && (
              <Button
                size="lg"
                onClick={connect}
                className="gap-3 px-8 py-6 text-lg font-semibold bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-xl shadow-accent/30 hover:shadow-2xl hover:shadow-accent/40 transition-all duration-300 hover:scale-105 animate-bounce-subtle"
              >
                <Sparkles className="h-6 w-6" />
                Connect Wallet to Check Eligibility
                <Zap className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isConnected && (
        <div className="container relative mx-auto px-4 py-16">
          {loading ? (
            <div className="mx-auto max-w-4xl space-y-6">
              <Card className="glass-premium p-12 animate-pulse-slow">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
                    <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-accent animate-pulse" />
                  </div>
                  <p className="text-lg text-muted-foreground">Calculating your eligibility...</p>
                  <p className="text-sm text-muted-foreground/70">Analyzing on-chain activity</p>
                </div>
              </Card>
            </div>
          ) : score ? (
            <div className="mx-auto max-w-7xl space-y-12">
              <Card className="glass-premium p-6 border-accent/20 hover:border-accent/40 transition-all duration-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-accent/10">
                      <Trophy className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Connected Wallet</div>
                      <div className="font-mono text-sm sm:text-base font-medium">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyAddress}
                    className="gap-2 border-accent/20 hover:border-accent/40 hover:bg-accent/10 bg-transparent"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/10 via-accent/5 to-background p-12 shadow-2xl hover:shadow-accent/20 transition-all duration-500 hover-lift-premium">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(229,62,62,0.3),transparent_50%)]" />
                </div>

                <div className="relative text-center">
                  <div className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-accent">
                    <Star className="h-5 w-5 fill-accent" />
                    Your Total Score
                    <Star className="h-5 w-5 fill-accent" />
                  </div>

                  <div className="mb-6 text-6xl sm:text-7xl lg:text-8xl font-bold">
                    <span className="bg-gradient-to-r from-accent via-accent/80 to-accent bg-clip-text text-transparent">
                      {score.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="mb-8 space-y-2">
                    <div className="text-lg text-muted-foreground">Estimated Airdrop Allocation</div>
                    <div className="text-3xl sm:text-4xl font-bold text-foreground">
                      {Number(score.estimatedTokens).toLocaleString()} <span className="text-accent">$USI</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tokenPrice > 0 ? (
                        <>
                          ≈ $
                          {(Number(score.estimatedTokens) * tokenPrice).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          USD
                        </>
                      ) : (
                        <span className="text-muted-foreground/50">Loading price...</span>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="relative h-4 bg-accent/10 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent/60 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min((score.total / 10000) * 100, 100)}%` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/20 to-transparent animate-shimmer" />
                    </div>
                  </div>

                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">
                      Top {Math.max(1, Math.floor((1 - score.total / 10000) * 100))}% of participants
                    </span>
                  </div>
                </div>
              </Card>

              <div>
                <h2 className="mb-8 text-3xl font-bold text-center">
                  <span className="bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                    Score Breakdown
                  </span>
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categories.map((category, index) => {
                    const Icon = category.icon
                    const maxScore = 1000
                    const percentage = Math.min((category.score / maxScore) * 100, 100)

                    return (
                      <Card
                        key={category.name}
                        className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl transition-all duration-300 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 hover:-translate-y-2 hover:scale-105"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative p-8">
                          <div className="mb-6 flex items-center justify-between">
                            <div className={`relative rounded-xl bg-gradient-to-br ${category.color} p-4 shadow-lg`}>
                              <Icon className="h-6 w-6 text-white" />
                              <div className="absolute inset-0 rounded-xl bg-white/20 blur-xl" />
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Weight
                              </div>
                              <div className="text-lg font-bold text-accent">{category.weight}</div>
                            </div>
                          </div>

                          <h3 className="mb-4 text-lg font-semibold leading-tight">{category.name}</h3>

                          <div className="mb-4">
                            <div className="text-4xl font-bold text-accent mb-1">{category.score.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">points earned</div>
                          </div>

                          <div className="relative h-2 bg-accent/10 rounded-full overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent/60 rounded-full transition-all duration-1000"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors duration-500" />
                      </Card>
                    )
                  })}
                </div>
              </div>

              {stats && (
                <Card className="glass-premium p-10 border-accent/20">
                  <h2 className="mb-8 text-3xl font-bold text-center">
                    <span className="bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                      Your Activity Breakdown
                    </span>
                  </h2>
                  <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Total Streams",
                        value: stats.totalStreams,
                        icon: Music,
                        color: "from-red-500 to-orange-500",
                      },
                      {
                        label: "Unique Artists",
                        value: stats.uniqueArtists,
                        icon: Users,
                        color: "from-orange-500 to-yellow-500",
                      },
                      {
                        label: "Tracks Uploaded",
                        value: stats.tracksUploaded,
                        icon: TrendingUp,
                        color: "from-yellow-500 to-green-500",
                      },
                      {
                        label: "Total Revenue",
                        value: `$${stats.totalRevenue.toFixed(2)}`,
                        icon: DollarSign,
                        color: "from-green-500 to-blue-500",
                      },
                      {
                        label: "Likes Given",
                        value: stats.likesGiven,
                        icon: Heart,
                        color: "from-blue-500 to-purple-500",
                      },
                      {
                        label: "Follows",
                        value: stats.followsGiven,
                        icon: Users,
                        color: "from-purple-500 to-pink-500",
                      },
                      {
                        label: "Account Age",
                        value: `${stats.accountAge} days`,
                        icon: Clock,
                        color: "from-pink-500 to-red-500",
                      },
                      {
                        label: "Full Tracks",
                        value: stats.fullTracksCompleted,
                        icon: Sparkles,
                        color: "from-red-500 to-orange-500",
                      },
                    ].map((stat, index) => {
                      const Icon = stat.icon
                      return (
                        <div
                          key={stat.label}
                          className="group relative p-6 rounded-xl bg-gradient-to-br from-card/50 to-card/20 border border-border/50 hover:border-accent/30 transition-all duration-300 hover:scale-105"
                        >
                          <div className={`mb-4 inline-flex p-3 rounded-lg bg-gradient-to-br ${stat.color}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="mb-2 text-sm text-muted-foreground font-medium">{stat.label}</div>
                          <div className="text-3xl font-bold">{stat.value}</div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              <Card className="relative overflow-hidden border-accent/30 bg-gradient-to-br from-accent/5 to-background p-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

                <div className="relative">
                  <div className="mb-8 text-center">
                    <h2 className="mb-3 text-3xl font-bold">
                      <span className="bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                        Maximize Your Airdrop
                      </span>
                    </h2>
                    <p className="text-muted-foreground">Complete these actions before January 1st, 2026</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    {[
                      {
                        icon: Music,
                        title: "Stream More Music",
                        description: "+1 point per stream, +10 for full tracks",
                        action: "Start Streaming",
                        link: "/trending",
                      },
                      {
                        icon: TrendingUp,
                        title: "Upload Tracks",
                        description: "+100 points per track uploaded",
                        action: "Upload Now",
                        link: "/upload",
                      },
                      {
                        icon: Heart,
                        title: "Engage with Content",
                        description: "+5 per like, +10 per follow",
                        action: "Explore",
                        link: "/explore",
                      },
                      {
                        icon: Users,
                        title: "Refer Friends",
                        description: "+100 per active referral",
                        action: "Get Referral Link",
                        link: "#",
                      },
                    ].map((item, index) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.title}
                          className="group relative p-6 rounded-xl bg-card/50 border border-border/50 hover:border-accent/50 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/10"
                        >
                          <div className="flex gap-4">
                            <div className="shrink-0">
                              <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                                <Icon className="h-6 w-6 text-accent" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="mb-2 font-semibold text-lg">{item.title}</h3>
                              <p className="mb-4 text-sm text-muted-foreground">{item.description}</p>
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="border-accent/20 hover:border-accent/40 hover:bg-accent/10 bg-transparent"
                              >
                                <a href={item.link}>{item.action}</a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="mx-auto max-w-4xl p-8 text-center">
              <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h2 className="mb-2 text-2xl font-bold">No Activity Yet</h2>
              <p className="mb-6 text-muted-foreground">
                Start streaming music, uploading tracks, and engaging with the community to become eligible for the
                airdrop!
              </p>
              <Button asChild>
                <a href="/trending">Explore Music</a>
              </Button>
            </Card>
          )}
        </div>
      )}

      <div className="relative border-t border-border/50 bg-gradient-to-b from-background to-accent/5 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(229,62,62,0.05),transparent)]" />

        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold">
                <span className="bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
              <p className="text-muted-foreground">Everything you need to know about the $USI airdrop</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "When will the airdrop happen?",
                  answer:
                    "The airdrop snapshot will be taken on January 1st, 2026 at 00:00 UTC. Tokens will be distributed shortly after the snapshot is complete.",
                },
                {
                  question: "How is my score calculated?",
                  answer:
                    "Your score is based on 6 categories: Stream Activity (30%), Artist Uploads (20%), Music Sales (25%), Engagement (10%), Early User Bonus (10%), and Referrals (5%). Each category has specific point values for different actions.",
                },
                {
                  question: "Can I increase my score?",
                  answer:
                    "Yes! Continue streaming music, uploading tracks, engaging with content, and referring friends to increase your score before the snapshot date on January 1st, 2026.",
                },
                {
                  question: "What is the minimum to qualify?",
                  answer:
                    "You need at least 20 verified paid streams or 1 uploaded track to qualify for the airdrop. The more you engage, the higher your allocation.",
                },
                {
                  question: "How do I claim my tokens?",
                  answer:
                    "After the snapshot on January 1st, 2026, eligible wallets will be able to claim their $USI tokens directly from this page. You'll receive a notification when claiming is available.",
                },
                {
                  question: "Are there any restrictions?",
                  answer:
                    "Wallets flagged for bot activity or abnormal behavior will be excluded. Only genuine on-chain activity from real users qualifies for the airdrop.",
                },
              ].map((faq, index) => (
                <Card
                  key={index}
                  className="group glass-premium p-8 border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10"
                >
                  <h3 className="mb-3 text-lg font-semibold flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Sparkles className="h-4 w-4 text-accent" />
                    </div>
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed pl-12">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
