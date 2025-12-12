"use client"
import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  Zap,
  Wallet2,
  ArrowRightLeft,
  Settings,
  PlayCircle,
  PauseCircle,
  ArrowDownToLine,
  BarChart3,
  DollarSign,
  CheckCircle2,
  XCircle,
  Wallet,
  ExternalLink,
  ArrowUpFromLine,
  Repeat2,
  Download,
  Copy,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import { useWalletClient, usePublicClient, useAccount } from "wagmi"
import { parseEther, formatEther } from "viem"
import confetti from "canvas-confetti"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const SUPPORTED_TOKENS = [
  {
    address: "0x987603A52d8B966E10FBD29DcB1A574049E25B07",
    symbol: "USI",
    name: "Universal Sound Index",
  },
  {
    address: "0x73582df1cad3187cD0746b7A473d65c06386837e",
    symbol: "DEUS",
    name: "DEUS",
  },
] as const

interface MMAgentConfig {
  id: string
  wallet_address: string
  is_active: boolean
  buy_amount_eth: string
  buy_interval_minutes: number
  sell_interval_minutes: number
  last_buy_at: string | null
  last_sell_at: string | null
  total_volume_generated: string
  multi_wallet_mode: boolean
  active_wallets: number
  pro_mode?: boolean
  profitable_mode?: boolean
  token_address?: string
  token_symbol?: string
  max_mode?: boolean
  burst_mode?: boolean
  burst_trades_count?: number
  burst_delay_seconds?: number
}

interface MMStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: string
  usiBalance: string
  walletStats?: WalletStats[]
}

interface WalletStats {
  id: string
  address: string
  wallet_address: string
  buys: number
  sells: number
  usiBalance: string
  eth_balance?: string
  token_balance?: string
  total_buys?: number
  total_sells?: number
  is_active?: boolean
  wallet_index: number
}

interface MMActivity {
  id: string
  activity_type: string
  description: string
  metadata?: any
  created_at: string
}

function LiveIndicator({ active }: { active: boolean }) {
  if (!active)
    return (
      <Badge variant="secondary" className="text-xs">
        Inactive
      </Badge>
    )

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="text-xs font-semibold text-emerald-400">LIVE</span>
    </div>
  )
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  trend,
}: {
  label: string
  value: string
  change?: string
  icon: any
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {change && (
              <div className="flex items-center gap-1 mt-1">
                {trend === "up" && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                {trend === "down" && <TrendingDown className="h-3 w-3 text-rose-400" />}
                <span
                  className={`text-xs font-medium ${
                    trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-muted-foreground"
                  }`}
                >
                  {change}
                </span>
              </div>
            )}
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ activity }: { activity: MMActivity }) {
  const getIcon = () => {
    if (activity.activity_type.includes("buy")) return <TrendingUp className="h-4 w-4 text-emerald-400" />
    if (activity.activity_type.includes("sell")) return <TrendingDown className="h-4 w-4 text-rose-400" />
    if (activity.activity_type.includes("error")) return <XCircle className="h-4 w-4 text-rose-400" />
    if (activity.activity_type.includes("completed")) return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
    return <Activity className="h-4 w-4 text-blue-400" />
  }

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.created_at)}</p>
      </div>
    </div>
  )
}

export default function MarketMakerAgentPage() {
  const { address, isConnected } = useWallet()
  const { address: wagmiAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const [config, setConfig] = useState<MMAgentConfig | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showWalletsModal, setShowWalletsModal] = useState(false)
  const [wallets, setWallets] = useState<any[]>([])
  const [activities, setActivities] = useState<MMActivity[]>([])

  const [fundingWallet, setFundingWallet] = useState<any>(null)
  const [fundAmount, setFundAmount] = useState("")
  const [connectedWalletBalance, setConnectedWalletBalance] = useState("0")
  const [isFunding, setIsFunding] = useState(false)
  const [isBursting, setIsBursting] = useState(false)

  const [withdrawingWallet, setWithdrawingWallet] = useState<any>(null)
  const [withdrawType, setWithdrawType] = useState<"eth" | "token">("eth")
  const [withdrawAddress, setWithdrawAddress] = useState("")
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [sellingWallet, setSellingWallet] = useState<any>(null)
  const [isSelling, setIsSelling] = useState(false)

  const isMobile = useIsMobile()

  const { data: configData, isLoading: isLoadingConfig } = useSWR<{ config: MMAgentConfig }>(
    address ? `/api/agents/mm/config?ownerAddress=${address}` : null,
    (url) => fetch(url).then((res) => res.json()),
  )

  const { data: statsData } = useSWR<{ stats: MMStats }>(
    config?.id ? `/api/agents/mm/stats?agentId=${config.id}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { refreshInterval: 10000 },
  )

  useEffect(() => {
    if (configData?.config) {
      setConfig(configData.config)
    }
  }, [configData])

  useEffect(() => {
    if (!config?.id) return

    const loadActivities = async () => {
      const response = await fetch(`/api/agents/mm/activities?agentId=${config.id}`)
      const data = await response.json()
      if (data.activities) {
        setActivities(data.activities)
      }
    }

    loadActivities()

    const supabase = createClient()
    const channel = supabase
      .channel("mm_agent_activity")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mm_agent_activity",
          filter: `agent_id=eq.${config.id}`,
        },
        (payload) => {
          setActivities((prev) => [payload.new as MMActivity, ...prev].slice(0, 50))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [config?.id])

  useEffect(() => {
    if (showWalletsModal && config?.id) {
      fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.wallets) {
            setWallets(data.wallets)
          }
        })
        .catch((error) => console.error("Failed to load wallets:", error))
    }
  }, [showWalletsModal, config?.id])

  useEffect(() => {
    if (fundingWallet && wagmiAddress && publicClient) {
      publicClient.getBalance({ address: wagmiAddress }).then((balance) => {
        setConnectedWalletBalance(formatEther(balance))
      })
    }
  }, [fundingWallet, wagmiAddress, publicClient])

  const createAgent = async () => {
    if (!address) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/agents/mm/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerAddress: address }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Market Maker Created!", {
          description: "Your autonomous trading agent is ready",
        })
        mutate(`/api/agents/mm/config?ownerAddress=${address}`)

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      } else {
        throw new Error(data.error || "Failed to create agent")
      }
    } catch (error: any) {
      toast.error("Creation Failed", {
        description: error.message,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const toggleAgent = async () => {
    if (!config) return

    const newIsActive = !config.is_active
    setConfig({ ...config, is_active: newIsActive })

    try {
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: config.id, is_active: newIsActive }),
      })
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)

      toast.success(newIsActive ? "Agent Activated" : "Agent Paused")
    } catch (error) {
      console.error("Failed to toggle agent:", error)
      setConfig({ ...config, is_active: !newIsActive })
      toast.error("Failed to toggle agent")
    }
  }

  const handleRunCycle = async () => {
    if (!config) return

    setIsRunning(true)
    try {
      const response = await fetch("/api/agents/mm/cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: config.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Test Run Complete!", {
          description: data.messages.join("\n"),
        })
        mutate(`/api/agents/mm/stats?agentId=${config.id}`)
      } else {
        toast.error(`Test failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to run cycle:", error)
      toast.error("Test run failed")
    } finally {
      setIsRunning(false)
    }
  }

  const handleFundWallet = async () => {
    if (!fundingWallet || !fundAmount || !walletClient || !wagmiAddress) return

    setIsFunding(true)
    try {
      const hash = await walletClient.sendTransaction({
        to: fundingWallet.wallet_address as `0x${string}`,
        value: parseEther(fundAmount),
      })

      toast.success("Transfer Sent!", {
        description: `Funding ${fundingWallet.wallet_index} with ${fundAmount} ETH`,
      })

      setFundingWallet(null)
      setFundAmount("")

      // Refresh wallets after short delay
      setTimeout(() => {
        if (config?.id) {
          fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.wallets) setWallets(data.wallets)
            })
        }
      }, 2000)
    } catch (error: any) {
      console.error("Funding error:", error)
      toast.error("Transfer Failed", {
        description: error.message || "Failed to send ETH",
      })
    } finally {
      setIsFunding(false)
    }
  }

  const handleBurstMode = async () => {
    if (!config) return

    setIsBursting(true)
    try {
      const response = await fetch("/api/agents/mm/burst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: config.id, ownerAddress: address }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Burst Mode Complete!", {
          description: `Executed ${data.results?.length || 0} rapid trades`,
        })
        mutate(`/api/agents/mm/stats?agentId=${config.id}`)
      } else {
        toast.error(`Burst failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Burst mode failed:", error)
      toast.error("Burst mode failed")
    } finally {
      setIsBursting(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawingWallet || !withdrawAddress || !wagmiAddress) return

    setIsWithdrawing(true)
    try {
      const res = await fetch("/api/agents/mm/wallets/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletIndex: withdrawingWallet.wallet_index,
          recipientAddress: withdrawAddress,
          ownerAddress: wagmiAddress,
          withdrawType: withdrawType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Withdrawal failed")
      }

      toast.success("Withdrawal Successful!", {
        description: `${withdrawType.toUpperCase()} sent to ${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}`,
      })

      setWithdrawingWallet(null)
      setWithdrawAddress("")

      // Refresh wallets
      setTimeout(() => {
        if (config?.id) {
          fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.wallets) setWallets(data.wallets)
            })
        }
      }, 2000)
    } catch (error: any) {
      console.error("Withdraw error:", error)
      toast.error("Withdrawal Failed", {
        description: error.message || "Failed to withdraw funds",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleSellAll = async (wallet: any) => {
    if (!wagmiAddress) return

    setSellingWallet(wallet)
    setIsSelling(true)
    try {
      const res = await fetch("/api/agents/mm/wallets/sell-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletNumber: wallet.wallet_index,
          ownerAddress: wagmiAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Sell all failed")
      }

      toast.success("Sell All Complete!", {
        description: data.message || "All tokens sold successfully",
      })

      // Refresh wallets
      setTimeout(() => {
        if (config?.id) {
          fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.wallets) setWallets(data.wallets)
            })
        }
      }, 2000)
    } catch (error: any) {
      console.error("Sell all error:", error)
      toast.error("Sell All Failed", {
        description: error.message || "Failed to sell tokens",
      })
    } finally {
      setIsSelling(false)
      setSellingWallet(null)
    }
  }

  const handleExportWallets = () => {
    if (wallets.length === 0) {
      toast.error("No wallets to export")
      return
    }

    const csvContent = [
      ["Wallet Index", "Address", "ETH Balance", `${tokenSymbol} Balance`, "Total Buys", "Total Sells", "Active"],
      ...wallets.map((w) => [
        w.wallet_index,
        w.wallet_address,
        w.eth_balance || 0,
        w.token_balance || 0,
        w.total_buys || 0,
        w.total_sells || 0,
        w.is_active ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `mm-agent-wallets-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Wallets Exported!", {
      description: "CSV file downloaded successfully",
    })
  }

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Connect your wallet to access the Market Maker dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-lg w-full glass-premium">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400/20 to-blue-400/20 flex items-center justify-center">
              <BarChart3 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Deploy Market Maker</h2>
            <p className="text-muted-foreground mb-6">
              Launch an autonomous trading agent to provide liquidity and generate volume 24/7
            </p>
            <Button
              onClick={createAgent}
              disabled={isCreating}
              size="lg"
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Agent
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = statsData?.stats || {
    totalBuys: 0,
    totalSells: 0,
    volumeGenerated: "0",
    usiBalance: "0",
  }

  const tokenSymbol = config.token_symbol || "USI"

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <div className="sticky top-0 z-50 glass-premium border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-blue-400/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{tokenSymbol} Market Maker</h1>
                <LiveIndicator active={config.is_active} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWalletsModal(true)} className="hidden sm:flex">
                <Wallet2 className="h-4 w-4 mr-2" />
                Wallets
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowConfigModal(true)}>
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Config</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleRunCycle}
            disabled={isRunning}
            size="lg"
            variant="outline"
            className="w-full bg-transparent"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Test Run
              </>
            )}
          </Button>

          <Button
            onClick={toggleAgent}
            size="lg"
            className={
              config.is_active
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
            }
          >
            {config.is_active ? (
              <>
                <PauseCircle className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Buys" value={stats.totalBuys.toString()} icon={TrendingUp} trend="up" />
          <StatCard label="Total Sells" value={stats.totalSells.toString()} icon={TrendingDown} trend="neutral" />
          <StatCard
            label="Volume Generated"
            value={`${Number(stats.volumeGenerated).toFixed(4)} ETH`}
            icon={ArrowRightLeft}
            trend="up"
          />
          <StatCard
            label={`${tokenSymbol} Balance`}
            value={Number(stats.usiBalance).toFixed(2)}
            icon={DollarSign}
            trend="neutral"
          />
        </div>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
              <Badge variant="secondary" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                {activities.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="px-4 pb-4 space-y-1">
                {activities.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No activity yet. Start the agent to begin trading.
                  </div>
                ) : (
                  activities.map((activity) => <ActivityItem key={activity.id} activity={activity} />)
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Button variant="outline" size="lg" onClick={() => setShowWalletsModal(true)} className="w-full sm:hidden">
          <Wallet2 className="h-4 w-4 mr-2" />
          Manage Wallets ({config.active_wallets})
        </Button>
      </div>

      <Dialog open={showWalletsModal} onOpenChange={setShowWalletsModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-black/95 border-zinc-800">
          <DialogHeader className="space-y-3 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Fund Your MM Agent Wallets</DialogTitle>
                <p className="text-sm text-zinc-400 mt-1">
                  Send ETH to these addresses to enable market making operations
                </p>
              </div>
            </div>
          </DialogHeader>

          {wallets.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-emerald-400" />
              <p className="text-sm text-zinc-400">Loading wallets...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Aggregate Stats Card */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-5 space-y-4">
                  {/* Total Balances Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                      <p className="text-xs text-zinc-400 mb-1">ETH Balance</p>
                      <p className="text-lg font-bold text-white">
                        {wallets.reduce((sum, w) => sum + Number(w.eth_balance || 0), 0).toFixed(5)} ETH
                      </p>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                      <p className="text-xs text-zinc-400 mb-1">{tokenSymbol} Balance</p>
                      <p className="text-lg font-bold text-white">
                        {wallets.reduce((sum, w) => sum + Number(w.token_balance || 0), 0).toFixed(2)} {tokenSymbol}
                      </p>
                    </div>
                  </div>

                  {/* Buys/Sells Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                      <p className="text-xs text-emerald-400 mb-1">Buys</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {wallets.reduce((sum, w) => sum + (w.total_buys || 0), 0)}
                      </p>
                    </div>
                    <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
                      <p className="text-xs text-rose-400 mb-1">Sells</p>
                      <p className="text-2xl font-bold text-rose-400">
                        {wallets.reduce((sum, w) => sum + (w.total_sells || 0), 0)}
                      </p>
                    </div>
                  </div>

                  {/* Basescan Link */}
                  {wallets[0]?.wallet_address && (
                    <a
                      href={`https://basescan.org/address/${wallets[0].wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <span>View on Basescan</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button
                      onClick={() => setFundingWallet(wallets[0])}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                      size="sm"
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Fund
                    </Button>
                    <Button
                      onClick={() => {
                        setWithdrawingWallet(wallets[0])
                        setWithdrawAddress(wagmiAddress || "")
                      }}
                      className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                      size="sm"
                    >
                      <ArrowUpFromLine className="h-4 w-4 mr-2" />
                      Withdraw
                    </Button>
                    <Button
                      onClick={() => handleSellAll(wallets[0])}
                      disabled={isSelling}
                      className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
                      size="sm"
                    >
                      <Repeat2 className="h-4 w-4 mr-2" />
                      Sell All
                    </Button>
                  </div>

                  <Button
                    onClick={handleExportWallets}
                    variant="outline"
                    className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </CardContent>
              </Card>

              {/* Individual Wallet Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 px-1">Individual Wallets</h3>
                {wallets.map((wallet) => (
                  <Card key={wallet.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-5 space-y-4">
                      {/* Wallet Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold">
                            {wallet.wallet_index}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">Wallet {wallet.wallet_index}</span>
                              {wallet.is_active && (
                                <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Wallet Address */}
                      <div className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                        <code className="text-xs text-zinc-400 font-mono flex-1 truncate">{wallet.wallet_address}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => {
                            navigator.clipboard.writeText(wallet.wallet_address)
                            toast.success("Address copied!")
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Balances */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                          <p className="text-xs text-zinc-400 mb-1">ETH Balance</p>
                          <p className="font-semibold">{Number(wallet.eth_balance || 0).toFixed(6)} ETH</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                          <p className="text-xs text-zinc-400 mb-1">{tokenSymbol} Balance</p>
                          <p className="font-semibold">
                            {Number(wallet.token_balance || 0).toFixed(2)} {tokenSymbol}
                          </p>
                        </div>
                      </div>

                      {/* Trade Stats */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 mb-1">Buys</p>
                          <p className="text-xl font-bold text-emerald-400">{wallet.total_buys || 0}</p>
                        </div>
                        <div className="bg-rose-500/10 rounded-lg p-3 border border-rose-500/20">
                          <p className="text-xs text-rose-400 mb-1">Sells</p>
                          <p className="text-xl font-bold text-rose-400">{wallet.total_sells || 0}</p>
                        </div>
                      </div>

                      {/* Basescan Link */}
                      <a
                        href={`https://basescan.org/address/${wallet.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <span>View on Basescan</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={() => setFundingWallet(wallet)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          size="sm"
                        >
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Fund
                        </Button>
                        <Button
                          onClick={() => {
                            setWithdrawingWallet(wallet)
                            setWithdrawAddress(wagmiAddress || "")
                          }}
                          className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20"
                          size="sm"
                        >
                          <ArrowUpFromLine className="h-4 w-4 mr-2" />
                          Withdraw
                        </Button>
                        <Button
                          onClick={() => handleSellAll(wallet)}
                          disabled={isSelling && sellingWallet?.id === wallet.id}
                          className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
                          size="sm"
                        >
                          {isSelling && sellingWallet?.id === wallet.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Repeat2 className="h-4 w-4 mr-2" />
                              Sell All
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!fundingWallet} onOpenChange={() => setFundingWallet(null)}>
        <DialogContent className="bg-black/95 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Fund Wallet {fundingWallet?.wallet_index}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Amount (ETH)</Label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.1"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
              <p className="text-xs text-zinc-400 mt-2">
                Your balance: {Number(connectedWalletBalance).toFixed(4)} ETH
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => setFundAmount("0.01")} className="bg-zinc-900 border-zinc-800">
                0.01 ETH
              </Button>
              <Button variant="outline" onClick={() => setFundAmount("0.05")} className="bg-zinc-900 border-zinc-800">
                0.05 ETH
              </Button>
              <Button variant="outline" onClick={() => setFundAmount("0.1")} className="bg-zinc-900 border-zinc-800">
                0.1 ETH
              </Button>
            </div>
            <Button
              onClick={handleFundWallet}
              disabled={isFunding || !fundAmount || Number(fundAmount) <= 0}
              className="w-full bg-emerald-500 hover:bg-emerald-600"
            >
              {isFunding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  Fund Wallet
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!withdrawingWallet} onOpenChange={() => setWithdrawingWallet(null)}>
        <DialogContent className="bg-black/95 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Withdraw from Wallet {withdrawingWallet?.wallet_index}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Withdraw Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={withdrawType === "eth" ? "default" : "outline"}
                  onClick={() => setWithdrawType("eth")}
                  className={cn(
                    withdrawType === "eth" ? "bg-blue-500 hover:bg-blue-600" : "bg-zinc-900 border-zinc-800",
                  )}
                >
                  ETH
                </Button>
                <Button
                  variant={withdrawType === "token" ? "default" : "outline"}
                  onClick={() => setWithdrawType("token")}
                  className={cn(
                    withdrawType === "token" ? "bg-blue-500 hover:bg-blue-600" : "bg-zinc-900 border-zinc-800",
                  )}
                >
                  {tokenSymbol}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Recipient Address</Label>
              <Input
                type="text"
                placeholder="0x..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-zinc-900 border-zinc-800 font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAddress}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                <>
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  Withdraw All {withdrawType.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent Configuration</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Token Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Target Token</label>
              <div className="grid grid-cols-2 gap-3">
                {SUPPORTED_TOKENS.map((token) => (
                  <button
                    key={token.address}
                    onClick={async () => {
                      setConfig({ ...config, token_address: token.address, token_symbol: token.symbol })
                      try {
                        await fetch("/api/agents/mm/config", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            agentId: config.id,
                            token_address: token.address,
                            token_symbol: token.symbol,
                          }),
                        })
                        toast.success(`Switched to ${token.symbol}`)
                        mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                      } catch (error) {
                        toast.error("Failed to update token")
                      }
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      config.token_address === token.address
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground mt-1">{token.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Trading Settings */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buy Amount (ETH)</label>
                <Input
                  type="number"
                  step="0.001"
                  value={config.buy_amount_eth}
                  onChange={(e) => setConfig({ ...config, buy_amount_eth: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Buy Interval (min)</label>
                  <Input
                    type="number"
                    value={config.buy_interval_minutes}
                    onChange={(e) => setConfig({ ...config, buy_interval_minutes: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sell Interval (min)</label>
                  <Input
                    type="number"
                    value={config.sell_interval_minutes}
                    onChange={(e) => setConfig({ ...config, sell_interval_minutes: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Mode Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Pro Mode (10x Wallets)</p>
                  <p className="text-xs text-muted-foreground">Use 10 wallets for increased volume</p>
                </div>
                <Switch
                  checked={config.pro_mode}
                  onCheckedChange={async (checked) => {
                    setConfig({ ...config, pro_mode: checked, active_wallets: checked ? 10 : config.max_mode ? 20 : 5 })
                    try {
                      await fetch("/api/agents/mm/config", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          agentId: config.id,
                          pro_mode: checked,
                          active_wallets: checked ? 10 : config.max_mode ? 20 : 5,
                        }),
                      })
                      toast.success(checked ? "Pro Mode enabled" : "Pro Mode disabled")
                      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                    } catch (error) {
                      toast.error("Failed to update mode")
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Max Mode (20x Wallets)</p>
                  <p className="text-xs text-muted-foreground">Maximum distribution across 20 wallets</p>
                </div>
                <Switch
                  checked={config.max_mode}
                  onCheckedChange={async (checked) => {
                    setConfig({ ...config, max_mode: checked, active_wallets: checked ? 20 : config.pro_mode ? 10 : 5 })
                    try {
                      await fetch("/api/agents/mm/config", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          agentId: config.id,
                          max_mode: checked,
                          active_wallets: checked ? 20 : config.pro_mode ? 10 : 5,
                        }),
                      })
                      toast.success(checked ? "Max Mode enabled" : "Max Mode disabled")
                      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                    } catch (error) {
                      toast.error("Failed to update mode")
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Profitable Mode</p>
                  <p className="text-xs text-muted-foreground">Only sell when profit exceeds 10%</p>
                </div>
                <Switch
                  checked={config.profitable_mode}
                  onCheckedChange={async (checked) => {
                    setConfig({ ...config, profitable_mode: checked })
                    try {
                      await fetch("/api/agents/mm/config", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          agentId: config.id,
                          profitable_mode: checked,
                        }),
                      })
                      toast.success(checked ? "Profitable Mode enabled" : "Profitable Mode disabled")
                      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                    } catch (error) {
                      toast.error("Failed to update mode")
                    }
                  }}
                />
              </div>

              {/* Burst Mode Toggle and Configuration */}
              <div className="p-4 rounded-lg border-2 border-orange-500/20 bg-orange-500/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">Burst Mode</p>
                      <Badge
                        variant="secondary"
                        className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/20"
                      >
                        Advanced
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Execute rapid-fire buy/sell sequences</p>
                  </div>
                  <Switch
                    checked={config.burst_mode}
                    onCheckedChange={async (checked) => {
                      setConfig({ ...config, burst_mode: checked })
                      try {
                        await fetch("/api/agents/mm/config", {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            agentId: config.id,
                            burst_mode: checked,
                          }),
                        })
                        toast.success(checked ? "Burst Mode enabled" : "Burst Mode disabled")
                        mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                      } catch (error) {
                        toast.error("Failed to update mode")
                      }
                    }}
                  />
                </div>

                {config.burst_mode && (
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-orange-500/10">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Trades Count</label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={config.burst_trades_count || 5}
                        onChange={(e) => setConfig({ ...config, burst_trades_count: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Delay (seconds)</label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={config.burst_delay_seconds || 3}
                        onChange={(e) => setConfig({ ...config, burst_delay_seconds: Number(e.target.value) })}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Burst Mode Execution Button */}
            {config.burst_mode && (
              <Button
                onClick={handleBurstMode}
                disabled={isBursting}
                variant="outline"
                className="w-full border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40 bg-transparent"
              >
                {isBursting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executing Burst...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2 text-orange-400" />
                    Execute Burst Mode
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={async () => {
                try {
                  await fetch("/api/agents/mm/config", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      agentId: config.id,
                      buy_amount_eth: config.buy_amount_eth,
                      buy_interval_minutes: config.buy_interval_minutes,
                      sell_interval_minutes: config.sell_interval_minutes,
                      burst_trades_count: config.burst_trades_count,
                      burst_delay_seconds: config.burst_delay_seconds,
                    }),
                  })
                  toast.success("Configuration saved")
                  mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                  setShowConfigModal(false)
                } catch (error) {
                  toast.error("Failed to save configuration")
                }
              }}
              className="w-full"
            >
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
