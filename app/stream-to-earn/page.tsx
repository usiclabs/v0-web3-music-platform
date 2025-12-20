"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, Gift, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RewardStats {
  total_earned_usi: number
  pending_usi: number
  completed_count: number
  pending_count: number
}

interface Reward {
  id: string
  track_id: string
  unlock_type: string
  chunk_index: number
  reward_amount_usi: number
  status: "pending" | "distributing" | "completed" | "failed"
  reward_tx_hash: string | null
  created_at: string
  completed_at: string | null
  error_message: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StreamToEarnPage() {
  const { address, isConnected } = useWallet()
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 20

  const { data: rewardsData, isLoading } = useSWR(
    address ? `/api/stream-to-earn/rewards?limit=${itemsPerPage}&offset=${currentPage * itemsPerPage}` : null,
    fetcher,
    { refreshInterval: 10000 }, // Refresh every 10 seconds
  )

  useEffect(() => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to view your stream-to-earn rewards",
        variant: "destructive",
      })
    }
  }, [isConnected])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to view your USI rewards earned from unlocking songs
          </p>
        </Card>
      </div>
    )
  }

  const stats: RewardStats = rewardsData?.stats || {
    total_earned_usi: 0,
    pending_usi: 0,
    completed_count: 0,
    pending_count: 0,
  }

  const rewards: Reward[] = rewardsData?.rewards || []
  const pagination = rewardsData?.pagination || { total: 0, limit: itemsPerPage, offset: 0 }
  const totalPages = Math.ceil(pagination.total / itemsPerPage)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10"
      case "pending":
        return "text-amber-500 bg-amber-500/10"
      case "distributing":
        return "text-blue-500 bg-blue-500/10"
      case "failed":
        return "text-red-500 bg-red-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      case "pending":
        return <Clock className="h-4 w-4" />
      case "distributing":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "failed":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Stream-to-Earn Rewards</h1>
          <p className="text-muted-foreground">Earn $USI tokens instantly when you unlock songs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                <p className="text-3xl font-bold">{stats.total_earned_usi.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </Card>

          <Card className="p-6 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold">{stats.pending_usi.toLocaleString()}</p>
              </div>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold">{stats.completed_count}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Count</p>
                <p className="text-3xl font-bold">{stats.pending_count}</p>
              </div>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
        </div>

        {/* Rewards List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Recent Rewards</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No rewards yet</p>
              <p className="text-sm text-muted-foreground">Unlock songs to start earning USI rewards instantly</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="hidden sm:block">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        {reward.unlock_type === "x402_chunk_unlock" ? "Song Chunk Unlocked" : "Full Song Unlocked"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(reward.created_at).toLocaleDateString()} at{" "}
                        {new Date(reward.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-green-500">+{reward.reward_amount_usi} $USI</p>
                      <div
                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getStatusColor(reward.status)}`}
                      >
                        {getStatusIcon(reward.status)}
                        <span className="capitalize">{reward.status}</span>
                      </div>
                    </div>

                    {reward.reward_tx_hash && (
                      <a
                        href={`https://basescan.org/tx/${reward.reward_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View Tx
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/10">
          <h3 className="font-bold mb-3">How it Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Unlock songs via X402 micropayments</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Rewards are created instantly after payment confirms</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Pending rewards are distributed nightly via batch processing</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Receive $USI directly in your wallet once completed</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
