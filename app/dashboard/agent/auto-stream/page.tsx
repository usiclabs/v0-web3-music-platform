"use client"

import { useState, useEffect } from "react"
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
import { Play, Pause, Music, DollarSign, Activity, Wallet, Copy, ArrowDownToLine, Loader2 } from "lucide-react"
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

  useEffect(() => {
    if (address) {
      fetchAgent()
      fetchStats()
    }
  }, [address])

  useEffect(() => {
    if (showFundingModal && address && agent?.wallet_address && publicClient) {
      fetchBalances()
    }
  }, [showFundingModal, address, agent?.wallet_address, publicClient])

  const fetchBalances = async () => {
    if (!address || !agent?.wallet_address || !publicClient) return

    try {
      // Fetch connected wallet ETH balance
      const ethBalance = await publicClient.getBalance({ address: address as `0x${string}` })
      setConnectedWalletBalance(formatEther(ethBalance))

      // Fetch agent wallet ETH balance
      const agentEthBalance = await publicClient.getBalance({ address: agent.wallet_address as `0x${string}` })
      setAgentWalletEthBalance(formatEther(agentEthBalance))

      const usdcAddress = USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS]

      if (!usdcAddress) {
        console.warn(`USDC not supported on chain ${chainId}`)
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
      setConnectedWalletUsdcBalance("0")
      setAgentWalletUsdcBalance("0")
    }
  }

  const fetchAgent = async () => {
    if (!address) return

    try {
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
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!agent?.id) return

    try {
      const res = await fetch(`/api/agents/auto-stream/stats?agentId=${agent.id}`)
      const data = await res.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  const toggleActive = async () => {
    if (!agent) return

    try {
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
    } catch (error) {
      console.error("Failed to toggle agent:", error)
    }
  }

  const runCycle = async () => {
    if (!agent) return

    setRunning(true)
    try {
      const res = await fetch("/api/agents/auto-stream/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.id }),
      })
      const data = await res.json()
      console.log("Cycle result:", data.result)
      await fetchStats()
    } catch (error) {
      console.error("Failed to run cycle:", error)
    } finally {
      setRunning(false)
    }
  }

  const updateConfig = async (updates: any) => {
    if (!agent) return

    try {
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
    } catch (error) {
      console.error("Failed to update config:", error)
    }
  }

  const handleFundWallet = async () => {
    if (!agent?.wallet_address || !walletClient || !address || !fundAmount) return

    setIsFunding(true)
    try {
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
      toast({
        title: "Funding Failed",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      })
    } finally {
      setIsFunding(false)
    }
  }

  const copyAddress = () => {
    if (agent?.wallet_address) {
      navigator.clipboard.writeText(agent.wallet_address)
      toast({
        title: "Address Copied",
        description: "Agent wallet address copied to clipboard",
      })
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!agent) {
    return <div className="p-8">Failed to load agent</div>
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Auto-Stream Agent</h1>
            <p className="mt-2 text-muted-foreground">
              Automatically stream music to boost platform usage and support artists
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={runCycle} disabled={running || !agent.is_active} variant="outline">
              {running ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {running ? "Running..." : "Run Now"}
            </Button>
            <div className="flex items-center gap-2">
              <Label>Active</Label>
              <Switch checked={agent.is_active} onCheckedChange={toggleActive} />
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Agent Wallet</h2>
              <div className="flex items-center gap-2 mb-4">
                <p className="text-sm font-mono text-muted-foreground">{agent.wallet_address}</p>
                <Button onClick={copyAddress} variant="ghost" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-xs text-muted-foreground">ETH Balance</p>
                  <p className="text-lg font-bold">{Number.parseFloat(agentWalletEthBalance).toFixed(4)} ETH</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">USDC Balance</p>
                  <p className="text-lg font-bold">{agentWalletUsdcBalance} USDC</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowFundingModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Wallet className="mr-2 h-4 w-4" />
              Fund Wallet
            </Button>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Streams</p>
                <p className="mt-2 text-3xl font-bold">{stats?.totalStreams || 0}</p>
              </div>
              <Music className="h-8 w-8 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="mt-2 text-3xl font-bold">${stats?.totalPaid || "0"}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="mt-2 text-3xl font-bold">{agent.is_active ? "Active" : "Paused"}</p>
              </div>
              <Activity className={`h-8 w-8 ${agent.is_active ? "text-green-500" : "text-gray-500"}`} />
            </div>
          </Card>
        </div>

        {/* Configuration */}
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-bold">Configuration</h2>
          <div className="space-y-6">
            <div>
              <Label>Stream Interval (minutes)</Label>
              <div className="mt-2 flex items-center gap-4">
                <Slider
                  value={[agent.stream_interval_minutes]}
                  onValueChange={([value]) => updateConfig({ stream_interval_minutes: value })}
                  min={5}
                  max={120}
                  step={5}
                  className="flex-1"
                />
                <span className="w-12 text-right">{agent.stream_interval_minutes}</span>
              </div>
            </div>

            <div>
              <Label>Max Daily Streams</Label>
              <Input
                type="number"
                value={agent.max_daily_streams}
                onChange={(e) => updateConfig({ max_daily_streams: Number(e.target.value) })}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Play Full Tracks</Label>
              <Switch
                checked={agent.play_full_tracks}
                onCheckedChange={(checked) => updateConfig({ play_full_tracks: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Randomize Timing</Label>
              <Switch
                checked={agent.randomize_timing}
                onCheckedChange={(checked) => updateConfig({ randomize_timing: checked })}
              />
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="mb-6 text-2xl font-bold">Recent Activity</h2>
          <div className="space-y-4">
            {stats?.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity: any, i: number) => (
                <div key={i} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">{activity.tracks?.title || "Unknown Track"}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.tracks?.profiles?.artist_name || "Unknown Artist"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{activity.chunks_played} chunks</p>
                    <p className="text-sm text-muted-foreground">${activity.amount_paid} USDC</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No streaming activity yet</p>
            )}
          </div>
        </Card>
      </div>

      <Dialog open={showFundingModal} onOpenChange={setShowFundingModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
              </div>
              Fund Agent Wallet
            </DialogTitle>
            <DialogDescription>
              Send ETH or USDC from your connected wallet to the auto-stream agent wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs value={fundingAsset} onValueChange={(v) => setFundingAsset(v as "ETH" | "USDC")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ETH">ETH</TabsTrigger>
                <TabsTrigger value="USDC">USDC</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Recipient Address</p>
              <p className="text-sm font-mono break-all">{agent.wallet_address}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-lg font-bold">
                  {fundingAsset === "ETH"
                    ? `${Number(connectedWalletBalance).toFixed(4)} ETH`
                    : `${connectedWalletUsdcBalance} USDC`}
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">Agent Balance</p>
                <p className="text-lg font-bold">
                  {fundingAsset === "ETH"
                    ? `${Number(agentWalletEthBalance).toFixed(4)} ETH`
                    : `${agentWalletUsdcBalance} USDC`}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundAmount">Amount ({fundingAsset})</Label>
              <Input
                id="fundAmount"
                type="number"
                step={fundingAsset === "ETH" ? "0.0001" : "1"}
                placeholder={fundingAsset === "ETH" ? "0.001" : "100"}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
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
