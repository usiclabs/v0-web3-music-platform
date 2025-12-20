"use client"

import { useState } from "react"
import useSWR from "swr"
import { useWallet } from "@/lib/web3/wallet-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function StreamToEarnAdmin() {
  const { address } = useWallet()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundType, setFundType] = useState<"usi" | "eth">("usi")
  const [initData, setInitData] = useState({
    rewardsWalletAddress: "",
    usiTokenAddress: "",
    rewardAmountPerUnlock: "0.1",
    autoDistributeEnabled: true,
    minBalanceThreshold: 100,
  })

  const { data: configData, mutate: mutateConfig } = useSWR(
    address ? "/api/admin/stream-to-earn/config" : null,
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) {
        return null // Return null instead of throwing for 404
      }
      return res.json()
    },
  )

  const { data: rewardsData } = useSWR(
    "/api/admin/stream-to-earn/rewards/stats",
    async (url) => {
      const res = await fetch(url)
      if (!res.ok) return null
      return res.json()
    },
    { refreshInterval: 30000 }, // Refresh every 30 seconds
  )

  const handleFundWallet = async () => {
    if (!fundAmount || Number.parseFloat(fundAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const payload =
        fundType === "usi"
          ? { amount_usi: Number.parseFloat(fundAmount), amount_eth: 0 }
          : { amount_usi: 0, amount_eth: Number.parseFloat(fundAmount) }

      const res = await fetch("/api/admin/stream-to-earn/fund-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to fund wallet")
      }

      await mutateConfig()
      setFundAmount("")
      toast({
        title: "Wallet Funded",
        description: `Successfully added ${fundAmount} ${fundType.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fund wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitializeConfig = async () => {
    if (!initData.rewardsWalletAddress || !initData.usiTokenAddress || !initData.rewardAmountPerUnlock) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsInitializing(true)
    try {
      const res = await fetch("/api/admin/stream-to-earn/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewards_wallet_address: initData.rewardsWalletAddress,
          usi_token_address: initData.usiTokenAddress,
          reward_amount_per_unlock: Number.parseFloat(initData.rewardAmountPerUnlock),
          auto_distribute_enabled: initData.autoDistributeEnabled,
          min_balance_threshold: initData.minBalanceThreshold,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to initialize config")
      }

      await mutateConfig()
      toast({
        title: "Configuration Initialized",
        description: "Stream-to-Earn configuration has been set up",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to initialize",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  if (!address) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8">
          <p>Please connect your wallet to access Stream-to-Earn admin panel</p>
        </Card>
      </div>
    )
  }

  const config = configData?.config
  const rewards = rewardsData?.stats

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <h1 className="text-3xl font-bold">Stream-to-Earn Rewards Admin</h1>

        {/* Configuration Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Configuration</h2>
          {config ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reward Amount (USI per unlock)</Label>
                  <p className="text-lg font-semibold">{config.reward_amount_per_unlock}</p>
                </div>
                <div>
                  <Label>Rewards Wallet</Label>
                  <p className="text-sm font-mono truncate">{config.rewards_wallet_address}</p>
                </div>
                <div>
                  <Label>USI Token Address</Label>
                  <p className="text-sm font-mono truncate">{config.usi_token_address}</p>
                </div>
                <div>
                  <Label>Auto Distribute</Label>
                  <p className="font-semibold">{config.auto_distribute_enabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  Stream-to-Earn configuration needs to be initialized. Fill in the details below to get started.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rewards-wallet">Rewards Wallet Address *</Label>
                  <Input
                    id="rewards-wallet"
                    placeholder="0x..."
                    value={initData.rewardsWalletAddress}
                    onChange={(e) => setInitData({ ...initData, rewardsWalletAddress: e.target.value })}
                    disabled={isInitializing}
                  />
                </div>
                <div>
                  <Label htmlFor="usi-token">USI Token Address *</Label>
                  <Input
                    id="usi-token"
                    placeholder="0x..."
                    value={initData.usiTokenAddress}
                    onChange={(e) => setInitData({ ...initData, usiTokenAddress: e.target.value })}
                    disabled={isInitializing}
                  />
                </div>
                <div>
                  <Label htmlFor="reward-amount">USI per Song Unlock *</Label>
                  <Input
                    id="reward-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.1"
                    value={initData.rewardAmountPerUnlock}
                    onChange={(e) => setInitData({ ...initData, rewardAmountPerUnlock: e.target.value })}
                    disabled={isInitializing}
                  />
                </div>
                <div>
                  <Label htmlFor="min-threshold">Minimum Balance Threshold</Label>
                  <Input
                    id="min-threshold"
                    type="number"
                    placeholder="100"
                    value={initData.minBalanceThreshold}
                    onChange={(e) =>
                      setInitData({
                        ...initData,
                        minBalanceThreshold: Number.parseInt(e.target.value) || 100,
                      })
                    }
                    disabled={isInitializing}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="auto-distribute"
                  checked={initData.autoDistributeEnabled}
                  onChange={(e) => setInitData({ ...initData, autoDistributeEnabled: e.target.checked })}
                  disabled={isInitializing}
                />
                <Label htmlFor="auto-distribute">Enable Auto-Distribute</Label>
              </div>

              <Button onClick={handleInitializeConfig} disabled={isInitializing} size="lg" className="w-full">
                {isInitializing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing...
                  </>
                ) : (
                  "Initialize Configuration"
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Wallet Balance Card */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Wallet Balance</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-muted-foreground">USI Balance</Label>
              <p className="text-2xl font-bold">{config?.usi_balance || 0}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-muted-foreground">ETH Gas Reserve</Label>
              <p className="text-2xl font-bold">{(config?.eth_gas_reserve_balance || 0).toFixed(4)}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <Label className="text-muted-foreground">Min Threshold</Label>
              <p className="text-2xl font-bold">{config?.min_balance_threshold || 100}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <select
                value={fundType}
                onChange={(e) => setFundType(e.target.value as "usi" | "eth")}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="usi">Add USI</option>
                <option value="eth">Add ETH</option>
              </select>
              <Input
                type="number"
                placeholder="Amount"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                step="0.01"
              />
              <Button onClick={handleFundWallet} disabled={isLoading}>
                {isLoading ? "Funding..." : "Fund"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Rewards Stats Card */}
        {rewards && (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Rewards Statistics</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <Label className="text-muted-foreground">Pending Rewards</Label>
                <p className="text-2xl font-bold">{rewards.pending_count}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <Label className="text-muted-foreground">Completed Rewards</Label>
                <p className="text-2xl font-bold">{rewards.completed_count}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <Label className="text-muted-foreground">Total Distributed (USI)</Label>
                <p className="text-2xl font-bold">{rewards.total_distributed_usi}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <Label className="text-muted-foreground">Failed Rewards</Label>
                <p className="text-2xl font-bold text-destructive">{rewards.failed_count}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
