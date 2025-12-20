"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, Target, Zap } from "lucide-react"
import Link from "next/link"

interface LeaderboardUser {
  address: string
  totalPnl: number
  totalInvested: number
  positions: number
  returnPercentage: number
}

export default function PredictionsAnalyticsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [timeframe, setTimeframe] = useState<"all" | "month" | "week">("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`/api/predictions/leaderboard?timeframe=${timeframe}&limit=25`)
      const data = await res.json()
      setLeaderboard(data)
    } catch (error) {
      console.error("[v0] Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const topWinners = leaderboard.slice(0, 5)
  const totalVolume = leaderboard.reduce((sum, user) => sum + user.totalInvested, 0)
  const avgReturn =
    leaderboard.length > 0 ? leaderboard.reduce((sum, u) => sum + u.returnPercentage, 0) / leaderboard.length : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl">
          <div className="max-w-3xl">
            <Badge className="mb-3 gap-1 bg-accent/10 text-accent hover:bg-accent/20">
              <TrendingUp className="h-3 w-3" />
              Predictions Analytics
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Market Leaderboard</h1>
            <p className="mt-3 text-muted-foreground">Track top predictors and market performance</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Volume</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">${(totalVolume / 1000).toFixed(1)}K</p>
              </div>
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Traders</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">{leaderboard.length}</p>
              </div>
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Avg Return</p>
                <p
                  className={`mt-2 text-2xl sm:text-3xl font-bold ${avgReturn >= 0 ? "text-emerald-500" : "text-red-500"}`}
                >
                  {avgReturn.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Positions</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">
                  {leaderboard.reduce((sum, u) => sum + u.positions, 0)}
                </p>
              </div>
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
          </Card>
        </div>

        {/* Leaderboard */}
        <Card>
          <div className="border-b border-border p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold">Top Predictors</h2>
              <Tabs value={timeframe} onValueChange={(v) => setTimeframe(v as any)}>
                <TabsList className="h-9">
                  <TabsTrigger value="week" className="text-xs">
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">
                    All Time
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No data yet</div>
            ) : (
              leaderboard.map((user, index) => (
                <div key={user.address} className="p-4 sm:p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-accent/10 font-semibold text-accent text-sm shrink-0">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs sm:text-sm truncate">{user.address}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.positions} position{user.positions !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <p
                        className={`font-mono font-bold text-sm sm:text-base ${
                          user.totalPnl >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                      >
                        {user.totalPnl >= 0 ? "+" : ""}${user.totalPnl.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.returnPercentage.toFixed(1)}% return</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="text-center text-muted-foreground text-sm">
          <p>
            Want to trade?{" "}
            <Link href="/predictions" className="text-accent hover:underline">
              Browse active markets
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
