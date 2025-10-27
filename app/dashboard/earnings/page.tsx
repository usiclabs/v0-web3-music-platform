"use client"

import { Card } from "@/components/ui/card"
import { WithdrawButton } from "@/components/withdraw-button"
import { DollarSign, TrendingUp, Clock } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"

export default function EarningsPage() {
  const { address, isConnected } = useWallet()
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [recentEarnings, setRecentEarnings] = useState(0)
  const [earningsByTrack, setEarningsByTrack] = useState<any[]>([])

  useEffect(() => {
    async function loadEarnings() {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        const { data: streams } = await supabase
          .from("streams")
          .select("track_id, total_paid, last_played_at, tracks!inner(artist_id, title)")
          .eq("tracks.artist_id", address.toLowerCase())
          .order("last_played_at", { ascending: false })

        const total = streams?.reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        setTotalEarnings(total)

        // Group earnings by track
        const trackEarnings = streams?.reduce(
          (acc, stream) => {
            const trackId = stream.track_id
            if (!acc[trackId]) {
              acc[trackId] = {
                trackId,
                title: (stream.tracks as any).title,
                earnings: 0,
                lastPlayed: stream.last_played_at,
              }
            }
            acc[trackId].earnings += Number(stream.total_paid)
            return acc
          },
          {} as Record<string, { trackId: string; title: string; earnings: number; lastPlayed: string }>,
        )

        const sortedEarnings = Object.values(trackEarnings || {}).sort((a, b) => b.earnings - a.earnings)
        setEarningsByTrack(sortedEarnings)

        // Calculate recent earnings (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const recent =
          streams
            ?.filter((s) => new Date(s.last_played_at) >= sevenDaysAgo)
            .reduce((sum, s) => sum + Number(s.total_paid), 0) || 0
        setRecentEarnings(recent)
      } catch (error) {
        console.error("Failed to load earnings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEarnings()
  }, [address])

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to view your earnings and withdraw funds"
            icon={<DollarSign className="h-10 w-10 md:h-12 md:w-12 text-primary" />}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-12">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading earnings...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="container py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Earnings</h1>
          <p className="text-muted-foreground">Manage your earnings and withdraw funds</p>
        </div>

        {/* Earnings Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Total Earnings</p>
            </div>
            <p className="text-3xl font-bold mb-4">{totalEarnings.toFixed(2)} USDC</p>
            <WithdrawButton amount={totalEarnings} />
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Last 7 Days</p>
            </div>
            <p className="text-3xl font-bold">{recentEarnings.toFixed(2)} USDC</p>
          </Card>

          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20 border border-chart-3/30">
                <Clock className="h-5 w-5 text-chart-3" />
              </div>
              <p className="text-sm text-muted-foreground">Available to Withdraw</p>
            </div>
            <p className="text-3xl font-bold">{totalEarnings.toFixed(2)} USDC</p>
          </Card>
        </div>

        {/* Earnings by Track */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-6">Earnings by Track</h3>
          <div className="space-y-4">
            {earningsByTrack.length > 0 ? (
              earningsByTrack.map((track) => (
                <div key={track.trackId} className="flex items-center justify-between p-4 rounded-lg bg-muted/20">
                  <div>
                    <h4 className="font-semibold">{track.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last played: {new Date(track.lastPlayed).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{track.earnings.toFixed(2)} USDC</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No earnings yet</p>
            )}
          </div>
        </Card>

        {/* Payment Info */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold">USDC on Base</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Withdrawal Address</span>
              <span className="font-mono">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network</span>
              <span className="font-semibold">Base (Chain ID: 8453)</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
