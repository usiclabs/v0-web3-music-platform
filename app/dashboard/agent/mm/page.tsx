"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Loader2,
  Save,
  Radio,
  BarChart3,
  Zap,
  Timer,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRightLeft,
  Users,
  Plus,
  Copy,
  ExternalLink,
  Settings,
  PlayCircle,
  PauseCircle,
  Sparkles,
  ArrowDownToLine,
  ArrowUpFromLine,
  Key,
  AlertTriangle,
  Eye,
  EyeOff,
  Repeat,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { toast } from "sonner"
import { useWalletClient, usePublicClient, useAccount } from "wagmi" // Added wagmi hooks
import { parseEther, formatEther } from "viem" // Added viem functions
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import confetti from "canvas-confetti"

interface StrategyPreset {
  id: string
  name: string
  description: string
  icon: string
  config: {
    buy_amount_eth: string
    buy_interval_minutes: number
    sell_interval_minutes: number
  }
  chartPattern: string
}

const STRATEGY_PRESETS: StrategyPreset[] = [
  {
    id: "bull_flag",
    name: "Bull Flag",
    description: "Creates an upward price channel with higher lows and steady accumulation",
    icon: "📈",
    config: {
      buy_amount_eth: "0.001",
      buy_interval_minutes: 3,
      sell_interval_minutes: 15,
    },
    chartPattern: "Frequent buys with occasional sells to build upward momentum",
  },
  {
    id: "accumulation",
    name: "Accumulation Zone",
    description: "Builds a sideways consolidation range with balanced buying and selling",
    icon: "📊",
    config: {
      buy_amount_eth: "0.0008",
      buy_interval_minutes: 5,
      sell_interval_minutes: 5,
    },
    chartPattern: "Equal buy/sell frequency to create horizontal support/resistance",
  },
  {
    id: "breakout",
    name: "Breakout Setup",
    description: "Aggressive buying with minimal selling to simulate breakout momentum",
    icon: "🚀",
    config: {
      buy_amount_eth: "0.0015",
      buy_interval_minutes: 2,
      sell_interval_minutes: 20,
    },
    chartPattern: "Rapid buying with rare sells to create explosive upward movement",
  },
  {
    id: "organic",
    name: "Organic Growth",
    description: "Natural-looking growth with varied timing and balanced activity",
    icon: "🌱",
    config: {
      buy_amount_eth: "0.0005",
      buy_interval_minutes: 8,
      sell_interval_minutes: 12,
    },
    chartPattern: "Moderate pace with natural-looking volatility and progression",
  },
  {
    id: "whale_activity",
    name: "Whale Activity",
    description: "Larger, less frequent trades to simulate institutional buying",
    icon: "🐋",
    config: {
      buy_amount_eth: "0.003",
      buy_interval_minutes: 15,
      sell_interval_minutes: 30,
    },
    chartPattern: "Large infrequent buys with minimal sells for strong support",
  },
]

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
  pro_mode?: boolean // Added pro_mode
  profitable_mode?: boolean // Add profitable_mode field
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
  id: string // Added id for react key
  address: string
  wallet_address: string // Added for modal
  buys: number
  sells: number
  usiBalance: string
  eth_balance?: string // Added for modal
  token_balance?: string // Added for modal
  total_buys?: number // Added for modal
  total_sells?: number // Added for modal
  is_active?: boolean // Added for modal
  wallet_index: number // Added for modal
}

interface MMActivity {
  id: string
  activity_type: string
  description: string
  metadata?: any
  created_at: string
}

function LivePulse({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-lg shadow-emerald-500/50" />
    </span>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes("buy")) {
    return <TrendingUp className="w-4 h-4 text-emerald-400" />
  }
  if (type.includes("sell")) {
    return <TrendingDown className="w-4 h-4 text-rose-400" />
  }
  if (type.includes("error") || type.includes("failed")) {
    return <XCircle className="w-4 h-4 text-rose-400" />
  }
  if (type.includes("completed")) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  }
  return <Activity className="w-4 h-4 text-blue-400" />
}

export default function MarketMakerAgentPage() {
  const { address, isConnected } = useWallet()
  const { data: walletClient } = useWalletClient() // Wagmi hook
  const publicClient = usePublicClient() // Wagmi hook
  // Use useAccount from wagmi
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount()

  // Added state for funding modal
  const [fundingWallet, setFundingWallet] = useState<any>(null)
  const [fundAmount, setFundAmount] = useState("")
  const [connectedWalletBalance, setConnectedWalletBalance] = useState("0")
  const [isFunding, setIsFunding] = useState(false)
  const [fundingAsset, setFundingAsset] = useState<"ETH" | "USI">("ETH")
  const [connectedWalletUsiBalance, setConnectedWalletUsiBalance] = useState("0")

  // Added state for withdraw modal
  const [withdrawWallet, setWithdrawWallet] = useState<any>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  // Added state for export key modal
  const [exportWallet, setExportWallet] = useState<any>(null)
  const [exportedKey, setExportedKey] = useState("")
  const [showKey, setShowKey] = useState(false) // Fixed: declared showKey
  const [isExporting, setIsExporting] = useState(false)

  const [sellAllWallet, setSellAllWallet] = useState<any>(null)
  const [sellAllLoading, setSellAllLoading] = useState(false)
  const [isResettingAll, setIsResettingAll] = useState(false)
  const walletAddress = wagmiAddress // Renamed for clarity

  const [burstLoading, setBurstLoading] = useState(false)
  const [burstCount, setBurstCount] = useState(5)
  const [burstDelay, setBurstDelay] = useState(3)

  const handleSellAll = async (wallet: any) => {
    if (!config?.id) return

    setSellAllLoading(true)
    try {
      const response = await fetch("/api/agents/mm/wallets/sell-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletNumber: wallet.wallet_index, // Pass the actual wallet index (1-5)
          ownerAddress: walletAddress,
        }),
      })

      const data = await response.json()

      if (data.success || data.partialSuccess) {
        toast.success("Sell All Successful", {
          description: data.message || "All USI tokens have been converted to ETH",
        })

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6ee7b7"],
        })

        // Refresh wallets
        const walletsResponse = await fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
        const walletsData = await walletsResponse.json()
        if (walletsData.wallets) {
          setWallets(walletsData.wallets)
        }

        setSellAllWallet(null)
      } else {
        throw new Error(data.error || "Failed to sell tokens")
      }
    } catch (error: any) {
      console.error("[v0] Sell all error:", error)
      toast.error("Sell Failed", {
        description: error.message || "Failed to convert tokens to ETH",
      })
    } finally {
      setSellAllLoading(false)
    }
  }

  const handleResetAllWallets = async () => {
    if (!config?.id || !wallets.length) return

    setIsResettingAll(true)
    let successCount = 0
    let failCount = 0

    try {
      // Process each wallet sequentially
      for (const wallet of wallets) {
        // Skip if wallet has no USI balance
        if (!wallet.token_balance || wallet.token_balance <= 0) {
          continue
        }

        try {
          const response = await fetch("/api/agents/mm/wallets/sell-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId: config.id,
              walletNumber: wallet.wallet_index,
              ownerAddress: walletAddress,
            }),
          })

          const data = await response.json()

          if (data.success || data.partialSuccess) {
            successCount++
          } else {
            failCount++
          }

          // Add small delay between transactions
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } catch (error) {
          console.error(`[v0] Failed to sell wallet ${wallet.wallet_index}:`, error)
          failCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success("Reset Complete", {
          description: `Successfully reset ${successCount} wallet${successCount > 1 ? "s" : ""}${failCount > 0 ? `. ${failCount} failed.` : ""}`,
        })

        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f59e0b"],
          scalar: 1.2,
        })
      } else {
        toast.error("Reset Failed", {
          description: "No wallets were successfully reset",
        })
      }

      // Refresh wallets
      const walletsResponse = await fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
      const walletsData = await walletsResponse.json()
      if (walletsData.wallets) {
        setWallets(walletsData.wallets)
      }
    } catch (error: any) {
      console.error("[v0] Reset all error:", error)
      toast.error("Reset Failed", {
        description: error.message || "Failed to reset wallets",
      })
    } finally {
      setIsResettingAll(false)
    }
  }

  const [config, setConfig] = useState<MMAgentConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const buyIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sellIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [wallets, setWallets] = useState<any[]>([])

  // Added showStrategies state
  const [showStrategies, setShowStrategies] = useState(false)

  const isMobile = useIsMobile()

  const {
    data: configData,
    error: configError,
    isLoading: isLoadingConfig,
  } = useSWR<{ config: MMAgentConfig }>(address ? `/api/agents/mm/config?ownerAddress=${address}` : null, (url) =>
    fetch(url).then((res) => res.json()),
  )

  // Helper to update config state and then save
  const updateConfig = async (newConfigPartial: Partial<MMAgentConfig>) => {
    if (!config) return
    const updatedConfig = { ...config, ...newConfigPartial }
    setConfig(updatedConfig)

    // Debounce or throttle this to prevent too many API calls
    // For now, let's just save immediately for simplicity
    try {
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          ...newConfigPartial,
        }),
      })
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      toast.success("Configuration updated!")
    } catch (error) {
      console.error("Failed to update config:", error)
      toast.error("Failed to update configuration")
      // Revert if save fails
      setConfig(config)
    }
  }

  const [saving, setSaving] = useState(false) // Renamed isSaving to saving for consistency

  useEffect(() => {
    if (configData?.config) {
      setConfig(configData.config)
    }
  }, [configData])

  const { data: statsData } = useSWR<{ stats: MMStats }>(
    config?.id ? `/api/agents/mm/stats?agentId=${config.id}` : null,
    (url) => fetch(url).then((res) => res.json()),
    { refreshInterval: 10000 }, // Refresh every 10 seconds
  )

  const [activities, setActivities] = useState<MMActivity[]>([])

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

    // Subscribe to realtime updates
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

  // CHANGE: Fetch connected wallet balances when funding modal opens
  useEffect(() => {
    if (fundingWallet && wagmiAddress && publicClient) {
      // Fetch ETH balance
      publicClient.getBalance({ address: wagmiAddress }).then((balance) => {
        setConnectedWalletBalance(formatEther(balance))
      })

      // Fetch USI balance using publicClient instead of walletClient
      const USI_TOKEN_ADDRESS = "0x987603A52d8B966E10FBD29DcB1A574049E25B07"
      const ERC20_ABI = [
        {
          inputs: [{ name: "account", type: "address" }],
          name: "balanceOf",
          outputs: [{ name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        },
      ] as const

      publicClient
        .readContract({
          address: USI_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [wagmiAddress],
        })
        .then((balance) => {
          setConnectedWalletUsiBalance(formatEther(balance as bigint))
        })
        .catch((error) => {
          console.error("[v0] Error fetching USI balance:", error)
          setConnectedWalletUsiBalance("0")
        })
    }
  }, [fundingWallet, wagmiAddress, walletClient, publicClient])

  useEffect(() => {
    console.log("[v0] Fund wallets modal opened, loading wallets for agent:", config?.id)
    if (showWalletModal && config?.id) {
      fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("[v0] Wallets API response:", data)
          if (data.wallets) {
            console.log("[v0] Setting wallets:", data.wallets)
            setWallets(data.wallets)
          }
        })
        .catch((error) => console.error("[v0] Failed to load wallets:", error))
    }
  }, [showWalletModal, config?.id])

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
    } catch (error) {
      console.error("Failed to toggle agent:", error)
      setConfig({ ...config, is_active: !newIsActive })
    }
  }

  const handleSaveConfig = async () => {
    if (!config) return

    setIsSaving(true) // UsesetIsSaving for this specific action
    try {
      const response = await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          buy_amount_eth: config.buy_amount_eth,
          buy_interval_minutes: config.buy_interval_minutes,
          sell_interval_minutes: config.sell_interval_minutes,
          multi_wallet_mode: config.multi_wallet_mode,
          active_wallets: config.active_wallets,
          pro_mode: config.pro_mode,
          profitable_mode: config.profitable_mode, // Include profitable_mode
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }

      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      toast.success("Configuration saved!")
    } catch (error) {
      console.error("Failed to save config:", error)
      toast.error("Failed to save configuration")
    } finally {
      setIsSaving(false)
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
        toast.success(`Cycle completed!`, {
          description: data.messages.join("\n"),
        })
        mutate(`/api/agents/mm/stats?agentId=${config.id}`)
      } else {
        toast.error(`Cycle failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to run cycle:", error)
      toast.error("Failed to run cycle")
    } finally {
      setIsRunning(false)
    }
  }

  const toggleMultiWallet = async () => {
    if (!config) return

    const newMultiWallet = !config.multi_wallet_mode
    const numWallets = newMultiWallet ? 5 : 1

    try {
      // Just update the configuration
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          multi_wallet_mode: newMultiWallet,
          active_wallets: numWallets,
        }),
      })

      setConfig({ ...config, multi_wallet_mode: newMultiWallet, active_wallets: numWallets })
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      mutate(`/api/agents/mm/stats?agentId=${config.id}`)
      toast.success("Multi-wallet mode updated")
    } catch (error) {
      console.error("Failed to toggle multi-wallet:", error)
      toast.error("Failed to update multi-wallet mode")
    }
  }

  const toggleProfitableMode = async () => {
    if (!config) return

    const newProfitableMode = !config.profitable_mode

    try {
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          profitable_mode: newProfitableMode,
        }),
      })

      setConfig({ ...config, profitable_mode: newProfitableMode })
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      toast.success(
        newProfitableMode ? "Profitable Mode enabled - only selling at >10% profit" : "Profitable Mode disabled",
      )
    } catch (error) {
      console.error("Failed to toggle profitable mode:", error)
      toast.error("Failed to update profitable mode")
    }
  }

  const toggleProMode = async () => {
    if (!config) return

    const newProMode = !config.pro_mode

    try {
      const response = await fetch("/api/agents/mm/pro-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          ownerAddress: address,
          enabled: newProMode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to toggle pro mode")
      }

      // Refresh config and wallets
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      mutate(`/api/agents/mm/wallets?agentId=${config.id}`)
      mutate(`/api/agents/mm/stats?agentId=${config.id}`)

      toast.success(newProMode ? "Pro mode enabled! 10 wallets ready." : "Pro mode disabled, using 5 wallets")
    } catch (error: any) {
      console.error("Failed to toggle pro mode:", error)
      toast.error(error.message || "Failed to toggle pro mode")
    }
  }

  const handleCreateAgent = async () => {
    if (!address) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/agents/mm/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          tokenAddress: "0x987603A52d8B966E10FBD29DcB1A574049E25B07",
          tokenSymbol: "USI",
          buyAmountEth: "0.0001",
          buyInterval: 5,
          sellInterval: 10,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create agent")
      }

      // Refresh config
      mutate(`/api/agents/mm/config?ownerAddress=${address}`)

      toast.success(`Agent created successfully!`, {
        description: `${data.wallets.length} wallets generated. Please fund your wallets to start market making.`,
      })
    } catch (error: any) {
      console.error("Failed to create agent:", error)
      toast.error(`Failed to create agent: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!")
  }

  const handleFundWallet = async () => {
    if (!fundingWallet || !walletClient || !wagmiAddress || !fundAmount) return

    setIsFunding(true)
    try {
      const amount = parseEther(fundAmount)
      let txHash: string

      if (fundingAsset === "ETH") {
        // Send ETH directly
        txHash = await walletClient.sendTransaction({
          to: fundingWallet.wallet_address as `0x${string}`,
          value: amount,
        })
        console.log("[v0] ETH funding transaction sent:", txHash)
      } else {
        // Send USI tokens
        const USI_TOKEN_ADDRESS = "0x987603A52d8B966E10FBD29DcB1A574049E25B07"
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
          address: USI_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [fundingWallet.wallet_address as `0x${string}`, amount],
        })
        console.log("[v0] USI funding transaction sent:", txHash)
      }

      // Record the funding
      await fetch("/api/agents/mm/wallets/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config?.id,
          walletAddress: fundingWallet.wallet_address,
          txHash,
          asset: fundingAsset,
        }),
      })

      toast.success("Funding Successful", {
        description: `Sent ${fundAmount} ${fundingAsset} to Wallet ${fundingWallet.wallet_index}`,
      })

      setFundingWallet(null)
      setFundAmount("")
      setFundingAsset("ETH")

      // Reload wallets
      if (config?.id) {
        fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.wallets) setWallets(data.wallets)
          })
      }
    } catch (error: any) {
      console.error("[v0] Funding failed:", error)
      toast.error("Funding Failed", {
        description: error.message || "Failed to send transaction",
      })
    } finally {
      setIsFunding(false)
    }
  }

  const handleWithdraw = async (type: "eth" | "usi") => {
    if (!withdrawWallet || !wagmiAddress || !config?.id) return

    setIsWithdrawing(true)
    try {
      const response = await fetch("/api/agents/mm/wallets/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletIndex: withdrawWallet.wallet_index,
          recipientAddress: wagmiAddress,
          ownerAddress: wagmiAddress,
          withdrawType: type,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Withdraw failed")
      }

      toast.success("Withdraw Successful", {
        description: `${type.toUpperCase()} withdrawn to your wallet`,
      })

      setWithdrawWallet(null)

      // Reload wallets
      if (config?.id) {
        fetch(`/api/agents/mm/wallets?agentId=${config.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.wallets) setWallets(data.wallets)
          })
      }
    } catch (error: any) {
      console.error("[v0] Withdraw failed:", error)
      toast.error("Withdraw Failed", {
        description: error.message || "Failed to withdraw",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleExportKey = async () => {
    if (!exportWallet || !wagmiAddress || !config?.id) return

    setIsExporting(true)
    try {
      const response = await fetch("/api/agents/mm/wallets/export-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          walletIndex: exportWallet.wallet_index,
          ownerAddress: wagmiAddress,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Export failed")
      }

      setExportedKey(data.privateKey)
    } catch (error: any) {
      console.error("[v0] Export failed:", error)
      toast.error("Export Failed", {
        description: error.message || "Failed to export key",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleBurstMode = async () => {
    if (!config?.id || !address) {
      toast.error("Please connect wallet and enable MM agent")
      return
    }

    setBurstLoading(true)
    try {
      // Update burst settings first
      await fetch("/api/agents/mm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          burst_trades_count: burstCount,
          burst_delay_seconds: burstDelay,
        }),
      })

      // Execute burst
      const response = await fetch("/api/agents/mm/burst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: config.id,
          ownerAddress: address,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const successCount = data.results.filter((r: any) => r.success).length
        toast.success(`Burst complete! ${successCount}/${data.results.length} trades executed`)

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ef4444", "#f59e0b", "#10b981"],
        })

        // Refresh data
        mutate(`/api/agents/mm/stats?agentId=${config.id}`)
        mutate(`/api/agents/mm/wallets?agentId=${config.id}`)
        mutate(`/api/agents/mm/activities?agentId=${config.id}`)
      } else {
        toast.error("Burst mode failed")
      }
    } catch (error) {
      console.error("Burst error:", error)
      toast.error("Failed to execute burst mode")
    } finally {
      setBurstLoading(false)
    }
  }

  // Added handleApplyStrategy
  const handleApplyStrategy = async (strategy: StrategyPreset) => {
    if (!config) return

    setConfig({
      ...config,
      buy_amount_eth: strategy.config.buy_amount_eth,
      buy_interval_minutes: strategy.config.buy_interval_minutes,
      sell_interval_minutes: strategy.config.sell_interval_minutes,
    })

    setShowStrategies(false)
    toast.success(`Applied ${strategy.name} strategy`, {
      description: "Remember to save your configuration",
    })
  }

  if (!wagmiIsConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl shadow-emerald-500/5">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 animate-glow-pulse" />
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Wallet className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Connect Wallet
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
              Connect your wallet to access the Market Maker agent control center
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 animate-pulse-slow opacity-20" />
            <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center animate-glow-pulse">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-sm text-muted-foreground animate-pulse">Initializing agent dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!config && !configError) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 blur-xl animate-glow-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center shadow-xl">
                  <BarChart3 className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <CardTitle className="text-3xl sm:text-4xl mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Deploy MM Agent
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Launch your automated market maker with multi-wallet infrastructure
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 space-y-4 border border-white/10">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                How It Works
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "5 dedicated wallets generated with enterprise-grade encryption",
                  "Fund wallets with ETH to enable autonomous trading operations",
                  "AI rotates between wallets to simulate organic market activity",
                  "Complete custody - only you control your agent's funds",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 animate-fade-in"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-5">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 text-amber-400" />
                </div>
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-base text-amber-400">Security Notice</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Wallet keys are encrypted at rest using AES-256. Only you can access your agent wallets through your
                    connected address.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateAgent}
              disabled={isCreating}
              className="w-full h-14 text-base bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover-lift-premium transition-all duration-300 font-semibold"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Deploying Agent...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Deploy Market Maker Agent
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
    walletStats: [],
  }

  const displayedWallets = config?.pro_mode
    ? wallets // Show all 10 wallets in pro mode
    : wallets.slice(0, 5) // Show only first 5 in standard mode

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl shadow-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 blur-md animate-glow-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center shadow-xl">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                {config?.is_active && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-[#0a0a0a] flex items-center justify-center">
                    <LivePulse active />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    $USI Market Maker
                  </h1>
                  {config?.is_active && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                    >
                      <Radio className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {config?.multi_wallet_mode ? `${config.active_wallets}x Multi-Wallet Mode` : "Single Wallet Mode"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Pro Mode (10x Wallets)</span>
                <Switch checked={config.pro_mode || false} onCheckedChange={toggleProMode} />
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Profitable Mode ({">"}10%)</span>
                <Switch checked={config.profitable_mode || false} onCheckedChange={toggleProfitableMode} />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWalletModal(true)}
                className="flex-1 sm:flex-none gap-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>Fund</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCycle}
                disabled={isRunning || !config?.is_active}
                className="flex-1 sm:flex-none gap-2 bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all backdrop-blur-sm disabled:opacity-50"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Test Run</span>
              </Button>

              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <Switch
                  checked={config?.is_active}
                  onCheckedChange={toggleAgent}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <div className="flex items-center gap-2">
                  {config?.is_active ? (
                    <>
                      <PlayCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-400">ON</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">OFF</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Updated main content area */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Market Maker Agent
            </h1>
            <Button onClick={() => setShowStrategies(true)} variant="outline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Strategy Presets
            </Button>
          </div>
          <p className="text-muted-foreground">Automate market making for $USI with configurable strategies</p>
        </div>

        <Dialog open={showStrategies} onOpenChange={setShowStrategies}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Automated Trading Strategies</DialogTitle>
              <DialogDescription>
                Select a preset strategy to configure your market maker for specific chart patterns
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {STRATEGY_PRESETS.map((strategy) => (
                <Card
                  key={strategy.id}
                  className="cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10"
                  onClick={() => handleApplyStrategy(strategy)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <span className="text-2xl">{strategy.icon}</span>
                          {strategy.name}
                        </CardTitle>
                        <CardDescription className="mt-2">{strategy.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground italic">{strategy.chartPattern}</div>
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">Buy Amount</div>
                        <div className="text-sm font-semibold">{strategy.config.buy_amount_eth} ETH</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Buy Every</div>
                        <div className="text-sm font-semibold">{strategy.config.buy_interval_minutes}m</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Sell Every</div>
                        <div className="text-sm font-semibold">{strategy.config.sell_interval_minutes}m</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Tip:</strong> After applying a strategy, you can fine-tune the parameters in the configuration
                section below. Remember to save your changes before activating the agent.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                {
                  label: "Total Buys",
                  value: stats.totalBuys,
                  icon: TrendingUp,
                  gradient: "from-emerald-500/10 to-transparent",
                  iconBg: "from-emerald-500/20 to-emerald-600/10",
                  iconColor: "text-emerald-400",
                  shadow: "shadow-emerald-500/10",
                },
                {
                  label: "Total Sells",
                  value: stats.totalSells,
                  icon: TrendingDown,
                  gradient: "from-rose-500/10 to-transparent",
                  iconBg: "from-rose-500/20 to-rose-600/10",
                  iconColor: "text-rose-400",
                  shadow: "shadow-rose-500/10",
                },
                {
                  label: "Volume Generated",
                  value: `${Number.parseFloat(stats.volumeGenerated || "0").toFixed(4)} ETH`,
                  icon: Activity,
                  gradient: "from-blue-500/10 to-transparent",
                  iconBg: "from-blue-500/20 to-blue-600/10",
                  iconColor: "text-blue-400",
                  shadow: "shadow-blue-500/10",
                },
                {
                  label: "$USI Balance",
                  value: Number.parseFloat(stats.usiBalance).toFixed(2),
                  icon: DollarSign,
                  gradient: "from-purple-500/10 to-transparent",
                  iconBg: "from-purple-500/20 to-purple-600/10",
                  iconColor: "text-purple-400",
                  shadow: "shadow-purple-500/10",
                },
              ].map((stat, idx) => (
                <Card
                  key={stat.label}
                  className={`bg-gradient-to-br ${stat.gradient} bg-black/40 backdrop-blur-xl border-white/10 hover:border-white/20 hover:scale-[1.02] hover:${stat.shadow} transition-all duration-300 animate-fade-in overflow-hidden`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                          {stat.label}
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-white break-all">{stat.value}</p>
                      </div>
                      <div
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}
                      >
                        <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {config?.multi_wallet_mode && stats.walletStats && stats.walletStats.length > 0 && (
              <Card
                className="bg-black/40 backdrop-blur-xl border-white/10 animate-fade-in"
                style={{ animationDelay: "400ms" }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl text-white">Wallet Performance</CardTitle>
                      <CardDescription className="text-sm">Multi-wallet distribution analytics</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayedWallets.map((wallet, index) => (
                      <div
                        key={wallet.id} // Use wallet.id as key
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 transition-all hover-lift gap-3"
                      >
                        {wallet.wallet_index > 5 && (
                          <div className="absolute -top-2 -right-2 z-10">
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                            {index + 1} {/* Use index here */}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-mono text-muted-foreground truncate">
                              {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
                            </div>
                            <div className="text-sm font-medium text-white mt-1">{wallet.usiBalance} $USI</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm ml-13 sm:ml-0">
                          <div className="text-center">
                            <div className="text-emerald-400 font-bold text-lg">{wallet.buys}</div>
                            <div className="text-xs text-muted-foreground">Buys</div>
                          </div>
                          <div className="text-center">
                            <div className="text-rose-400 font-bold text-lg">{wallet.sells}</div>
                            <div className="text-xs text-muted-foreground">Sells</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card
              className="bg-black/40 backdrop-blur-xl border-white/10 animate-fade-in"
              style={{ animationDelay: "500ms" }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl text-white">Configuration</CardTitle>
                    <CardDescription className="text-sm">Fine-tune trading parameters</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: "buy_amount",
                      label: "Buy Amount (ETH)",
                      type: "number",
                      step: "0.0001",
                      value: config.buy_amount_eth,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfig({ ...config, buy_amount_eth: e.target.value }),
                      help: "ETH per buy",
                    },
                    {
                      id: "buy_interval",
                      label: "Buy Interval (min)",
                      type: "number",
                      value: config.buy_interval_minutes,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfig({ ...config, buy_interval_minutes: Number.parseInt(e.target.value) }),
                      help: "Buy frequency",
                      icon: Timer,
                    },
                    {
                      id: "sell_interval",
                      label: "Sell Interval (min)",
                      type: "number",
                      value: config.sell_interval_minutes,
                      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfig({ ...config, sell_interval_minutes: Number.parseInt(e.target.value) }),
                      help: "Sell frequency",
                      icon: Timer,
                    },
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label htmlFor={field.id} className="text-sm font-medium text-white">
                        {field.label}
                      </Label>
                      <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 focus-within:border-emerald-500/50 transition-colors">
                        {field.icon && <field.icon className="w-4 h-4 text-muted-foreground" />}
                        <Input
                          id={field.id}
                          type={field.type}
                          step={field.step}
                          value={field.value}
                          onChange={field.onChange}
                          className="border-0 bg-transparent px-0 focus-visible:ring-0 text-white"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{field.help}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">Multi-Wallet Mode</p>
                      <p className="text-xs text-muted-foreground">
                        Distribute trades across {config.active_wallets} wallets
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={config?.multi_wallet_mode}
                    onCheckedChange={toggleMultiWallet}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">Profitable Mode</p>
                      <p className="text-xs text-muted-foreground">Only sell when profit exceeds 10%</p>
                    </div>
                  </div>
                  <Switch
                    checked={config?.profitable_mode || false}
                    onCheckedChange={(checked) => setConfig({ ...config, profitable_mode: checked })}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="font-medium text-sm text-white">Token Address</p>
                    <p className="text-xs text-muted-foreground font-mono truncate mt-1">
                      0x987603A52d8B966E10FBD29DcB1A574049E25B07
                    </p>
                  </div>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
                    $USI
                  </Badge>
                </div>

                <Button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover-lift-premium transition-all duration-300 font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Configuration...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card
              className="bg-gradient-to-br from-amber-500/10 to-transparent bg-black/40 backdrop-blur-xl border-amber-500/20 animate-fade-in"
              style={{ animationDelay: "600ms" }}
            >
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg mb-2 text-white">Automated Operation</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      When active, this agent executes buy/sell cycles at your configured intervals. Buys $USI with ETH
                      every {config.buy_interval_minutes} minutes and sells accumulated tokens every{" "}
                      {config.sell_interval_minutes} minutes to generate consistent trading volume.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base text-white mb-1">Burst Mode</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Rapidly fire off multiple buy and sell trades in quick succession to generate instant volume and
                      activity
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="burstCount" className="text-xs text-muted-foreground">
                      Number of Trades
                    </Label>
                    <Input
                      id="burstCount"
                      type="number"
                      min={1}
                      max={20}
                      value={burstCount}
                      onChange={(e) => setBurstCount(Number(e.target.value))}
                      className="bg-white/5 border-white/10 h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="burstDelay" className="text-xs text-muted-foreground">
                      Delay (seconds)
                    </Label>
                    <Input
                      id="burstDelay"
                      type="number"
                      min={1}
                      max={30}
                      value={burstDelay}
                      onChange={(e) => setBurstDelay(Number(e.target.value))}
                      className="bg-white/5 border-white/10 h-9"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleBurstMode}
                  disabled={burstLoading || !config?.is_active}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/20"
                >
                  {burstLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Executing Burst...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Fire Burst Mode
                    </>
                  )}
                </Button>

                {!config?.is_active && (
                  <p className="text-xs text-orange-400/60 text-center">Agent must be active to use Burst Mode</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card
              className="bg-black/40 backdrop-blur-xl border-white/10 flex flex-col h-[500px] lg:h-[calc(100vh-12rem)] lg:sticky lg:top-24 animate-fade-in"
              style={{ animationDelay: "700ms" }}
            >
              <CardHeader className="pb-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                        <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                      </div>
                      Activity Feed
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">Real-time operations</CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/20"
                  >
                    <Radio className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-4 sm:px-6">
                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-sm flex items-center justify-center mb-4">
                        <Activity className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-white mb-1">No activity yet</p>
                      <p className="text-xs text-muted-foreground max-w-[200px]">
                        Activate the agent to start generating trading volume
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4 pt-4">
                      {activities.map((activity, idx) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all hover-lift animate-fade-in"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className="mt-0.5 flex-shrink-0">
                            <ActivityIcon type={activity.activity_type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight text-white break-words">
                              {activity.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            {activity.metadata?.txHash && (
                              <a
                                href={`https://basescan.org/tx/${activity.metadata.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 hover:underline mt-2 inline-flex items-center gap-1 transition-colors text-xs"
                              >
                                View Transaction
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fund Wallet Modal */}
      <Dialog open={!!fundingWallet} onOpenChange={(open) => !open && setFundingWallet(null)}>
        <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-2xl border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
              </div>
              Fund Wallet {fundingWallet?.wallet_index}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send ETH or $USI from your connected wallet to this MM agent wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Tabs value={fundingAsset} onValueChange={(v) => setFundingAsset(v as "ETH" | "USI")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ETH">ETH</TabsTrigger>
                <TabsTrigger value="USI">$USI</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="bg-white/5 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Recipient Address</p>
              <p className="text-sm font-mono break-all text-white">{fundingWallet?.wallet_address}</p>
            </div>

            <div className="bg-white/5 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">Your Balance</p>
              <p className="text-lg font-bold text-white">
                {fundingAsset === "ETH"
                  ? `${Number(connectedWalletBalance).toFixed(6)} ETH`
                  : `${Number(connectedWalletUsiBalance).toFixed(2)} $USI`}
              </p>
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
                className="bg-white/5 border-white/10"
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

      {/* Mobile Fund Wallet Drawer */}
      <Drawer open={!!fundingWallet} onOpenChange={(open) => !open && setFundingWallet(null)}>
        <DrawerContent className="bg-black/95 backdrop-blur-2xl border-white/10">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
              </div>
              Fund Wallet {fundingWallet?.wallet_index}
            </DrawerTitle>
            <DrawerDescription>Send ETH or $USI from your connected wallet to this MM agent wallet</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <Tabs value={fundingAsset} onValueChange={(v) => setFundingAsset(v as "ETH" | "USI")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ETH">ETH</TabsTrigger>
                <TabsTrigger value="USI">$USI</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="bg-white/5 p-3 rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground">Recipient Address</p>
              <p className="text-xs font-mono break-all text-white">{fundingWallet?.wallet_address}</p>
            </div>

            <div className="bg-white/5 p-3 rounded-lg space-y-2">
              <p className="text-xs text-muted-foreground">Your Balance</p>
              <p className="text-base font-bold text-white">
                {fundingAsset === "ETH"
                  ? `${Number(connectedWalletBalance).toFixed(6)} ETH`
                  : `${Number(connectedWalletUsiBalance).toFixed(2)} $USI`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundAmountMobile" className="text-sm">
                Amount ({fundingAsset})
              </Label>
              <Input
                id="fundAmountMobile"
                type="number"
                step={fundingAsset === "ETH" ? "0.0001" : "1"}
                placeholder={fundingAsset === "ETH" ? "0.001" : "100"}
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                className="bg-white/5 border-white/10"
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
        </DrawerContent>
      </Drawer>

      {!isMobile && (
        <Dialog open={!!withdrawWallet} onOpenChange={(open) => !open && setWithdrawWallet(null)}>
          <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-2xl border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                  <ArrowUpFromLine className="w-5 h-5 text-blue-400" />
                </div>
                Withdraw from Wallet {withdrawWallet?.wallet_index}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Reclaim ETH and $USI back to your connected wallet
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-white/5 p-4 rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ETH Balance</p>
                  <p className="text-lg font-bold text-white">{withdrawWallet?.eth_balance?.toFixed(6) || "0"} ETH</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">$USI Balance</p>
                  <p className="text-lg font-bold text-white">
                    {withdrawWallet?.token_balance?.toFixed(2) || "0"} $USI
                  </p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  This action will transfer all funds to {wagmiAddress?.slice(0, 6)}...{wagmiAddress?.slice(-4)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleWithdraw("eth")}
                  disabled={isWithdrawing || !withdrawWallet?.eth_balance || withdrawWallet.eth_balance <= 0}
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw ETH"}
                </Button>
                <Button
                  onClick={() => handleWithdraw("usi")}
                  disabled={isWithdrawing || !withdrawWallet?.token_balance || withdrawWallet.token_balance <= 0}
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw $USI"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isMobile && (
        <Drawer open={!!withdrawWallet} onOpenChange={(open) => !open && setWithdrawWallet(null)}>
          <DrawerContent className="bg-black/95 backdrop-blur-2xl border-white/10">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                  <ArrowUpFromLine className="w-5 h-5 text-blue-400" />
                </div>
                Withdraw from Wallet {withdrawWallet?.wallet_index}
              </DrawerTitle>
              <DrawerDescription>Reclaim ETH and $USI back to your connected wallet</DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4 space-y-4">
              <div className="bg-white/5 p-3 rounded-lg space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ETH Balance</p>
                  <p className="text-base font-bold text-white">{withdrawWallet?.eth_balance?.toFixed(6) || "0"} ETH</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">$USI Balance</p>
                  <p className="text-base font-bold text-white">
                    {withdrawWallet?.token_balance?.toFixed(2) || "0"} $USI
                  </p>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This action will transfer all funds to {wagmiAddress?.slice(0, 6)}...{wagmiAddress?.slice(-4)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleWithdraw("eth")}
                  disabled={isWithdrawing || !withdrawWallet?.eth_balance || withdrawWallet.eth_balance <= 0}
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw ETH"}
                </Button>
                <Button
                  onClick={() => handleWithdraw("usi")}
                  disabled={isWithdrawing || !withdrawWallet?.token_balance || withdrawWallet.token_balance <= 0}
                  variant="outline"
                  className="border-white/10 hover:bg-white/10"
                >
                  {isWithdrawing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw $USI"}
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {!isMobile && (
        <Dialog
          open={!!exportWallet}
          onOpenChange={(open) => {
            if (!open) {
              setExportWallet(null)
              setExportedKey("")
              setShowKey(false)
            }
          }}
        >
          <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-2xl border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-rose-400" />
                </div>
                Export Private Key
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Wallet {exportWallet?.wallet_index}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 space-y-2">
                <div className="flex gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-rose-400">Security Warning</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Never share your private key with anyone. Anyone with this key can control your wallet and steal
                      your funds.
                    </p>
                  </div>
                </div>
              </div>

              {!exportedKey ? (
                <Button
                  onClick={handleExportKey}
                  disabled={isExporting}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    "Reveal Private Key"
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/5 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Private Key</p>
                      <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)} className="h-8 px-2">
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-sm font-mono break-all text-white">{showKey ? exportedKey : "•".repeat(64)}</p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(exportedKey)
                      toast.success("Copied to clipboard!")
                    }}
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Private Key
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {isMobile && (
        <Drawer
          open={!!exportWallet}
          onOpenChange={(open) => {
            if (!open) {
              setExportWallet(null)
              setExportedKey("")
              setShowKey(false)
            }
          }}
        >
          <DrawerContent className="bg-black/95 backdrop-blur-2xl border-white/10">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-rose-400" />
                </div>
                Export Private Key
              </DrawerTitle>
              <DrawerDescription>Wallet {exportWallet?.wallet_index}</DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-4 space-y-4">
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-xs text-rose-400">Security Warning</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Never share your private key. Anyone with this key can steal your funds.
                    </p>
                  </div>
                </div>
              </div>

              {!exportedKey ? (
                <Button
                  onClick={handleExportKey}
                  disabled={isExporting}
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Exporting...
                    </>
                  ) : (
                    "Reveal Private Key"
                  )}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">Private Key</p>
                      <Button variant="ghost" size="sm" onClick={() => setShowKey(!showKey)} className="h-8 px-2">
                        {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-xs font-mono break-all text-white">{showKey ? exportedKey : "•".repeat(64)}</p>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(exportedKey)
                      toast.success("Copied to clipboard!")
                    }}
                    variant="outline"
                    className="w-full border-white/10 hover:bg-white/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Private Key
                  </Button>
                </div>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {!isMobile ? (
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl text-white">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                Fund Your MM Agent Wallets
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Send ETH to these addresses to enable market making operations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {wallets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                  <p className="text-sm text-muted-foreground">Loading wallet addresses...</p>
                </div>
              ) : (
                wallets.map((wallet, idx) => (
                  <div
                    key={wallet.id}
                    className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 space-y-4"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-white">Wallet {idx + 1}</p>
                          {wallet.total_buys > 0 || wallet.total_sells > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-white/10 text-muted-foreground border-white/20 text-xs"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-white/5 p-2 rounded-lg">
                          <span className="truncate flex-1 break-all">{wallet.wallet_address}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.wallet_address)}
                            className="h-6 w-6 p-0 hover:bg-white/10 flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <p className="text-muted-foreground text-xs mb-1">ETH Balance</p>
                        <p className="font-medium text-white text-xs break-all">
                          {wallet.eth_balance?.toFixed(6) || "0"} ETH
                        </p>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <p className="text-muted-foreground text-xs mb-1">$USI Balance</p>
                        <p className="font-medium text-white text-xs break-all">
                          {wallet.token_balance?.toFixed(2) || "0"} $USI
                        </p>
                      </div>
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        <p className="text-muted-foreground text-xs mb-1">Buys</p>
                        <p className="font-bold text-emerald-400 text-sm">{wallet.total_buys || 0}</p>
                      </div>
                      <div className="bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                        <p className="text-muted-foreground text-xs mb-1">Sells</p>
                        <p className="font-bold text-rose-400 text-sm">{wallet.total_sells || 0}</p>
                      </div>
                    </div>

                    <a
                      href={`https://basescan.org/address/${wallet.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      View on Basescan
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                      <Button
                        onClick={() => setFundingWallet(wallet)}
                        disabled={!isConnected}
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 text-xs"
                      >
                        <ArrowDownToLine className="w-3 h-3 mr-1" />
                        Fund
                      </Button>
                      <Button
                        onClick={() => setWithdrawWallet(wallet)}
                        disabled={!isConnected || (wallet.eth_balance <= 0 && wallet.token_balance <= 0)}
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-xs"
                      >
                        <ArrowUpFromLine className="w-3 h-3 mr-1" />
                        Withdraw
                      </Button>
                      <Button
                        onClick={() => setSellAllWallet(wallet)}
                        disabled={!isConnected || wallet.token_balance <= 0}
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs"
                      >
                        <Repeat className="w-3 h-3 mr-1" />
                        Sell All
                      </Button>
                      <Button
                        onClick={() => setExportWallet(wallet)}
                        disabled={!isConnected}
                        size="sm"
                        variant="outline"
                        className="border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-4 mt-4">
                <div className="flex gap-3">
                  <Activity className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-semibold text-sm text-amber-400">Funding Instructions</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Send ETH from your wallet to any of these addresses. Each wallet needs at least 0.001 ETH to cover
                      gas fees and trading operations. The agent will automatically use funded wallets for market
                      making.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DrawerContent className="bg-black/95 backdrop-blur-2xl border-white/10 max-h-[90vh]">
            <DrawerHeader className="px-4 pt-4">
              <DrawerTitle className="flex items-center gap-3 text-xl text-white">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                Fund Your MM Agent Wallets
              </DrawerTitle>
              <DrawerDescription className="text-muted-foreground text-sm">
                Send ETH to these addresses to enable market making operations
              </DrawerDescription>
            </DrawerHeader>

            <div className="overflow-y-auto px-4 pb-4 space-y-3">
              {wallets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                  <p className="text-sm text-muted-foreground">Loading wallet addresses...</p>
                </div>
              ) : (
                wallets.map((wallet, idx) => (
                  <div key={wallet.id} className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-white">Wallet {idx + 1}</p>
                          {wallet.total_buys > 0 || wallet.total_sells > 0 ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs"
                            >
                              Active
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-white/10 text-muted-foreground border-white/20 text-xs"
                            >
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-white/5 p-2 rounded-lg">
                          <span className="truncate flex-1 break-all">{wallet.wallet_address}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(wallet.wallet_address)}
                            className="h-6 w-6 p-0 hover:bg-white/10 flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <p className="text-muted-foreground text-xs mb-1">ETH Balance</p>
                        <p className="font-medium text-white text-xs break-all">
                          {wallet.eth_balance?.toFixed(6) || "0"} ETH
                        </p>
                      </div>
                      <div className="bg-white/5 p-2.5 rounded-lg">
                        <p className="text-muted-foreground text-xs mb-1">$USI Balance</p>
                        <p className="font-medium text-white text-xs break-all">
                          {wallet.token_balance?.toFixed(2) || "0"} $USI
                        </p>
                      </div>
                      <div className="bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        <p className="text-muted-foreground text-xs mb-1">Buys</p>
                        <p className="font-bold text-emerald-400 text-sm">{wallet.total_buys || 0}</p>
                      </div>
                      <div className="bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">
                        <p className="text-muted-foreground text-xs mb-1">Sells</p>
                        <p className="font-bold text-rose-400 text-sm">{wallet.total_sells || 0}</p>
                      </div>
                    </div>

                    <a
                      href={`https://basescan.org/address/${wallet.wallet_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      View on Basescan
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                      <Button
                        onClick={() => {
                          setShowWalletModal(false)
                          setFundingWallet(wallet)
                        }}
                        disabled={!isConnected}
                        size="sm"
                        variant="outline"
                        className="border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 text-xs h-9"
                      >
                        <ArrowDownToLine className="w-3 h-3 mr-1" />
                        Fund
                      </Button>
                      <Button
                        onClick={() => {
                          setShowWalletModal(false)
                          setWithdrawWallet(wallet)
                        }}
                        disabled={!isConnected || (wallet.eth_balance <= 0 && wallet.token_balance <= 0)}
                        size="sm"
                        variant="outline"
                        className="border-blue-500/30 hover:bg-blue-500/10 text-blue-400 text-xs h-9"
                      >
                        <ArrowUpFromLine className="w-3 h-3 mr-1" />
                        Withdraw
                      </Button>
                      <Button
                        onClick={() => {
                          setShowWalletModal(false)
                          setSellAllWallet(wallet)
                        }}
                        disabled={!isConnected || wallet.token_balance <= 0}
                        size="sm"
                        variant="outline"
                        className="border-amber-500/30 hover:bg-amber-500/10 text-amber-400 text-xs h-9"
                      >
                        <Repeat className="w-3 h-3 mr-1" />
                        Sell All
                      </Button>
                      <Button
                        onClick={() => {
                          setShowWalletModal(false)
                          setExportWallet(wallet)
                        }}
                        disabled={!isConnected}
                        size="sm"
                        variant="outline"
                        className="border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs h-9"
                      >
                        <Key className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-3">
                <div className="flex gap-2">
                  <Activity className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className="font-semibold text-sm text-amber-400">Funding Instructions</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Send ETH from your wallet to any of these addresses. Each wallet needs at least 0.001 ETH to cover
                      gas fees and trading operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {!isMobile ? (
        <Dialog open={!!sellAllWallet} onOpenChange={(open) => !open && setSellAllWallet(null)}>
          <DialogContent className="sm:max-w-md bg-black/95 backdrop-blur-2xl border-white/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-400">
                <Repeat className="w-5 h-5" />
                Sell All $USI Tokens
              </DialogTitle>
              <DialogDescription>
                This will convert all $USI tokens in this wallet to ETH, resetting the market making cycle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-2xl font-bold text-white">{sellAllWallet?.token_balance?.toFixed(2) || "0"} $USI</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  This action will sell all $USI tokens for ETH, giving your wallet a fresh start for the next market
                  making cycle. This is useful when you want to reset and start with pure ETH funding.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => setSellAllWallet(null)}
                  variant="outline"
                  className="flex-1"
                  disabled={sellAllLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => sellAllWallet && handleSellAll(sellAllWallet)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={sellAllLoading}
                >
                  {sellAllLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Selling...
                    </>
                  ) : (
                    <>
                      <Repeat className="w-4 h-4 mr-2" />
                      Confirm Sell All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={!!sellAllWallet} onOpenChange={(open) => !open && setSellAllWallet(null)}>
          <DrawerContent className="bg-black/95 backdrop-blur-2xl border-white/10">
            <DrawerHeader>
              <DrawerTitle className="text-amber-400">Sell All $USI Tokens</DrawerTitle>
              <DrawerDescription>
                This will convert all $USI tokens in this wallet to ETH, resetting the market making cycle.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className="text-lg font-bold text-white">{sellAllWallet?.token_balance?.toFixed(2) || "0"} $USI</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">
                  This action will sell all $USI tokens for ETH, giving your wallet a fresh start for the next market
                  making cycle. This is useful when you want to reset and start with pure ETH funding.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSellAllWallet(null)}
                  variant="outline"
                  className="flex-1"
                  disabled={sellAllLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => sellAllWallet && handleSellAll(sellAllWallet)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={sellAllLoading}
                >
                  {sellAllLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Selling...
                    </>
                  ) : (
                    <>
                      <Repeat className="w-4 h-4 mr-2" />
                      Confirm Sell All
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
}
