"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Copy, Users, Gift, Check, Share2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import SocialShareButtons from "@/components/social-share-buttons"
import ReferralAchievements from "@/components/referral-achievements"
import ReferralLeaderboard from "@/components/referral-leaderboard"

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadReferrals()
  }, [])

  async function loadReferrals() {
    try {
      const res = await fetch("/api/referrals")
      if (res.ok) {
        const data = await res.json()
        setReferralData(data)
      }
    } catch (error) {
      console.error("Failed to load referrals:", error)
    } finally {
      setLoading(false)
    }
  }

  function copyReferralLink() {
    const link = `${window.location.origin}?ref=${referralData.referralCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast({
      title: "Link copied!",
      description: "Share it with friends to earn rewards",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  function shareReferralLink() {
    const link = `${window.location.origin}?ref=${referralData.referralCode}`
    if (navigator.share) {
      navigator.share({
        title: "Join MyUSIC",
        text: "Check out MyUSIC - Web3 music streaming platform!",
        url: link,
      })
    } else {
      copyReferralLink()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      </div>

      <main className="container relative z-10 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold">Referral Program</h1>
            </div>
            <p className="text-muted-foreground text-lg">Invite friends and earn rewards together</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">Total Referrals</span>
              </div>
              <p className="text-3xl font-bold">{referralData?.totalReferrals || 0}</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Active Referrals</span>
              </div>
              <p className="text-3xl font-bold">{referralData?.activeReferrals || 0}</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="h-5 w-5 text-accent" />
                <span className="text-sm text-muted-foreground">Airdrop Points</span>
              </div>
              <p className="text-3xl font-bold">{(referralData?.activeReferrals || 0) * 100}</p>
            </Card>
          </div>

          {/* Referral Link */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Referral Link</h2>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 bg-black/50 border border-border/50 rounded-lg px-4 py-3 font-mono text-sm truncate">
                {window.location.origin}?ref={referralData?.referralCode}
              </div>
              <Button onClick={copyReferralLink} className="gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={shareReferralLink} variant="outline" className="gap-2 bg-transparent">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with friends. You'll earn 100 airdrop points for each active referral!
            </p>
          </Card>

          {/* Social Sharing Section */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Share & Earn</h2>
            <p className="text-muted-foreground mb-6">
              Share your referral link on social media to reach more people and maximize your rewards!
            </p>
            <SocialShareButtons
              type="profile"
              id={referralData?.referralCode || ""}
              title="Join USI"
              referralCode={referralData?.referralCode}
              className="justify-center"
            />
          </Card>

          {/* Achievements Section */}
          <div className="mb-8">
            <ReferralAchievements />
          </div>

          {/* Leaderboard Section */}
          <div className="mb-8">
            <ReferralLeaderboard />
          </div>

          {/* How It Works */}
          <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Share Your Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Send your unique referral link to friends who love music
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">They Sign Up</h3>
                  <p className="text-sm text-muted-foreground">
                    Your friend creates an account using your referral link
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Earn Rewards</h3>
                  <p className="text-sm text-muted-foreground">
                    Get 100 airdrop points when they stream their first track or upload music
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Referral List */}
          {referralData?.referrals && referralData.referrals.length > 0 && (
            <Card className="bg-card/50 backdrop-blur-xl border-border/50 p-8">
              <h2 className="text-2xl font-bold mb-6">Your Referrals</h2>
              <div className="space-y-3">
                {referralData.referrals.map((referral: any) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={referral.referred?.avatar_url || ""} />
                        <AvatarFallback>{referral.referred?.artist_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{referral.referred?.artist_name || "Anonymous User"}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {referral.is_active && referral.first_stream_at ? (
                        <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm font-medium">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
