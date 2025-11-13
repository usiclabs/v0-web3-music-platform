"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, TrendingUp, Award } from 'lucide-react'
import { useEffect, useState } from "react"
import Link from "next/link"

interface LeaderboardEntry {
  referrer_address: string
  artist_name: string | null
  avatar_url: string | null
  total_referrals: number
  active_referrals: number
  total_usdc_earned: number
  total_points_earned: number
  last_referral_at: string
}

export default function ReferralLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    try {
      const res = await fetch("/api/referrals/leaderboard")
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return "🥇"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return null
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Referral Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <Link href={`/artist/${entry.referrer_address}`} key={entry.referrer_address}>
            <div
              className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${
                index < 3
                  ? "bg-gradient-to-r from-primary/20 to-primary/10 border-primary/30 hover:border-primary/50"
                  : "bg-black/30 border-border/30 hover:bg-black/40"
              }`}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 w-12 shrink-0">
                  {getMedalIcon(index + 1) ? (
                    <span className="text-3xl">{getMedalIcon(index + 1)}</span>
                  ) : (
                    <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>
                  )}
                </div>

                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage src={entry.avatar_url || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {entry.artist_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{entry.artist_name || "Anonymous"}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.active_referrals} active • {entry.total_referrals} total
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-4">
                <div className="flex items-center gap-1 justify-end text-primary font-bold">
                  <TrendingUp className="h-4 w-4" />
                  {entry.total_points_earned.toLocaleString()} pts
                </div>
                {entry.total_usdc_earned > 0 && (
                  <p className="text-sm text-green-500">${entry.total_usdc_earned.toFixed(2)}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No referrals yet. Be the first to start earning!</p>
        </div>
      )}
    </Card>
  )
}
