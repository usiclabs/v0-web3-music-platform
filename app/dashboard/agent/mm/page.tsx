"use client"
import { useState, useEffect, useCallback } from "react"
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
  ArrowRightLeft,
  Settings,
  PlayCircle,
  PauseCircle,
  ArrowDownToLine,
  BarChart3,
  CheckCircle2,
  XCircle,
  Wallet,
  ExternalLink,
  ArrowUpFromLine,
  Download,
  Copy,
  RefreshCw,
  ArrowDown,
  Sparkles,
  DollarSign,
  Shield,
  Brain,
  Target,
  Rocket,
  Flame,
  Crown,
  Info,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { FOMO_PATTERNS } from "@/lib/agents/fomo-mode-engine"
import { useRouter } from "next/navigation"

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

const PRESET_STRATEGIES = [
  {
    name: "Conservative",
    description: "Low-risk, slow & steady approach",
    longDescription:
      "Perfect for cautious traders. Small position sizes with long intervals minimize risk while maintaining market presence.",
    config: {
      buy_amount_eth: "0.01",
      buy_interval_minutes: 60,
      sell_interval_minutes: 120,
      pro_mode: false,
      max_mode: false,
      profitable_mode: true,
      burst_mode: false,
      fomo_mode: false,
      fomo_intensity: undefined,
      fomo_pattern: undefined,
    },
    icon: Shield,
    color: "from-blue-500 to-cyan-500",
    riskLevel: 1,
    expectedVolume: "Low",
  },
  {
    name: "Moderate",
    description: "Balanced risk & opportunity",
    longDescription: "The sweet spot for most traders. Pro mode enabled with moderate intervals and profit protection.",
    config: {
      buy_amount_eth: "0.05",
      buy_interval_minutes: 30,
      sell_interval_minutes: 60,
      pro_mode: true,
      max_mode: false,
      profitable_mode: true,
      burst_mode: false,
      fomo_mode: false,
      fomo_intensity: undefined,
      fomo_pattern: undefined,
    },
    icon: Activity,
    color: "from-amber-500 to-orange-500",
    riskLevel: 2,
    expectedVolume: "Medium",
  },
  {
    name: "Aggressive",
    description: "High-volume, rapid trading",
    longDescription:
      "Maximum volume generation with 20 wallets. Fast intervals and burst mode for serious market making.",
    config: {
      buy_amount_eth: "0.1",
      buy_interval_minutes: 15,
      sell_interval_minutes: 30,
      pro_mode: true,
      max_mode: true,
      profitable_mode: false,
      burst_mode: true,
      fomo_mode: false,
      fomo_intensity: undefined,
      fomo_pattern: undefined,
    },
    icon: Zap,
    color: "from-rose-500 to-red-500",
    riskLevel: 3,
    expectedVolume: "High",
  },
  {
    name: "FOMO Mode",
    description: "Psychological MM strategy",
    longDescription:
      "Leverages trading psychology to create buying pressure. Uses reversal patterns to attract organic buyers.",
    config: {
      buy_amount_eth: "0.08",
      buy_interval_minutes: 5,
      sell_interval_minutes: 60,
      pro_mode: true,
      max_mode: true,
      profitable_mode: true,
      burst_mode: false,
      fomo_mode: true,
      fomo_intensity: 7,
      fomo_pattern: "reversal",
    },
    icon: Brain,
    color: "from-purple-500 via-pink-500 to-rose-500",
    isPremium: true,
    riskLevel: 4,
    expectedVolume: "Very High",
  },
  {
    name: "Apex Predator",
    description: "The ultimate chart reversal weapon",
    longDescription:
      "Combines ALL psychological triggers in a 10-phase coordinated assault. Whale signals, momentum cascades, support building, and FOMO amplification.",
    config: {
      buy_amount_eth: "0.15",
      buy_interval_minutes: 2,
      sell_interval_minutes: 120,
      pro_mode: true,
      max_mode: true,
      profitable_mode: true,
      burst_mode: true,
      burst_trades_count: 15,
      burst_delay_seconds: 2,
      fomo_mode: true,
      fomo_intensity: 10,
      fomo_pattern: "apex_predator",
    },
    icon: Crown,
    color: "from-yellow-400 via-amber-500 to-orange-600",
    isPremium: true,
    isUltimate: true,
    riskLevel: 5,
    expectedVolume: "Maximum",
    features: [
      "10-phase psychological warfare",
      "Whale signal mimicry (10x buys)",
      "Momentum cascade generation",
      "Support floor building",
      "Short squeeze triggering",
      "Sentiment flip: Fear → Greed",
    ],
  },
] as const

// Helper component for Connect Wallet Button
function ConnectWalletButton() {
  const { connect, isConnected, address } = useWallet()

  return (
    <Button
      onClick={() => !isConnected && connect()}
      size="lg"
      className="w-full sm:w-auto group bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
    >
      {isConnected ? (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connected ({address?.slice(0, 6)}...{address?.slice(-4)})
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </>
      )}
    </Button>
  )
}

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
  fomo_mode?: boolean
  fomo_intensity?: number
  fomo_pattern?: string
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
  const { connect, isConnected, address } = useWallet()
  const { address: wagmiAddress } = useAccount()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const router = useRouter()

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
  const [isSellingAll, setIsSellingAll] = useState(false) // Added for selling all specific wallet

  // Add state for FOMO execution
  const [isExecutingFOMO, setIsExecutingFOMO] = useState(false)
  const [fomoProgress, setFomoProgress] = useState(0)

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
    if (statsData) {
      console.log("[v0] Stats data received:", statsData)
    }
  }, [statsData])

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

  const handleSellAll = async (wallet?: any) => {
    if (!wagmiAddress) return

    // If a specific wallet is passed, use that. Otherwise, use the currently selected sellingWallet.
    const targetWallet = wallet || sellingWallet
    if (!targetWallet) {
      toast.error("No wallet selected for sell all.")
      return
    }

    setSellingWallet(targetWallet) // Keep track of which wallet is being processed
    setIsSellingAll(true)
    try {
      const res = await fetch("/api/agents/mm/wallets/sell-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletNumber: targetWallet.wallet_index,
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
      setIsSellingAll(false)
      setSellingWallet(null) // Clear the currently selling wallet
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

  // (These were already moved outside above)

  const applyPreset = useCallback(
    async (preset: (typeof PRESET_STRATEGIES)[number]) => {
      if (!config) return

      try {
        const newConfig = {
          ...config,
          buy_amount_eth: preset.config.buy_amount_eth,
          buy_interval_minutes: preset.config.buy_interval_minutes,
          sell_interval_minutes: preset.config.sell_interval_minutes,
          pro_mode: preset.config.pro_mode,
          max_mode: preset.config.max_mode,
          profitable_mode: preset.config.profitable_mode,
          burst_mode: preset.config.burst_mode,
          fomo_mode: preset.config.fomo_mode,
          fomo_intensity: preset.config.fomo_intensity,
          fomo_pattern: preset.config.fomo_pattern,
        }

        await fetch("/api/agents/mm/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentId: config.id,
            ...newConfig,
          }),
        })

        setConfig(newConfig)

        if (preset.isPremium) {
          confetti({
            particleCount: preset.isUltimate ? 150 : 80,
            spread: preset.isUltimate ? 100 : 70,
            origin: { y: 0.6 },
            colors: preset.isUltimate
              ? ["#fbbf24", "#f59e0b", "#d97706", "#ea580c"]
              : ["#a855f7", "#ec4899", "#f43f5e"],
          })
        }

        toast.success(`${preset.name} preset applied!`, {
          description:
            preset.longDescription || `Your MM agent is now configured for ${preset.description.toLowerCase()}`,
        })
        mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      } catch (error) {
        toast.error("Failed to apply preset")
        console.error(error)
      }
    },
    [config, address],
  )

  const handleFOMOExecution = useCallback(async () => {
    if (!config?.fomo_mode || isExecutingFOMO) return

    setIsExecutingFOMO(true)
    setFomoProgress(0)

    const progressSteps = config.fomo_pattern === "apex_predator" ? 10 : 5
    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      setFomoProgress(Math.min((currentStep / progressSteps) * 100, 95))
    }, 500)

    try {
      const response = await fetch("/api/agents/mm/fomo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          pattern: config.fomo_pattern || "reversal",
          intensity: config.fomo_intensity || 7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "FOMO execution failed")
      }

      const result = await response.json()
      setFomoProgress(100)

      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.5 },
        colors:
          config.fomo_pattern === "apex_predator"
            ? ["#fbbf24", "#f59e0b", "#d97706", "#ea580c", "#10b981"]
            : ["#a855f7", "#ec4899", "#f43f5e", "#10b981"],
      })

      toast.success("FOMO Pattern Executed!", {
        description: `${result.tradesExecuted} trades completed. Buy pressure: ${result.buyPressureRatio}x`,
      })

      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      mutate(`/api/agents/mm/stats?agentId=${config.id}`)
    } catch (error: any) {
      toast.error("FOMO execution failed", {
        description: error.message,
      })
    } finally {
      setTimeout(() => {
        setIsExecutingFOMO(false)
        setFomoProgress(0)
      }, 1000)
      clearInterval(interval)
    }
  }, [config, isExecutingFOMO, address])

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            {/* Hero Section */}
            <div className="text-center space-y-8 sm:space-y-12 mb-16 sm:mb-24">
              <div className="flex justify-center animate-float">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-500 rounded-3xl blur-2xl opacity-50 animate-glow-pulse" />
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-rose-400/20 to-red-400/20 backdrop-blur-xl border border-rose-500/20 flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 text-rose-400" />
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                  <span className="block text-white">Autonomous</span>
                  <span className="block bg-gradient-to-r from-rose-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
                    Market Maker
                  </span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-zinc-400 max-w-3xl mx-auto px-4">
                  Deploy AI-powered trading agents that provide liquidity, generate volume, and optimize market depth
                  24/7 across multiple wallets
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <ConnectWalletButton />
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto group border-zinc-800 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all bg-transparent"
                  onClick={() => {
                    const learnMore = document.getElementById("features")
                    learnMore?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Learn More
                  <ArrowDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
                </Button>
              </div>
            </div>

            <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-16 sm:mb-24">
              {[
                {
                  icon: Zap,
                  label: "Multi-Wallet Trading",
                  value: "Up to 20x",
                  description: "Distribute operations across multiple wallets for maximum efficiency",
                  gradient: "from-rose-500 to-red-500",
                },
                {
                  icon: TrendingUp,
                  label: "Profitable Execution",
                  value: ">10% Mode",
                  description: "Only execute trades with profit margins above 10%",
                  gradient: "from-red-500 to-orange-500",
                },
                {
                  icon: Activity,
                  label: "Autonomous Trading",
                  value: "24/7",
                  description: "Continuous market making operations without manual intervention",
                  gradient: "from-orange-500 to-amber-500",
                },
              ].map((stat, i) => (
                <div key={stat.label} className="group relative" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 from-rose-500/10 to-red-500/10 rounded-2xl blur-xl transition-opacity" />
                  <div className="relative glass-premium rounded-2xl p-6 sm:p-8 hover:border-rose-500/30 transition-all hover-lift">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.gradient} bg-opacity-10 mb-4`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm font-medium text-zinc-300">{stat.label}</div>
                      <div className="text-xs text-zinc-500 leading-relaxed">{stat.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-24">
              {[
                {
                  icon: Wallet,
                  title: "Pro Mode Trading",
                  description:
                    "Enable 10x wallet mode for sophisticated multi-wallet strategies. Distribute trades across multiple addresses for optimal market impact.",
                  features: ["10x simultaneous wallets", "Intelligent fund distribution", "Coordinated execution"],
                },
                {
                  icon: Sparkles,
                  title: "Max Mode Distribution",
                  description:
                    "Scale up to 20 wallets for maximum volume generation. Perfect for high-liquidity requirements and aggressive market making strategies.",
                  features: ["20x wallet capacity", "Extreme volume generation", "Enterprise-grade scaling"],
                },
                {
                  icon: DollarSign,
                  title: "Profitable Mode",
                  description:
                    "Smart profit protection that only executes trades with >10% profit margins. Maximize returns while minimizing risk exposure.",
                  features: ["10% minimum profit threshold", "Automatic profit optimization", "Loss prevention"],
                },
                {
                  icon: Zap,
                  title: "Burst Mode Execution",
                  description:
                    "Rapid-fire trading sequences for sudden liquidity needs. Execute multiple trades in quick succession with configurable timing.",
                  features: ["Up to 20 trades per burst", "Customizable delays", "Manual trigger control"],
                },
              ].map((feature, i) => (
                <div
                  key={feature.title}
                  className="group glass-premium rounded-2xl p-6 sm:p-8 hover:border-rose-500/30 transition-all hover-lift"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-500/20">
                        <feature.icon className="h-6 w-6 text-rose-400" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.features.map((item) => (
                          <li key={item} className="flex items-center text-xs text-zinc-500">
                            <div className="w-1 h-1 rounded-full bg-rose-500 mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-6">
              <div className="glass-premium rounded-2xl p-8 sm:p-12 max-w-3xl mx-auto border border-rose-500/20">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Deploy?</h2>
                <p className="text-zinc-400 mb-8">
                  Connect your wallet to configure and deploy your autonomous market maker in under 60 seconds
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ConnectWalletButton />
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Shield className="h-4 w-4" />
                    <span>Secure • Non-custodial • Open Source</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-lg w-full glass-premium">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-blue-400/20 flex items-center justify-center">
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

  const tokenAddress = config?.token_address || "0x987603A52d8B966E10FBD29DcB1A574049E25B07"
  const tokenSymbol = config?.token_symbol || "USI"

  const stats = statsData?.stats || {
    totalBuys: 0,
    totalSells: 0,
    volumeGenerated: "0",
    usiBalance: "0",
  }

  const aggregateWalletStats = wallets.reduce(
    (acc, wallet) => ({
      totalEth: acc.totalEth + (Number.parseFloat(wallet.eth_balance || "0") || 0),
      totalToken: acc.totalToken + (Number.parseFloat(wallet.token_balance || "0") || 0),
      totalBuys: acc.totalBuys + (wallet.buy_count || 0),
      totalSells: acc.totalSells + (wallet.sell_count || 0),
    }),
    { totalEth: 0, totalToken: 0, totalBuys: 0, totalSells: 0 },
  )

  if (config) {
    return (
      <TooltipProvider>
        <div className="space-y-6 p-4 md:p-6 pb-24">
          {/* Header with status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Market Maker Agent
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Autonomous trading with psychological market making</p>
            </div>
            <div className="flex items-center gap-3">
              <LiveIndicator active={config.is_active} />
              <Button
                onClick={toggleAgent}
                variant={config.is_active ? "destructive" : "default"}
                size="sm"
                className={cn(
                  "min-w-[100px]",
                  !config.is_active &&
                    "bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600",
                )}
              >
                {config.is_active ? (
                  <>
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Preset Strategies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Quick Preset Strategies
              </h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p>
                    Select a preset to instantly configure your MM agent. Premium presets use advanced psychological
                    triggers.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
              {PRESET_STRATEGIES.map((preset, index) => {
                const PresetIcon = preset.icon
                const isActive =
                  config.buy_amount_eth === preset.config.buy_amount_eth &&
                  config.buy_interval_minutes === preset.config.buy_interval_minutes &&
                  config.sell_interval_minutes === preset.config.sell_interval_minutes &&
                  config.pro_mode === preset.config.pro_mode &&
                  config.max_mode === preset.config.max_mode &&
                  config.profitable_mode === preset.config.profitable_mode &&
                  config.burst_mode === preset.config.burst_mode &&
                  config.fomo_mode === preset.config.fomo_mode

                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      "relative group rounded-xl p-4 sm:p-5 text-left transition-all duration-300",
                      "bg-card/50 backdrop-blur-xl border hover:scale-[1.02] active:scale-[0.98]",
                      "hover:shadow-lg hover:shadow-primary/5",
                      isActive
                        ? "border-emerald-500 bg-emerald-500/10 shadow-emerald-500/20 shadow-lg"
                        : "border-border/50 hover:border-border",
                      preset.isUltimate &&
                        !isActive &&
                        "border-amber-500/30 hover:border-amber-500/60 hover:shadow-amber-500/10",
                      preset.isPremium &&
                        !preset.isUltimate &&
                        !isActive &&
                        "border-purple-500/30 hover:border-purple-500/50",
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Glow effect for premium presets */}
                    {preset.isUltimate && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                    {preset.isPremium && !preset.isUltimate && (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}

                    {/* Badge */}
                    {preset.isUltimate && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-600 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg">
                        ULTIMATE
                      </div>
                    )}
                    {preset.isPremium && !preset.isUltimate && (
                      <div className="absolute -top-1 -right-1 bg-gradient-to-br from-purple-500 to-pink-500 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-lg">
                        PRO
                      </div>
                    )}

                    <div className="relative">
                      {/* Icon */}
                      <div
                        className={cn(
                          "inline-flex p-2.5 rounded-lg bg-gradient-to-br mb-3 transition-transform group-hover:scale-110",
                          preset.color,
                        )}
                      >
                        <PresetIcon className="h-5 w-5 text-white" />
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-semibold text-sm sm:text-base mb-1">{preset.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{preset.description}</p>

                      {/* Features for ultimate preset */}
                      {preset.features && (
                        <div className="space-y-1 mb-3 hidden sm:block">
                          {preset.features.slice(0, 2).map((feature, idx) => (
                            <div key={idx} className="flex items-center text-[10px] text-amber-400/80">
                              <div className="w-1 h-1 rounded-full bg-amber-500 mr-1.5 flex-shrink-0" />
                              <span className="truncate">{feature}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-zinc-500">
                          <span>Buy:</span>
                          <span className="text-zinc-300 font-medium">{preset.config.buy_amount_eth} ETH</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>Interval:</span>
                          <span className="text-zinc-300 font-medium">{preset.config.buy_interval_minutes}m</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>Volume:</span>
                          <span
                            className={cn(
                              "font-medium",
                              preset.expectedVolume === "Maximum" && "text-amber-400",
                              preset.expectedVolume === "Very High" && "text-purple-400",
                              preset.expectedVolume === "High" && "text-rose-400",
                              preset.expectedVolume === "Medium" && "text-orange-400",
                              preset.expectedVolume === "Low" && "text-blue-400",
                            )}
                          >
                            {preset.expectedVolume}
                          </span>
                        </div>

                        {/* Risk indicator */}
                        <div className="flex justify-between items-center text-zinc-500 pt-1">
                          <span>Risk:</span>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <div
                                key={level}
                                className={cn(
                                  "w-2 h-2 rounded-full transition-colors",
                                  level <= preset.riskLevel
                                    ? preset.riskLevel >= 4
                                      ? "bg-amber-500"
                                      : preset.riskLevel >= 3
                                        ? "bg-rose-500"
                                        : preset.riskLevel >= 2
                                          ? "bg-orange-500"
                                          : "bg-blue-500"
                                    : "bg-zinc-700",
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Active indicator */}
                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/30 text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Active
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {config.fomo_mode && (
            <Card
              className={cn(
                "border-2 overflow-hidden transition-all duration-300",
                config.fomo_pattern === "apex_predator"
                  ? "border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent"
                  : "border-purple-500/50 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent",
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {config.fomo_pattern === "apex_predator" ? (
                    <>
                      <div className="relative">
                        <Crown className="h-6 w-6 text-amber-400" />
                        <div className="absolute inset-0 animate-ping">
                          <Crown className="h-6 w-6 text-amber-400/30" />
                        </div>
                      </div>
                      <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent font-bold">
                        Apex Predator Mode Active
                      </span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-6 w-6 text-purple-400" />
                      <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-bold">
                        FOMO Mode Active
                      </span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {[
                    { label: "Pattern", value: config.fomo_pattern?.replace("_", " ") || "Reversal" },
                    { label: "Intensity", value: `${config.fomo_intensity || 7}/10` },
                    { label: "Phases", value: config.fomo_pattern === "apex_predator" ? "10" : "4-5" },
                    { label: "Max Multiplier", value: config.fomo_pattern === "apex_predator" ? "10x" : "4x" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-black/20 backdrop-blur-sm rounded-lg p-3 text-center">
                      <div className="text-[10px] sm:text-xs text-muted-foreground mb-1">{stat.label}</div>
                      <div
                        className={cn(
                          "font-bold text-sm sm:text-base capitalize",
                          config.fomo_pattern === "apex_predator" ? "text-amber-400" : "text-purple-400",
                        )}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Execute Button */}
                <Button
                  onClick={handleFOMOExecution}
                  disabled={isExecutingFOMO || !config.is_active}
                  size="lg"
                  className={cn(
                    "w-full h-14 font-bold text-base transition-all duration-300",
                    config.fomo_pattern === "apex_predator"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 shadow-lg shadow-amber-500/25"
                      : "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 hover:from-purple-400 hover:via-pink-400 hover:to-rose-400 shadow-lg shadow-purple-500/25",
                    isExecutingFOMO && "animate-pulse",
                  )}
                >
                  {isExecutingFOMO ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Executing... {Math.round(fomoProgress)}%
                    </>
                  ) : (
                    <>
                      {config.fomo_pattern === "apex_predator" ? (
                        <Crown className="h-5 w-5 mr-2" />
                      ) : (
                        <Flame className="h-5 w-5 mr-2" />
                      )}
                      Execute {config.fomo_pattern === "apex_predator" ? "Apex Predator" : "FOMO Pattern"}
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isExecutingFOMO && (
                  <div className="space-y-2">
                    <Progress
                      value={fomoProgress}
                      className={cn(
                        "h-3 rounded-full",
                        config.fomo_pattern === "apex_predator"
                          ? "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:via-orange-500 [&>div]:to-red-500"
                          : "[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:via-pink-500 [&>div]:to-rose-500",
                      )}
                    />
                    <p className="text-xs text-center text-muted-foreground animate-pulse">
                      {config.fomo_pattern === "apex_predator"
                        ? `Phase ${Math.ceil(fomoProgress / 10)} of 10: Executing psychological warfare sequence...`
                        : "Deploying FOMO pattern to attract organic buyers..."}
                    </p>
                  </div>
                )}

                {/* Pattern Description */}
                <div
                  className={cn(
                    "text-xs p-3 rounded-lg border",
                    config.fomo_pattern === "apex_predator"
                      ? "bg-amber-500/5 text-amber-200/90 border-amber-500/20"
                      : "bg-purple-500/5 text-purple-200/90 border-purple-500/20",
                  )}
                >
                  {config.fomo_pattern === "apex_predator" ? (
                    <p>
                      <strong className="text-amber-400">Apex Predator</strong> combines all psychological triggers:
                      whale signals (10x buys), momentum cascades, support building, and FOMO amplification in a
                      coordinated 10-phase assault designed to flip sentiment from fear to greed.
                    </p>
                  ) : config.fomo_pattern === "reversal" ? (
                    <p>
                      <strong className="text-purple-400">Dip Reversal Engine</strong> aggressively absorbs sell
                      pressure and converts panic sellers into FOMO buyers as the reversal becomes apparent.
                    </p>
                  ) : config.fomo_pattern === "whale_signal" ? (
                    <p>
                      <strong className="text-purple-400">Whale Signal Mimicry</strong> simulates large whale
                      accumulation patterns that trigger retail FOMO and create viral whale alert moments.
                    </p>
                  ) : (
                    <p>
                      <strong className="text-purple-400">FOMO Pattern</strong> uses proven psychological triggers to
                      create buying pressure and attract organic market participants.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowConfigModal(true)}
                variant="outline"
                className="flex-1 border-border/50 hover:bg-muted/50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Advanced Settings
              </Button>
              <Button
                onClick={() => setShowWalletsModal(true)}
                variant="outline"
                className="flex-1 border-border/50 hover:bg-muted/50"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Wallets & Funding
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleRunCycle}
                disabled={isRunning || !config.is_active}
                size="lg"
                variant="outline"
                className="h-14 border-border/50 hover:border-border bg-transparent"
              >
                <Zap className="h-4 w-4 mr-2" />
                Test Run
              </Button>
              <Button
                onClick={toggleAgent}
                size="lg"
                className={cn(
                  "h-14",
                  config.is_active
                    ? "bg-rose-500 hover:bg-rose-600 text-white"
                    : "bg-emerald-500 hover:bg-emerald-600 text-white",
                )}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Buys" value={stats.totalBuys.toLocaleString()} icon={TrendingUp} trend="up" />
              <StatCard
                label="Total Sells"
                value={stats.totalSells.toLocaleString()}
                icon={TrendingDown}
                trend="down"
              />
              <StatCard
                label="Volume Generated"
                value={`${Number(stats.volumeGenerated).toFixed(4)} ETH`}
                icon={ArrowRightLeft}
                trend="neutral"
              />
            </div>

            {/* Activity Feed */}
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
                      <Activity className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No activity yet</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {activities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Wallets Modal */}
          <Dialog open={showWalletsModal} onOpenChange={setShowWalletsModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
              <div className="p-4 sm:p-6 border-b border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10">
                    <Wallet className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl">Fund Your MM Agent Wallets</DialogTitle>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Send ETH to these addresses to enable market making operations
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <p className="text-xs text-muted-foreground font-medium">ETH Balance</p>
                    <p className="text-base sm:text-lg font-bold mt-1">
                      {aggregateWalletStats.totalEth.toFixed(6)} ETH
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                    <p className="text-xs text-muted-foreground font-medium">{tokenSymbol} Balance</p>
                    <p className="text-base sm:text-lg font-bold mt-1 truncate">
                      {aggregateWalletStats.totalToken.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground">Buys</p>
                    <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                      {aggregateWalletStats.totalBuys}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <p className="text-xs text-muted-foreground">Sells</p>
                    <p className="text-base sm:text-lg font-bold text-rose-400 mt-1">
                      {aggregateWalletStats.totalSells}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFundingWallet(wallets[0])}
                    className="border-emerald-500/30 hover:bg-emerald-500/10 text-xs"
                  >
                    <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                    Fund
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawingWallet(wallets[0])}
                    className="border-blue-500/30 hover:bg-blue-500/10 text-xs"
                  >
                    <ArrowUpFromLine className="h-3.5 w-3.5 mr-1.5" />
                    Withdraw
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSellAll()}
                    className="border-orange-500/30 hover:bg-orange-500/10 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Sell All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportWallets}
                    className="border-rose-500/30 hover:bg-rose-500/10 text-xs bg-transparent"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[50vh] sm:h-[400px]">
                <div className="p-4 sm:p-6 space-y-3">
                  {wallets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Wallet className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm">No wallets found</p>
                    </div>
                  ) : (
                    wallets.map((wallet, index) => (
                      <Card key={wallet.wallet_address} className="bg-card/50 border-border/30 overflow-hidden">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm sm:text-base font-bold text-emerald-400">{index + 1}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs sm:text-sm font-semibold">Wallet {index + 1}</span>
                                  {wallet.is_active && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <code className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-none">
                                    {wallet.wallet_address}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 flex-shrink-0"
                                    onClick={() => {
                                      navigator.clipboard.writeText(wallet.wallet_address)
                                      toast.success("Address copied!")
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 rounded bg-muted/30">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">ETH Balance</p>
                              <p className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
                                {(wallet.eth_balance ? Number.parseFloat(wallet.eth_balance) : 0).toFixed(6)} ETH
                              </p>
                            </div>
                            <div className="p-2 rounded bg-muted/30">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">{tokenSymbol} Balance</p>
                              <p className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
                                {(wallet.token_balance ? Number.parseFloat(wallet.token_balance) : 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Buys</p>
                              <p className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                                {wallet.total_buys || 0}
                              </p>
                            </div>
                            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                              <p className="text-[10px] sm:text-xs text-muted-foreground">Sells</p>
                              <p className="text-sm sm:text-base font-bold text-rose-400 mt-0.5">
                                {wallet.total_sells || 0}
                              </p>
                            </div>
                          </div>

                          <a
                            href={`https://basescan.org/address/${wallet.wallet_address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mb-3"
                          >
                            View on Basescan
                            <ExternalLink className="h-3 w-3" />
                          </a>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setFundingWallet(wallet)}
                              className="border-emerald-500/30 text-xs h-8"
                            >
                              <ArrowDownToLine className="h-3 w-3 mr-1" />
                              Fund
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setWithdrawingWallet(wallet)}
                              className="border-blue-500/30 text-xs h-8"
                            >
                              <ArrowUpFromLine className="h-3 w-3 mr-1" />
                              Withdraw
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSellAll(wallet)}
                              disabled={isSellingAll}
                              className="border-orange-500/30 text-xs h-8 col-span-2"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Sell All
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>

          {/* Fund Wallet Modal */}
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
                  <Button
                    variant="outline"
                    onClick={() => setFundAmount("0.01")}
                    className="bg-zinc-900 border-zinc-800"
                  >
                    0.01 ETH
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFundAmount("0.05")}
                    className="bg-zinc-900 border-zinc-800"
                  >
                    0.05 ETH
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFundAmount("0.1")}
                    className="bg-zinc-900 border-zinc-800"
                  >
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

          {/* Withdraw Modal */}
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

          {/* Config Modal */}
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
                        setConfig({
                          ...config,
                          pro_mode: checked,
                          active_wallets: checked ? 10 : config.max_mode ? 20 : 5,
                        })
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
                        setConfig({
                          ...config,
                          max_mode: checked,
                          active_wallets: checked ? 20 : config.pro_mode ? 10 : 5,
                        })
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

                  {/* Burst Mode */}
                  <div className="p-4 rounded-lg border-2 border-orange-500/20 bg-orange-500/5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-sm">Burst Mode</p>
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
                          <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                            Delay (seconds)
                          </label>
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

                <div className="p-4 rounded-lg border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-rose-500/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <p className="font-medium text-sm">FOMO Mode</p>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30"
                        >
                          Ultimate Strategy
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Psychological patterns that create buying pressure & reverse dips
                      </p>
                    </div>
                    <Switch
                      checked={config.fomo_mode}
                      onCheckedChange={async (checked) => {
                        setConfig({ ...config, fomo_mode: checked })
                        try {
                          await fetch("/api/agents/mm/config", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              agentId: config.id,
                              fomo_mode: checked,
                              fomo_intensity: config.fomo_intensity || 7,
                              fomo_pattern: config.fomo_pattern || "reversal",
                            }),
                          })
                          toast.success(checked ? "FOMO Mode activated!" : "FOMO Mode disabled", {
                            description: checked ? "Psychological trading patterns enabled" : undefined,
                          })
                          mutate(`/api/agents/mm/config?ownerAddress=${address}`)
                        } catch (error) {
                          toast.error("Failed to update mode")
                        }
                      }}
                    />
                  </div>

                  {config.fomo_mode && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-purple-500/20">
                      {/* Pattern Selection */}
                      <div>
                        <label className="text-xs font-medium mb-2 block text-muted-foreground flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          FOMO Pattern
                        </label>
                        <Select
                          value={config.fomo_pattern || "reversal"}
                          onValueChange={async (value) => {
                            setConfig({ ...config, fomo_pattern: value })
                            try {
                              await fetch("/api/agents/mm/config", {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  agentId: config.id,
                                  fomo_pattern: value,
                                }),
                              })
                              const pattern = FOMO_PATTERNS[value]
                              toast.success(`Pattern: ${pattern?.name}`, {
                                description: pattern?.psychologicalTrigger,
                              })
                            } catch (error) {
                              toast.error("Failed to update pattern")
                            }
                          }}
                        >
                          <SelectTrigger className="bg-background/50 border-purple-500/20">
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FOMO_PATTERNS).map(([key, pattern]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{pattern.name}</span>
                                  <span className="text-xs text-muted-foreground">{pattern.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {config.fomo_pattern && FOMO_PATTERNS[config.fomo_pattern] && (
                          <p className="text-xs text-purple-300/70 mt-2 italic">
                            "{FOMO_PATTERNS[config.fomo_pattern].psychologicalTrigger}"
                          </p>
                        )}
                      </div>

                      {/* Intensity Slider */}
                      <div>
                        <label className="text-xs font-medium mb-2 block text-muted-foreground flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          Intensity Level: {config.fomo_intensity || 7}/10
                        </label>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">Subtle</span>
                          <Input
                            type="range"
                            min="1"
                            max="10"
                            value={config.fomo_intensity || 7}
                            onChange={async (e) => {
                              const value = Number(e.target.value)
                              setConfig({ ...config, fomo_intensity: value })
                              try {
                                await fetch("/api/agents/mm/config", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    agentId: config.id,
                                    fomo_intensity: value,
                                  }),
                                })
                              } catch (error) {
                                // Silent update
                              }
                            }}
                            className="h-2 flex-1 accent-purple-500"
                          />
                          <span className="text-xs text-muted-foreground">Maximum</span>
                        </div>
                      </div>

                      {/* Pattern Info Card */}
                      {config.fomo_pattern && FOMO_PATTERNS[config.fomo_pattern] && (
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                          <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-purple-300">Expected Impact</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {FOMO_PATTERNS[config.fomo_pattern].expectedImpact}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                                  {FOMO_PATTERNS[config.fomo_pattern].phases.length} Phases
                                </Badge>
                                <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-300">
                                  {FOMO_PATTERNS[config.fomo_pattern].phases.reduce((acc, p) => acc + p.duration, 0)}{" "}
                                  min duration
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Execute FOMO Button */}
                      <Button
                        onClick={handleFOMOExecution}
                        disabled={isExecutingFOMO || !config.is_active}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:via-pink-500 hover:to-rose-500 text-white border-0"
                      >
                        {isExecutingFOMO ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Executing FOMO Pattern...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Execute {FOMO_PATTERNS[config.fomo_pattern || "reversal"]?.name || "FOMO Pattern"}
                          </>
                        )}
                      </Button>

                      {isExecutingFOMO && (
                        <div className="space-y-1">
                          <Progress value={fomoProgress} className="h-1.5" />
                          <p className="text-xs text-center text-muted-foreground">
                            Executing psychological trading pattern...
                          </p>
                        </div>
                      )}
                    </div>
                  )}
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
                          fomo_intensity: config.fomo_intensity, // Added
                          fomo_pattern: config.fomo_pattern, // Added
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
      </TooltipProvider>
    )
  }

  // All dialogs are now within the 'if (config)' block, so this return is no longer needed.
}
