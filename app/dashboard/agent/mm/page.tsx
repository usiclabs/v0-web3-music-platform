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
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"
import { toast } from "sonner"
import { useWalletClient, usePublicClient, useAccount } from "wagmi"
import { parseEther, formatEther, formatUnits, parseUnits } from "viem"
import confetti from "canvas-confetti"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MMV4PoolDetector } from "@/components/mm-v4-pool-detector"
import { MMV4SwapPanel } from "@/components/mm-v4-swap-panel"
import { MMV4SwapHistory } from "@/components/mm-v4-swap-history"

// Mock ABI and Address for ERC20 interactions
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const
const USI_TOKEN_ADDRESS = "0x987603A52d8B966E10FBD29DcB1A574049E25B07" // Example USI token address

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
  const { connect, isConnected, address } = useWallet()
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
  const [fundingTokenType, setFundingTokenType] = useState<"eth" | "usi">("eth")
  const [usiBalance, setUsiBalance] = useState("0")
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

  const [useCustomToken, setUseCustomToken] = useState(false)
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [userUSIBalance, setUserUSIBalance] = useState(0n)
  const [exportingWalletIndex, setExportingWalletIndex] = useState<number | null>(null)

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
      // Initialize custom token state based on fetched config
      if (configData.config.token_address && configData.config.token_address !== USI_TOKEN_ADDRESS) {
        setUseCustomToken(true)
        setCustomTokenAddress(configData.config.token_address)
      } else {
        setUseCustomToken(false)
        setCustomTokenAddress("")
      }
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
      const fetchWallets = () => {
        console.log("[v0] Fetching agent wallets:", config.id)
        fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
          .then((res) => res.json())
          .then((data) => {
            console.log("[v0] Wallets data received:", data.wallets)
            if (data.wallets) {
              setWallets(data.wallets)
            }
          })
          .catch((error) => console.error("Failed to load wallets:", error))
      }

      // Initial fetch
      fetchWallets()

      const interval = setInterval(fetchWallets, 30000)

      return () => clearInterval(interval)
    }
  }, [showWalletsModal, config?.id])

  useEffect(() => {
    if (fundingWallet && wagmiAddress && publicClient) {
      publicClient.getBalance({ address: wagmiAddress }).then((balance) => {
        setConnectedWalletBalance(formatEther(balance))
      })
    }
  }, [fundingWallet, wagmiAddress, publicClient])

  useEffect(() => {
    if (wagmiAddress && publicClient) {
      // Fetch USI token balance
      publicClient
        .readContract({
          address: USI_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wagmiAddress as `0x${string}`],
        })
        .then((balance) => {
          setUsiBalance(formatUnits(balance as bigint, 18))
        })
        .catch((error) => {
          console.error("Failed to fetch USI balance:", error)
        })
    }
  }, [wagmiAddress, publicClient])

  useEffect(() => {
    const checkUSIBalance = async () => {
      if (!address || !publicClient) return
      try {
        const balance = await publicClient.readContract({
          address: USI_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address as `0x${string}`],
        })
        setUserUSIBalance(balance)
      } catch (error) {
        console.error("[v0] Failed to check USI balance:", error)
      }
    }
    checkUSIBalance()
  }, [address, publicClient])

  const canUseCustomToken = true // Allow all users to use custom token targets regardless of USI holdings

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
      let hash: `0x${string}`

      if (fundingTokenType === "eth") {
        hash = await walletClient.sendTransaction({
          to: fundingWallet.wallet_address as `0x${string}`,
          value: parseEther(fundAmount),
        })

        toast.success("ETH Transfer Sent!", {
          description: `Funding wallet ${fundingWallet.wallet_index} with ${fundAmount} ETH`,
        })
      } else {
        const usiAmount = parseUnits(fundAmount, 18)

        hash = await walletClient.writeContract({
          address: USI_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [fundingWallet.wallet_address as `0x${string}`, usiAmount],
        })

        toast.success("USI Transfer Sent!", {
          description: `Funding wallet ${fundingWallet.wallet_index} with ${fundAmount} USI`,
        })
      }

      setFundingWallet(null)
      setFundAmount("")
      setFundingTokenType("eth")

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
        description: error.message || `Failed to send ${fundingTokenType.toUpperCase()}`,
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

  const handleCustomTokenUpdate = async (tokenAddress: string) => {
    if (!tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error("Invalid token address format")
      return
    }

    setCustomTokenAddress(tokenAddress)
    try {
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          token_address: tokenAddress,
          token_symbol: "CUSTOM",
        }),
      })
      toast.success("Custom token configured")
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
    } catch (error) {
      toast.error("Failed to update custom token")
    }
  }

  const handleExportPrivateKey = async (walletIndex: number, walletAddress: string) => {
    if (!address) {
      toast.error("Please connect wallet first")
      return
    }

    if (!config?.id) {
      toast.error("Agent configuration not loaded")
      return
    }

    try {
      setExportingWalletIndex(walletIndex)
      console.log("[v0] Exporting private key for wallet index:", walletIndex, "agentId:", config.id)

      const response = await fetch("/api/agents/mm/wallets/export-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletIndex,
          ownerAddress: address,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Export key failed with status:", response.status, "error:", data.error)
        throw new Error(data.error || "Failed to export key")
      }

      const { privateKey } = data

      const fileContent = `PRIVATE KEY FOR WALLET ${walletIndex}\nAddress: ${walletAddress}\nPrivate Key: ${privateKey}\n\nIMPORTANT: Keep this private key secure and never share it with anyone!`
      const blob = new Blob([fileContent], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `wallet-${walletIndex}-${walletAddress.slice(0, 6)}-private-key.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success(`Private key downloaded for wallet ${walletIndex} (${walletAddress.slice(0, 6)}...)`)
    } catch (error: any) {
      console.error("[v0] Failed to export private key:", error.message)
      toast.error(error.message || "Failed to export private key")
    } finally {
      setExportingWalletIndex(null)
    }
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

  const tokenAddress = config?.token_address || USI_TOKEN_ADDRESS
  const tokenSymbol = config?.token_symbol || "USI"

  const stats = statsData?.stats || {
    totalBuys: 0,
    totalSells: 0,
    volumeGenerated: "0",
    usiBalance: "0",
  }

  const aggregateWalletStats = wallets.reduce(
    (acc, wallet) => ({
      totalEth: acc.totalEth + (wallet.eth_balance ? Number.parseFloat(wallet.eth_balance) : 0),
      totalToken: acc.totalToken + (wallet.token_balance ? Number.parseFloat(wallet.token_balance) : 0),
      totalBuys: acc.totalBuys + (wallet.total_buys || 0),
      totalSells: acc.totalSells + (wallet.total_sells || 0),
    }),
    { totalEth: 0, totalToken: 0, totalBuys: 0, totalSells: 0 },
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center backdrop-blur">
                <BarChart3 className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold">{tokenSymbol} Market Maker</h1>
                <LiveIndicator active={config.is_active} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size={isMobile ? "icon" : "default"}
                onClick={() => setShowWalletsModal(true)}
                className="border-border/50"
              >
                <Wallet2 className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Wallets</span>}
              </Button>
              <Button
                variant="outline"
                size={isMobile ? "icon" : "default"}
                onClick={() => setShowConfigModal(true)}
                className="border-border/50"
              >
                <Settings className="h-4 w-4" />
                {!isMobile && <span className="ml-2">Config</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
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
          <StatCard label="Total Sells" value={stats.totalSells.toLocaleString()} icon={TrendingDown} trend="down" />
          <StatCard
            label="Volume Generated"
            value={`${Number(stats.volumeGenerated).toFixed(4)} ETH`}
            icon={ArrowRightLeft}
            trend="neutral"
          />
        </div>

        {/* Uniswap V4 Pool Support Section */}
        <div className="border-t border-border/50 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Uniswap V4 Pool Support</h2>
            <Badge className="bg-blue-500/20 text-blue-300">Beta</Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MMV4PoolDetector />
            {config?.token_address && (
              <MMV4SwapPanel
                agentId={config.id}
                ownerAddress={config.owner_address || address || ""}
                tokenAddress={config.token_address}
                walletIndex={1}
              />
            )}
          </div>

          {/* V4 Swap History */}
          {config?.id && (
            <div className="mt-4">
              <MMV4SwapHistory agentId={config.id} />
            </div>
          )}
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
                <p className="text-base sm:text-lg font-bold mt-1">{aggregateWalletStats.totalEth.toFixed(6)} ETH</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border border-border/30">
                <p className="text-xs text-muted-foreground font-medium">{tokenSymbol} Balance</p>
                <p className="text-base sm:text-lg font-bold mt-1 truncate">
                  {aggregateWalletStats.totalToken.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-xs text-muted-foreground">Buys</p>
                <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">{aggregateWalletStats.totalBuys}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-muted-foreground">Sells</p>
                <p className="text-base sm:text-lg font-bold text-rose-400 mt-1">{aggregateWalletStats.totalSells}</p>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExportPrivateKey(wallet.wallet_index, wallet.wallet_address)}
                          disabled={exportingWalletIndex === wallet.wallet_index}
                          className="text-xs"
                          title="Export private key for wallet recovery"
                        >
                          {exportingWalletIndex === wallet.wallet_index ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Exporting...
                            </>
                          ) : (
                            <>
                              <Download className="h-3 w-3 mr-1" />
                              Export Key
                            </>
                          )}
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

      {/* Updated fund wallet dialog with token type selection */}
      <Dialog open={!!fundingWallet} onOpenChange={() => setFundingWallet(null)}>
        <DialogContent className="bg-black/95 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Fund Wallet {fundingWallet?.wallet_index}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Token Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={fundingTokenType === "eth" ? "default" : "outline"}
                  onClick={() => {
                    setFundingTokenType("eth")
                    setFundAmount("")
                  }}
                  className={fundingTokenType === "eth" ? "" : "bg-zinc-900 border-zinc-800"}
                >
                  ETH
                </Button>
                <Button
                  variant={fundingTokenType === "usi" ? "default" : "outline"}
                  onClick={() => {
                    setFundingTokenType("usi")
                    setFundAmount("")
                  }}
                  className={fundingTokenType === "usi" ? "" : "bg-zinc-900 border-zinc-800"}
                >
                  USI
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Amount ({fundingTokenType.toUpperCase()})</Label>
              <Input
                type="number"
                step={fundingTokenType === "usi" ? "0.01" : "0.001"}
                placeholder={fundingTokenType === "usi" ? "100" : "0.1"}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
              <p className="text-xs text-zinc-400 mt-2">
                Your balance:{" "}
                {fundingTokenType === "eth"
                  ? `${Number(connectedWalletBalance).toFixed(4)} ETH`
                  : `${Number(usiBalance).toFixed(2)} USI`}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {fundingTokenType === "eth" ? (
                <>
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
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setFundAmount("50")} className="bg-zinc-900 border-zinc-800">
                    50 USI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFundAmount("100")}
                    className="bg-zinc-900 border-zinc-800"
                  >
                    100 USI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setFundAmount("500")}
                    className="bg-zinc-900 border-zinc-800"
                  >
                    500 USI
                  </Button>
                </>
              )}
            </div>

            <Button onClick={handleFundWallet} disabled={isFunding || !fundAmount} className="w-full">
              {isFunding ? "Sending..." : `Transfer ${fundingTokenType.toUpperCase()}`}
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
              <div className="grid grid-cols-2 gap-3 mb-4">
                {SUPPORTED_TOKENS.map((token) => (
                  <button
                    key={token.address}
                    onClick={async () => {
                      setUseCustomToken(false)
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
                      !useCustomToken && config.token_address === token.address
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <p className="font-semibold">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground mt-1">{token.name}</p>
                  </button>
                ))}
              </div>

              {canUseCustomToken && (
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Custom Token</p>
                      <p className="text-xs text-muted-foreground mt-1">Enter any ERC20 token address</p>
                    </div>
                    <Switch checked={useCustomToken} onCheckedChange={setUseCustomToken} />
                  </div>

                  {useCustomToken && (
                    <div className="space-y-2">
                      <Input
                        placeholder="0x..."
                        value={customTokenAddress}
                        onChange={(e) => setCustomTokenAddress(e.target.value)}
                        className="font-mono text-xs"
                      />
                      <Button
                        onClick={() => handleCustomTokenUpdate(customTokenAddress)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Sparkles className="h-3 w-3 mr-2" />
                        Configure Custom Token
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
                      token_address: config.token_address, // Ensure token address is saved
                      token_symbol: config.token_symbol, // Ensure token symbol is saved
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
