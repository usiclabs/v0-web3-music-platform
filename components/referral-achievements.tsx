"use client"

import { Card } from "@/components/ui/card"
import { Award, Lock, Sparkles } from 'lucide-react'
import { useEffect, useState } from "react"
import { useWallet } from "@/lib/web3/wallet-context"

interface Achievement {
  id: string
  achievement_type: string
  unlocked_at: string | null
  reward_amount: number
  metadata: any
}

const ACHIEVEMENT_CONFIG = {
  referral_3: {
    title: "Rising Star",
    description: "Refer 3 active users",
    icon: "⭐",
    reward: 50,
    required: 3,
  },
  referral_5: {
    title: "Social Butterfly",
    description: "Refer 5 active users",
    icon: "🦋",
    reward: 100,
    required: 5,
  },
  referral_10: {
    title: "Community Builder",
    description: "Refer 10 active users",
    icon: "🏘️",
    reward: 250,
    required: 10,
  },
  referral_25: {
    title: "Growth Hacker",
    description: "Refer 25 active users",
    icon: "📈",
    reward: 750,
    required: 25,
  },
  referral_50: {
    title: "Viral Master",
    description: "Refer 50 active users",
    icon: "🚀",
    reward: 2000,
    required: 50,
  },
  referral_100: {
    title: "Legend",
    description: "Refer 100 active users",
    icon: "👑",
    reward: 5000,
    required: 100,
  },
}

export default function ReferralAchievements() {
  const { address } = useWallet()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeReferrals, setActiveReferrals] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      loadAchievements()
    }
  }, [address])

  async function loadAchievements() {
    try {
      const res = await fetch("/api/referrals/achievements")
      if (res.ok) {
        const data = await res.json()
        setAchievements(data.achievements || [])
        setActiveReferrals(data.activeReferrals || 0)
      }
    } catch (error) {
      console.error("Failed to load achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const isUnlocked = (type: string) => {
    return achievements.some((a) => a.achievement_type === type)
  }

  const getProgress = (required: number) => {
    return Math.min((activeReferrals / required) * 100, 100)
  }

  if (!address) {
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
        <Award className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Achievements</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(ACHIEVEMENT_CONFIG).map(([type, config]) => {
          const unlocked = isUnlocked(type)
          const progress = getProgress(config.required)

          return (
            <div
              key={type}
              className={`relative p-6 rounded-xl border transition-all duration-300 ${
                unlocked
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
                  : "bg-black/30 border-border/30 hover:bg-black/40"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`text-4xl ${unlocked ? "animate-bounce" : "opacity-40 grayscale"}`}
                >
                  {config.icon}
                </div>
                {!unlocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                {unlocked && <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />}
              </div>

              <h3 className={`font-bold mb-1 ${unlocked ? "text-primary" : "text-muted-foreground"}`}>
                {config.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{config.description}</p>

              {!unlocked && (
                <>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">
                        {activeReferrals}/{config.required}
                      </span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 text-sm">
                <span className={unlocked ? "text-green-500 font-semibold" : "text-muted-foreground"}>
                  {config.reward} points
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
