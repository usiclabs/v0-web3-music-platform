"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Droplets, Gift, Loader2, ExternalLink, Wallet, Clock, CheckCircle2, Sparkles } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { SABLIER_LOCKUP_LINEAR_ADDRESS, SABLIER_LOCKUP_LINEAR_ABI } from "@/lib/sablier/contracts"
import { useReadContract, useWriteContract, usePublicClient } from "wagmi"
import { formatUnits, parseUnits } from "viem"
import { getUserStreams, getUserClaims, recordClaim, updateStreamClaimedAmount } from "@/lib/sablier/rewards"
import type { RewardStream, RewardClaim } from "@/lib/sablier/rewards"
import Link from "next/link"

const MINIMUM_USI_BALANCE = parseUnits("100000000", 18) // 100M $USI required

export default function RewardsPage() {
  const { address, isConnected, chainId, connect } = useWallet()
  const { addToast } = useToast()
  const [streams, setStreams] = useState<RewardStream[]>([])
  const [claims, setClaims] = useState<RewardClaim[]>([])
  const [isLoadingStreams, setIsLoadingStreams] = useState(false)
  const [isLoadingClaims, setIsLoadingClaims] = useState(false)
  const [withdrawableAmounts, setWithdrawableAmounts] = useState<Record<string, bigint>>({})

  const publicClient = usePublicClient()

  const { data: tokenBalance } = useReadContract({
    address: chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected },
  })

  const { writeContractAsync } = useWriteContract()

  const isEligible = tokenBalance && tokenBalance >= MINIMUM_USI_BALANCE

  useEffect(() => {
    if (address) {
      loadStreams()
      loadClaims()
    }
  }, [address])

  const loadStreams = async () => {
    if (!address) return
    setIsLoadingStreams(true)
    try {
      const data = await getUserStreams(address)
      setStreams(data)
      await fetchWithdrawableAmounts(data)
    } finally {
      setIsLoadingStreams(false)
    }
  }

  const loadClaims = async () => {
    if (!address) return
    setIsLoadingClaims(true)
    try {
      const data = await getUserClaims(address)
      setClaims(data)
    } finally {
      setIsLoadingClaims(false)
    }
  }

  const fetchWithdrawableAmounts = async (streams: RewardStream[]) => {
    if (!address || !chainId || !publicClient) return

    try {
      const amounts = await Promise.all(
        streams.map(async (stream) => {
          try {
            const withdrawable = await publicClient.readContract({
              address: SABLIER_LOCKUP_LINEAR_ADDRESS[chainId as keyof typeof SABLIER_LOCKUP_LINEAR_ADDRESS],
              abi: SABLIER_LOCKUP_LINEAR_ABI,
              functionName: "withdrawableAmountOf",
              args: [BigInt(stream.stream_id)],
            })
            return { stream_id: stream.stream_id, withdrawable: withdrawable as bigint }
          } catch (error) {
            console.error(`Failed to fetch withdrawable amount for stream ${stream.stream_id}:`, error)
            return { stream_id: stream.stream_id, withdrawable: 0n }
          }
        }),
      )

      const amountsMap = amounts.reduce(
        (acc, curr) => {
          acc[curr.stream_id] = curr.withdrawable
          return acc
        },
        {} as Record<string, bigint>,
      )

      setWithdrawableAmounts(amountsMap)
    } catch (error) {
      console.error("Failed to fetch withdrawable amounts:", error)
    }
  }

  const handleWithdraw = async (stream: RewardStream) => {
    if (!address || !chainId) return

    const withdrawable = withdrawableAmounts[stream.stream_id]

    if (!withdrawable || withdrawable === 0n) {
      addToast({
        title: "No Rewards Available",
        description: "There are no rewards available to claim yet.",
        variant: "error",
      })
      return
    }

    try {
      const withdrawHash = await writeContractAsync({
        address: SABLIER_LOCKUP_LINEAR_ADDRESS[chainId as keyof typeof SABLIER_LOCKUP_LINEAR_ADDRESS],
        abi: SABLIER_LOCKUP_LINEAR_ABI,
        functionName: "withdraw",
        args: [BigInt(stream.stream_id), address, withdrawable],
      })

      const amount = formatUnits(withdrawable, 18)

      await recordClaim({
        user_address: address,
        stream_id: stream.stream_id,
        amount,
        tx_hash: withdrawHash,
      })

      const newClaimedAmount = (BigInt(parseUnits(stream.claimed_amount, 18)) + withdrawable).toString()

      await updateStreamClaimedAmount(stream.stream_id, formatUnits(BigInt(newClaimedAmount), 18))

      addToast({
        title: "Rewards Claimed!",
        description: `Successfully claimed ${Number.parseFloat(amount).toFixed(4)} $USI`,
        variant: "success",
      })

      loadStreams()
      loadClaims()
    } catch (error) {
      console.error("Withdraw failed:", error)
      addToast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim rewards.",
        variant: "error",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="rounded-full bg-red-500/10 p-6">
            <Wallet className="h-12 w-12 text-red-500" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Connect Your Wallet</h1>
            <p className="text-muted-foreground max-w-md">
              Connect your wallet to view and claim your streaming $USI rewards.
            </p>
          </div>
          <Button onClick={connect} size="lg" className="gap-2 bg-red-500 hover:bg-red-600">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        </div>
      </div>
    )
  }

  const walletBalance = tokenBalance ? formatUnits(tokenBalance, 18) : "0"

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-500/10 p-3">
            <Droplets className="h-6 w-6 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Streaming Rewards</h1>
            <p className="text-muted-foreground">Claim your continuous $USI token rewards powered by Sablier</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className={isEligible ? "bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20" : ""}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Eligibility Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {isEligible ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-bold text-green-500">Eligible</span>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span className="text-lg font-bold text-amber-500">Not Eligible</span>
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isEligible ? "You qualify for streaming rewards" : "Hold 100M+ $USI to qualify"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{Number.parseFloat(walletBalance).toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">$USI</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-500">{streams.length}</span>
              <Droplets className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-red-500" />
            Your Reward Streams
          </CardTitle>
          <CardDescription>Continuous token rewards streaming to your wallet</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStreams ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : streams.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="rounded-full bg-red-500/10 p-6 w-fit mx-auto">
                <Sparkles className="h-12 w-12 text-red-500" />
              </div>
              <div>
                <p className="font-medium mb-1">No Active Streams</p>
                <p className="text-sm text-muted-foreground">
                  {isEligible
                    ? "Contact the team to set up your reward stream"
                    : "Hold 100M+ $USI tokens to become eligible for streaming rewards"}
                </p>
              </div>
              {!isEligible && (
                <Button asChild variant="outline">
                  <Link href="/swap">Get $USI Tokens</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {streams.map((stream) => (
                <StreamCard
                  key={stream.id}
                  stream={stream}
                  onWithdraw={handleWithdraw}
                  withdrawable={withdrawableAmounts[stream.stream_id]}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Claim History
          </CardTitle>
          <CardDescription>Your recent reward claims</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingClaims ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No claims yet</p>
              <p className="text-sm">Your claimed rewards will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full p-2 bg-green-500/10 text-green-500">
                      <Gift className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">Claimed Rewards</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(claim.created_at).toLocaleDateString()} at{" "}
                        {new Date(claim.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-500">+{Number.parseFloat(claim.amount).toFixed(4)} $USI</p>
                    {claim.tx_hash && (
                      <a
                        href={`https://basescan.org/tx/${claim.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 justify-end"
                      >
                        View tx <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-500/5 to-transparent border-red-500/10">
        <CardHeader>
          <CardTitle className="text-base">How Streaming Rewards Work</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">Hold 100M+ $USI tokens to qualify for continuous reward streams</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">Rewards stream continuously using Sablier protocol</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">Claim your accumulated rewards anytime - no waiting periods</p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-muted-foreground">Powered by Sablier's trustless streaming technology</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StreamCard({
  stream,
  onWithdraw,
  withdrawable,
}: { stream: RewardStream; onWithdraw: (stream: RewardStream) => void; withdrawable: bigint }) {
  const now = Math.floor(Date.now() / 1000)
  const progress = Math.min(100, ((now - stream.start_time) / (stream.end_time - stream.start_time)) * 100)
  const isActive = now >= stream.start_time && now < stream.end_time

  return (
    <div className="p-4 rounded-lg border bg-card space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">Stream #{stream.stream_id}</p>
            {isActive && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                Active
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {Number.parseFloat(stream.total_amount).toFixed(2)} $USI total
          </p>
        </div>
        <Button
          onClick={() => onWithdraw(stream)}
          size="sm"
          className="bg-red-500 hover:bg-red-600"
          disabled={!isActive}
        >
          <Gift className="h-4 w-4 mr-2" />
          Claim
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-muted-foreground mb-1">Start Date</p>
          <p className="font-medium">{new Date(stream.start_time * 1000).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">End Date</p>
          <p className="font-medium">{new Date(stream.end_time * 1000).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="pt-3 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Claimed</span>
          <span className="font-semibold">{Number.parseFloat(stream.claimed_amount).toFixed(4)} $USI</span>
        </div>
      </div>
    </div>
  )
}
