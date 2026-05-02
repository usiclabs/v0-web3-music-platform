"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Coins,
  TrendingUp,
  Lock,
  Unlock,
  Gift,
  Loader2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wallet,
  Shield,
  Zap,
} from "lucide-react"
import { EmptyStateWalletConnect } from "@/components/empty-state-wallet-connect"
import { useToast } from "@/hooks/use-toast"
import { USI_TOKEN_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { useReadContract, useWriteContract } from "wagmi"
import { parseUnits, formatUnits } from "viem"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import useSWR from "swr"

// Staking vault ABI (simplified for demo)
// TODO: Update with actual deployed staking vault address once available
const STAKING_VAULT_ABI = [
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "stake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "amount", type: "uint256" }],
    name: "unstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "claimRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "stakedBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "pendingRewards",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Staking vault addresses - will be updated once contracts are deployed
const STAKING_VAULT_ADDRESS = {
  8453: "0x0000000000000000000000000000000000000000", // Base mainnet - pending deployment
  84532: "0x0000000000000000000000000000000000000000", // Base Sepolia - pending deployment
} as const

interface StakingHistory {
  id: string
  user_address: string
  action: "stake" | "unstake" | "claim"
  amount: string
  tx_hash: string | null
  created_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function StakingPage() {
  const { address, isConnected, chainId, connect } = useWallet()
  const { addToast } = useToast()
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [stakingHistory, setStakingHistory] = useState<StakingHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  const { data: apyData } = useSWR("/api/staking/apy", fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  const isTokenDeployed =
    chainId &&
    USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] !== "0x0000000000000000000000000000000000000000"

  const { data: tokenBalance, refetch: refetchBalance } = useReadContract({
    address: chainId ? USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isTokenDeployed },
  })

  const { data: stakedBalance, refetch: refetchStaked } = useReadContract({
    address: chainId
      ? (STAKING_VAULT_ADDRESS[chainId as keyof typeof STAKING_VAULT_ADDRESS] as `0x${string}`)
      : undefined,
    abi: STAKING_VAULT_ABI,
    functionName: "stakedBalance",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isTokenDeployed },
  })

  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: chainId
      ? (STAKING_VAULT_ADDRESS[chainId as keyof typeof STAKING_VAULT_ADDRESS] as `0x${string}`)
      : undefined,
    abi: STAKING_VAULT_ABI,
    functionName: "pendingRewards",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isTokenDeployed },
  })

  const { writeContractAsync } = useWriteContract()

  useEffect(() => {
    if (address) {
      loadStakingHistory()
    }
  }, [address])

  const loadStakingHistory = async () => {
    if (!address) return

    setIsLoadingHistory(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("staking_history")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setStakingHistory(data || [])
    } catch (error) {
      console.error("Failed to load staking history:", error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleStake = async () => {
    if (!address || !chainId || !isTokenDeployed) return

    const amount = Number.parseFloat(stakeAmount)
    if (isNaN(amount) || amount <= 0) {
      addToast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to stake.",
        variant: "error",
      })
      return
    }

    try {
      const approveHash = await writeContractAsync({
        address: USI_TOKEN_ADDRESS[chainId as keyof typeof USI_TOKEN_ADDRESS] as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          STAKING_VAULT_ADDRESS[chainId as keyof typeof STAKING_VAULT_ADDRESS] as `0x${string}`,
          parseUnits(stakeAmount, 18),
        ],
      })

      addToast({
        title: "Approval Pending",
        description: "Waiting for approval confirmation...",
        variant: "default",
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))

      const stakeHash = await writeContractAsync({
        address: STAKING_VAULT_ADDRESS[chainId as keyof typeof STAKING_VAULT_ADDRESS] as `0x${string}`,
        abi: STAKING_VAULT_ABI,
        functionName: "stake",
        args: [parseUnits(stakeAmount, 18)],
      })

      const supabase = createClient()
      await supabase.from("staking_history").insert({
        user_address: address.toLowerCase(),
        action: "stake",
        amount: stakeAmount,
        tx_hash: stakeHash,
      })

      addToast({
        title: "Staking Successful!",
        description: `Successfully staked ${stakeAmount} $USI tokens.`,
        variant: "success",
      })

      setStakeAmount("")
      refetchBalance()
      refetchStaked()
      loadStakingHistory()
    } catch (error) {
      console.error("Staking failed:", error)
      addToast({
        title: "Staking Failed",
        description: error instanceof Error ? error.message : "Failed to stake tokens.",
        variant: "error",
      })
    }
  }

  const handleUnstake = async () => {
    if (!address || !chainId || !isTokenDeployed) return

    const amount = Number.parseFloat(unstakeAmount)
    if (isNaN(amount) || amount <= 0) {
      addToast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to unstake.",
        variant: "error",
      })
      return
    }

    try {
      const unstakeHash = await writeContractAsync({
        address: STAKING_VAULT_ADDRESS[chainId as keyof typeof STAKING_VAULT_ADDRESS] as `0x${string}`,
        abi: STAKING_VAULT_ABI,
        functionName: "unstake",
        args: [parseUnits(unstakeAmount, 18)],
      })

      const supabase = createClient()
      await supabase.from("staking_history").insert({
        user_address: address.toLowerCase(),
        action: "unstake",
        amount: unstakeAmount,
        tx_hash: unstakeHash,
      })

      addToast({
        title: "Unstaking Successful!",
        description: `Successfully unstaked ${unstakeAmount} $USI tokens.`,
        variant: "success",
      })

      setUnstakeAmount("")
      refetchBalance()
      refetchStaked()
      loadStakingHistory()
    } catch (error) {
      console.error("Unstaking failed:", error)
      addToast({
        title: "Unstaking Failed",
        description: error instanceof Error ? error.message : "Failed to unstake tokens.",
        variant: "error",
      })
    }
  }

  const handleClaimRewards = async () => {
    if (!address || !chainId || !isTokenDeployed) return

    try {
      const claimHash = await writeContractAsync({
        address: STAKING_VAULT_ADDRESS[chainId as keyof typeof STAKING_VAULT_ADDRESS] as `0x${string}`,
        abi: STAKING_VAULT_ABI,
        functionName: "claimRewards",
      })

      const rewardsAmount = pendingRewards ? formatUnits(pendingRewards as bigint, 18) : "0"

      const supabase = createClient()
      await supabase.from("staking_history").insert({
        user_address: address.toLowerCase(),
        action: "claim",
        amount: rewardsAmount,
        tx_hash: claimHash,
      })

      addToast({
        title: "Rewards Claimed!",
        description: `Successfully claimed ${rewardsAmount} $USI rewards.`,
        variant: "success",
      })

      refetchBalance()
      refetchRewards()
      loadStakingHistory()
    } catch (error) {
      console.error("Claim failed:", error)
      addToast({
        title: "Claim Failed",
        description: error instanceof Error ? error.message : "Failed to claim rewards.",
        variant: "error",
      })
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32">
        <EmptyStateWalletConnect
          title="Connect Your Wallet"
          description="Connect your wallet to start staking $USI tokens and earn rewards from platform fees."
          ctaText="Connect Wallet"
          features={[
            {
              icon: <Shield className="h-5 w-5 text-accent" />,
              title: "Secure",
              description: "Your assets stay protected",
            },
            {
              icon: <Zap className="h-5 w-5 text-accent" />,
              title: "Fast",
              description: "Quick connection in seconds",
            },
            {
              icon: <Gift className="h-5 w-5 text-accent" />,
              title: "Rewards",
              description: "Earn $USI and exclusive perks",
            },
          ]}
        />
      </div>
    )
  }

  if (!isTokenDeployed) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="rounded-full bg-primary/10 p-6">
            <Clock className="h-12 w-12 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Staking Coming Soon</h1>
            <p className="text-muted-foreground max-w-md">
              The $USI token and staking vault are currently being deployed. Check back soon to start earning rewards!
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Explore Platform</Link>
            </Button>
            <Button asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const walletBalance = tokenBalance ? formatUnits(tokenBalance as bigint, 18) : "0"
  const staked = stakedBalance ? formatUnits(stakedBalance as bigint, 18) : "0"
  const rewards = pendingRewards ? formatUnits(pendingRewards as bigint, 18) : "0"

  const currentAPY = apyData?.apy || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">$USI Staking</h1>
        <p className="text-muted-foreground">
          Stake your $USI tokens to earn rewards from platform fees and participate in governance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current APY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {apyData ? `${currentAPY.toFixed(2)}%` : <Loader2 className="h-8 w-8 animate-spin" />}
              </span>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Your Staked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{Number.parseFloat(staked).toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">$USI</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-500">{Number.parseFloat(rewards).toFixed(4)}</span>
              <span className="text-sm text-muted-foreground">$USI</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{Number.parseFloat(walletBalance).toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">$USI</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Tabs defaultValue="stake" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="unstake">Unstake</TabsTrigger>
            </TabsList>

            <TabsContent value="stake" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Stake $USI Tokens
                  </CardTitle>
                  <CardDescription>Lock your tokens to earn rewards from platform fees</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stake-amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stake-amount"
                        type="number"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setStakeAmount(walletBalance)}
                        className="whitespace-nowrap"
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: {Number.parseFloat(walletBalance).toFixed(2)} $USI
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated APY</span>
                      <span className="font-semibold text-primary">{currentAPY.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated Daily Rewards</span>
                      <span className="font-semibold">
                        {stakeAmount
                          ? ((Number.parseFloat(stakeAmount) * currentAPY) / 100 / 365).toFixed(4)
                          : "0.0000"}{" "}
                        $USI
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={handleStake}
                    className="w-full"
                    size="lg"
                    disabled={!stakeAmount || Number.parseFloat(stakeAmount) <= 0}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    Stake Tokens
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unstake" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-primary" />
                    Unstake $USI Tokens
                  </CardTitle>
                  <CardDescription>Withdraw your staked tokens back to your wallet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="unstake-amount"
                        type="number"
                        placeholder="0.00"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" onClick={() => setUnstakeAmount(staked)} className="whitespace-nowrap">
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Staked: {Number.parseFloat(staked).toFixed(2)} $USI</p>
                  </div>

                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Unstaking Notice</p>
                      <p className="text-xs text-muted-foreground">
                        Unstaking will forfeit any unclaimed rewards. Make sure to claim your rewards first.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleUnstake}
                    className="w-full bg-transparent"
                    size="lg"
                    variant="outline"
                    disabled={!unstakeAmount || Number.parseFloat(unstakeAmount) <= 0}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Unstake Tokens
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-500" />
                Claim Rewards
              </CardTitle>
              <CardDescription>Collect your earned staking rewards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">Pending Rewards</p>
                <p className="text-4xl font-bold text-green-500">{Number.parseFloat(rewards).toFixed(4)}</p>
                <p className="text-sm text-muted-foreground mt-1">$USI</p>
              </div>

              <Button
                onClick={handleClaimRewards}
                className="w-full bg-green-500 hover:bg-green-600"
                size="lg"
                disabled={!rewards || Number.parseFloat(rewards) <= 0}
              >
                <Gift className="h-4 w-4 mr-2" />
                Claim Rewards
              </Button>

              <div className="text-xs text-center text-muted-foreground">
                Rewards are distributed from platform streaming fees
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">How Staking Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">Stake $USI to earn a share of platform fees</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">Rewards are distributed proportionally to your stake</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">No lock period - unstake anytime</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">Participate in platform governance</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staking History</CardTitle>
          <CardDescription>Your recent staking transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : stakingHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No staking history yet</p>
              <p className="text-sm">Start staking to see your transactions here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stakingHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        item.action === "stake"
                          ? "bg-primary/10 text-primary"
                          : item.action === "unstake"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-green-500/10 text-green-500"
                      }`}
                    >
                      {item.action === "stake" ? (
                        <Lock className="h-4 w-4" />
                      ) : item.action === "unstake" ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Gift className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{item.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()} at{" "}
                        {new Date(item.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {item.action === "unstake" ? "-" : "+"}
                      {Number.parseFloat(item.amount).toFixed(4)} $USI
                    </p>
                    {item.tx_hash && (
                      <a
                        href={`https://basescan.org/tx/${item.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 justify-end"
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
    </div>
  )
}
