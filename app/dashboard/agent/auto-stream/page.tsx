"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useWalletClient, usePublicClient } from "wagmi"
import { formatEther, parseEther } from "viem"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Music, DollarSign, Activity, Wallet, Copy, ArrowDownToLine, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { USDC_ADDRESS } from "@/lib/web3/contracts"
import { useChainId } from "wagmi"

export default function AutoStreamAgentPage() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const { toast } = useToast()

  const [agent, setAgent] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const [showFundingModal, setShowFundingModal] = useState(false)
  const [fundAmount, setFundAmount] = useState("")
  const [fundingAsset, setFundingAsset] = useState<"ETH" | "USDC">("ETH")
  const [isFunding, setIsFunding] = useState(false)
  const [connectedWalletBalance, setConnectedWalletBalance] = useState("0")
  const [connectedWalletUsdcBalance, setConnectedWalletUsdcBalance] = useState("0")
  const [agentWalletEthBalance, setAgentWalletEthBalance] = useState("0")
  const [agentWalletUsdcBalance, setAgentWalletUsdcBalance] = useState("0")
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (address) {
      fetchAgent()
      fetchStats()
    }
  }, [address])

  useEffect(() => {
    if (!autoRefresh || !agent?.is_active) return

    const interval = setInterval(() => {
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [agent?.is_active, autoRefresh, agent?.id])

  useEffect(() => {
    if (showFundingModal && address && agent?.wallet_address && publicClient) {
      fetchBalances()
    }
  }, [showFundingModal, address, agent?.wallet_address, publicClient])

  const fetchBalances = useCallback(async () => {
    if (!address || !agent?.wallet_address || !publicClient) return

    try {
      setError(null)
      // Fetch connected wallet ETH balance
      const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` })
      setConnectedWalletBalance(formatEther(ethBalance))

      // Fetch agent wallet ETH balance
      const agentEthBalance = await publicClient.getBalance({ address: agent.wallet_address as `0x${string}` })
      setAgentWalletEthBalance(formatEther(agentEthBalance))

      const usdcAddress = USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]

      if (!usdcAddress) {
        setConnectedWalletUsdcBalance("0")
        setAgentWalletUsdcBalance("0")
        return
      }

      const ERC20_ABI = [
        {
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [],
          name: "decimals",
          outputs: [{ name: "", type: "uint8" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const

      // Fetch connected wallet USDC balance
      const connectedUsdcBalance = await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })
      setConnectedWalletUsdcBalance((Number(connectedUsdcBalance) / 1e6).toFixed(2))

      // Fetch agent wallet USDC balance
      const agentUsdcBalance = await publicClient.readContract({
        address: usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [agent.wallet_address as `0x${string}`],
      })
      setAgentWalletUsdcBalance((Number(agentUsdcBalance) / 1e6).toFixed(2))
    } catch (error) {
      console.error("Failed to fetch balances:", error)
      setError("Failed to fetch wallet balances")
      setConnectedWalletUsdcBalance("0")
      setAgentWalletUsdcBalance("0")
    }
  }, [agent?.wallet_address, address, chainId, publicClient])

  const fetchAgent = useCallback(async () => {
    if (!address) return

    try {
      setError(null)
      const res = await fetch(`/api/agents/auto-stream/config?ownerAddress=${address}`)
      const data = await res.json()

      if (!data.agent) {
        // Create agent if doesn't exist
        const createRes = await fetch("/api/agents/auto-stream/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerAddress: address }),
        })
        const createData = await createRes.json()
        setAgent(createData.agent)
      } else {
        setAgent(data.agent)
      }
    } catch (error) {
      console.error("Failed to fetch agent:", error)
      setError("Failed to load agent configuration")
    } finally {
      setLoading(false)
    }
  }, [address])

  const fetchStats = useCallback(async () => {
    if (!agent?.id) return

    try {
      const res = await fetch(`/api/agents/auto-stream/stats?agentId=${agent.id}`)
      const data = await res.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }, [agent?.id])

  const toggleActive = useCallback(async () => {
    if (!agent) return

    try {
      setError(null)
      const res = await fetch("/api/agents/auto-stream/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: agent.id,
          is_active: !agent.is_active,
        }),
      })
      const data = await res.json()
      setAgent(data.agent)
      toast({
        title: agent.is_active ? "Agent Paused" : "Agent Activated",
        description: agent.is_active ? "Auto-streaming paused" : "Auto-streaming enabled",
      })
    } catch (error) {
      console.error("Failed to toggle agent:", error)
      setError("Failed to toggle agent status")
      toast({
        title: "Error",
        description: "Failed to update agent status",
        variant: "destructive",
      })
    }
  }, [agent, toast])

  const runCycle = useCallback(async () => {
    if (!agent) return

    setRunning(true)
    try {
      setError(null)
      const res = await fetch("/api/agents/auto-stream/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id }),
      })
      const data = await res.json()

      if (data.result?.streamed) {
        toast({
          title: "Stream Complete",
          description: `Successfully streamed ${data.result.trackTitle} (${data.result.chunksPlayed} chunks)`,
        })
      } else {
        toast({
          title: "No Stream",
          description: data.result?.error || "Unable to stream at this time",
          variant: "default",
        })
      }

      await fetchStats()
    } catch (error: any) {
      console.error("Failed to run cycle:", error)
      setError(error.message || "Failed to run streaming cycle")
      toast({
        title: "Error",
        description: "Failed to run streaming cycle",
        variant: "destructive",
      })
    } finally {
      setRunning(false)
    }
  }, [agent, toast, fetchStats])

  const updateConfig = useCallback(
    async (updates: any) => {
      if (!agent) return

      try {
        setError(null)
        const res = await fetch("/api/agents/auto-stream/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: agent.id,
            ...updates,
          }),
        })
        const data = await res.json()
        setAgent(data.agent)
        toast({
          title: "Configuration Updated",
          description: "Settings saved successfully",
        })
      } catch (error) {
        console.error("Failed to update config:", error)
        setError("Failed to save configuration")
        toast({
          title: "Error",
          description: "Failed to save configuration",
          variant: "destructive",
        })
      }
    },
    [agent, toast],
  )

  const handleFundWallet = useCallback(async () => {
    if (!agent?.wallet_address || !walletClient || !address || !fundAmount) return

    setIsFunding(true)
    try {
      setError(null)
      let txHash: string

      if (fundingAsset === "ETH") {
        // Send ETH directly
        const amount = parseEther(fundAmount)
        txHash = await walletClient.sendTransaction({
          to: agent.wallet_address as `0x${string}`,
          value: amount,
        })
      } else {
        const usdcAddress = USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]

        if (!usdcAddress) {
          throw new Error(`USDC not supported on chain ${chainId}`)
        }

        const amount = BigInt(Math.floor(Number.parseFloat(fundAmount) * 1e6)) // USDC has 6 decimals

        const ERC20_ABI = [
          {
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ] as const

        txHash = await walletClient.writeContract({
          address: usdcAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [agent.wallet_address as `0x${string}`, amount],
        })
      }

      toast({
        title: "Funding Successful",
        description: `Sent ${fundAmount} ${fundingAsset} to agent wallet`,
      })

      setShowFundingModal(false)
      setFundAmount("")
      await fetchBalances()
    } catch (error: any) {
      console.error("Funding failed:", error)
      setError(error.message || "Failed to fund wallet")
      toast({
        title: "Funding Failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      })
    } finally {
      setIsFunding(false)
    }
  }, [agent, walletClient, address, fundAmount, fundingAsset, chainId, toast, fetchBalances])

  const copyAddress = useCallback(() => {
    if (agent?.wallet_address) {
      navigator.clipboard.writeText(agent.wallet_address)
      toast({
        title: "Address Copied",
        description: "Agent wallet address copied to clipboard",
      })
    }
  }, [agent?.wallet_address, toast])

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-xl font-bold mb-2">Wallet Not Connected</h2>
          <p className="text-muted-foreground">Please connect your wallet to access the Auto-Stream Agent</p>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agent...</p>
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">Failed to Load Agent</h2>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Error Alert */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-sm text-red-600 hover:text-red-700">
              Dismiss
            </button>
          </Card>
        )}

        {/* Header - Mobile Responsive */}
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Auto-Stream Agent</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Automatically stream music to boost platform usage
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={runCycle}
              disabled={running || !agent.is_active}
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? "Running..." : "Run Now"}
            </Button>
            <div className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 bg-muted rounded-lg">
              <Label className="text-sm cursor-pointer">Active</Label>
              <Switch checked={agent.is_active} onCheckedChange={toggleActive} />
            </div>
          </div>
        </div>

        {/* Agent Wallet Card */}
        <Card className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
            <div className="space-y-4 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold">Agent Wallet</h2>
              <div className="flex items-center gap-2 break-all">
                <p className="text-xs sm:text-sm font-mono text-muted-foreground">{agent.wallet_address}</p>
                <Button onClick={copyAddress} variant="ghost" size="sm" className="flex-shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">ETH Balance</p>
                  <p className="text-lg sm:text-xl font-bold">{Number.parseFloat(agentWalletEthBalance).toFixed(4)}</p>
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">USDC Balance</p>
                  <p className="text-lg sm:text-xl font-bold">{agentWalletUsdcBalance}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowFundingModal(true)}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
            >
              <Wallet className="mr-2 h-4 w-4" />
              Fund Wallet
            </Button>
          </div>
        </Card>

        {/* Stats Grid - Responsive */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Streams</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">{stats?.totalStreams || 0}</p>
              </div>
              <Music className="h-8 w-8 text-emerald-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Paid</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">${stats?.totalPaid || "0"}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 flex-shrink-0" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold">{agent.is_active ? "Active" : "Paused"}</p>
              </div>
              <Activity className={`h-8 w-8 flex-shrink-0 ${agent.is_active ? "text-green-500" : "text-gray-500"}`} />
            </div>
          </Card>
        </div>

        {/* Configuration - Mobile Optimized */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Configuration</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm sm:text-base">Stream Interval</Label>
                <span className="text-sm font-semibold">{agent.stream_interval_minutes}m</span>
              </div>
              <Slider
                value={[agent.stream_interval_minutes]}
                onValueChange={([value]) => updateConfig({ stream_interval_minutes: value })}
                min={5}
                max={120}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm sm:text-base block mb-2">Max Daily Streams</Label>
              <Input
                type="number"
                value={agent.max_daily_streams}
                onChange={(e) => updateConfig({ max_daily_streams: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label className="text-sm cursor-pointer">Play Full Tracks</Label>
              <Switch
                checked={agent.play_full_tracks}
                onCheckedChange={(checked) => updateConfig({ play_full_tracks: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label className="text-sm cursor-pointer">Randomize Timing</Label>
              <Switch
                checked={agent.randomize_timing}
                onCheckedChange={(checked) => updateConfig({ randomize_timing: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <Label className="text-sm cursor-pointer">Auto-Refresh Stats</Label>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">Recent Activity</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{activity.tracks?.title || "Unknown Track"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.tracks?.profiles?.artist_name || "Unknown Artist"}
                    </p>
                  </div>
                  <div className="flex justify-between gap-4 text-right text-sm">
                    <div>
                      <p className="font-medium">{activity.chunks_played}</p>
                      <p className="text-xs text-muted-foreground">chunks</p>
                    </div>
                    <div>
                      <p className="font-medium">${activity.amount_paid}</p>
                      <p className="text-xs text-muted-foreground">USDC</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No streaming activity yet</p>
            )}
          </div>
        </Card>
      </div>

      {/* Funding Modal */}
      <Dialog open={showFundingModal} onOpenChange={setShowFundingModal}>
        <DialogContent className="w-full sm:max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center flex-shrink-0">
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
              </div>
              Fund Wallet
            </DialogTitle>
            <DialogDescription className="text-sm">Send ETH or USDC to your auto-stream agent wallet</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <Tabs value={fundingAsset} onValueChange={(v) => setFundingAsset(v as "ETH" | "USDC")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ETH">ETH</TabsTrigger>
                <TabsTrigger value="USDC">USDC</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="bg-muted p-3 rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground">Recipient Address</p>
              <p className="text-xs sm:text-sm font-mono break-all">{agent.wallet_address}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground">Your Balance</p>
                <p className="text-sm sm:text-base font-bold">
                  {fundingAsset === "ETH" ? `${Number(connectedWalletBalance).toFixed(4)}` : connectedWalletUsdcBalance}
                </p>
                <p className="text-xs text-muted-foreground">{fundingAsset}</p>
              </div>

              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground">Agent Balance</p>
                <p className="text-sm sm:text-base font-bold">
                  {fundingAsset === "ETH" ? `${Number(agentWalletEthBalance).toFixed(4)}` : agentWalletUsdcBalance}
                </p>
                <p className="text-xs text-muted-foreground">{fundingAsset}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundAmount" className="text-sm">
                Amount ({fundingAsset})
              </Label>
              <Input
                id="fundAmount"
                type="number"
                step={fundingAsset === "ETH" ? "0.0001" : "1"}
                placeholder={fundingAsset === "ETH" ? "0.1" : "100"}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="w-full"
              />
            </div>

            <Button
              onClick={handleFundWallet}
              disabled={!fundAmount || isFunding || !isConnected}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isFunding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                `Send ${fundingAsset}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
