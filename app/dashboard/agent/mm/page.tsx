"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
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
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"

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
}

interface MMStats {
  totalBuys: number
  totalSells: number
  volumeGenerated: string
  usiBalance: string
  walletStats?: WalletStats[]
}

interface WalletStats {
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

export default function MMAgentDashboard() {
  const { address, isConnected } = useWallet()
  const [config, setConfig] = useState<MMAgentConfig | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const buyIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const sellIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [wallets, setWallets] = useState<any[]>([])

  const {
    data: configData,
    error: configError,
    isLoading: isLoadingConfig,
  } = useSWR<{ config: MMAgentConfig }>(address ? `/api/agents/mm/config?ownerAddress=${address}` : null, (url) =>
    fetch(url).then((res) => res.json()),
  )

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

    setIsSaving(true)
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
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }

      mutate(`/api/agents/mm/config?ownerAddress=${address}`)
      alert("Configuration saved!")
    } catch (error) {
      console.error("Failed to save config:", error)
      alert("Failed to save configuration")
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
        alert(`Cycle completed!\n\n${data.messages.join("\n")}`)
        mutate(`/api/agents/mm/stats?agentId=${config.id}`)
      } else {
        alert(`Cycle failed: ${data.error}`)
      }
    } catch (error) {
      console.error("Failed to run cycle:", error)
      alert("Failed to run cycle")
    } finally {
      setIsRunning(false)
    }
  }

  const startContinuousCycles = useCallback(() => {
    if (!config) return

    console.log("[v0] Starting continuous MM cycles...")

    // Clear any existing intervals
    if (buyIntervalRef.current) clearInterval(buyIntervalRef.current)
    if (sellIntervalRef.current) clearInterval(sellIntervalRef.current)

    // Function to execute buy
    const executeBuy = async () => {
      try {
        console.log("[v0] Executing buy cycle...")
        const response = await fetch("/api/agents/mm/cycle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: config.id, action: "buy" }),
        })
        const data = await response.json()
        if (data.success) {
          mutate(`/api/agents/mm/stats?agentId=${config.id}`)
        }
      } catch (error) {
        console.error("[v0] Buy cycle error:", error)
      }
    }

    // Function to execute sell
    const executeSell = async () => {
      try {
        console.log("[v0] Executing sell cycle...")
        const response = await fetch("/api/agents/mm/cycle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agentId: config.id, action: "sell" }),
        })
        const data = await response.json()
        if (data.success) {
          mutate(`/api/agents/mm/stats?agentId=${config.id}`)
        }
      } catch (error) {
        console.error("[v0] Sell cycle error:", error)
      }
    }

    // Start buy interval (buy every 5 minutes)
    const buyIntervalMs = config.buy_interval_minutes * 60 * 1000
    buyIntervalRef.current = setInterval(executeBuy, buyIntervalMs)
    console.log(`[v0] Buy interval set to ${config.buy_interval_minutes} minutes`)

    // Start sell interval (sell every 10 minutes)
    const sellIntervalMs = config.sell_interval_minutes * 60 * 1000
    sellIntervalRef.current = setInterval(executeSell, sellIntervalMs)
    console.log(`[v0] Sell interval set to ${config.sell_interval_minutes} minutes`)

    // Execute first buy immediately
    executeBuy()
  }, [config, mutate])

  const stopContinuousCycles = useCallback(() => {
    console.log("[v0] Stopping continuous MM cycles...")
    if (buyIntervalRef.current) {
      clearInterval(buyIntervalRef.current)
      buyIntervalRef.current = null
    }
    if (sellIntervalRef.current) {
      clearInterval(sellIntervalRef.current)
      sellIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (config?.is_active) {
      startContinuousCycles()
    } else {
      stopContinuousCycles()
    }

    // Cleanup on unmount
    return () => {
      stopContinuousCycles()
    }
  }, [config?.is_active, startContinuousCycles, stopContinuousCycles])

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
    } catch (error) {
      console.error("Failed to toggle multi-wallet:", error)
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

      alert(
        `Agent created successfully!\n\n${data.wallets.length} wallets generated.\nPlease fund your wallets to start market making.`,
      )
    } catch (error: any) {
      console.error("Failed to create agent:", error)
      alert(`Failed to create agent: ${error.message}`)
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied to clipboard!")
  }

  if (!isConnected) {
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-safe">
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

      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
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
                  value: `$${Number.parseFloat(stats.volumeGenerated || "0").toFixed(2)}`,
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
                    {stats.walletStats.map((wallet, idx) => (
                      <div
                        key={wallet.address}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 transition-all hover-lift gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-emerald-500/30">
                            {idx + 1}
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

      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col bg-black/95 backdrop-blur-2xl border-white/10 shadow-2xl p-4 sm:p-6">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-lg sm:text-xl md:text-2xl text-white">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </div>
              <span className="truncate">Fund Your MM Agent Wallets</span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Send ETH to these addresses to enable market making operations
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6 space-y-3 sm:space-y-4 mt-4">
            {wallets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                <p className="text-sm text-muted-foreground">Loading wallet addresses...</p>
              </div>
            ) : (
              wallets.map((wallet, idx) => (
                <div
                  key={wallet.wallet_address}
                  className="p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-500/30 transition-all"
                >
                  <div className="flex items-start gap-2 sm:gap-3 mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="text-xs sm:text-sm font-medium text-white">Wallet {idx + 1}</p>
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
                      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-white/5 p-2 rounded-lg overflow-hidden">
                        <span className="truncate flex-1 text-[10px] sm:text-xs">{wallet.wallet_address}</span>
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

                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-sm mt-3">
                    <div className="bg-white/5 p-2 sm:p-3 rounded-lg">
                      <p className="text-muted-foreground text-[10px] sm:text-xs mb-1">ETH Balance</p>
                      <p className="font-medium text-white text-xs sm:text-sm truncate">
                        {wallet.eth_balance?.toFixed(6) || "0"} ETH
                      </p>
                    </div>
                    <div className="bg-white/5 p-2 sm:p-3 rounded-lg">
                      <p className="text-muted-foreground text-[10px] sm:text-xs mb-1">$USI Balance</p>
                      <p className="font-medium text-white text-xs sm:text-sm truncate">
                        {wallet.token_balance?.toFixed(2) || "0"} $USI
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 p-2 sm:p-3 rounded-lg border border-emerald-500/20">
                      <p className="text-muted-foreground text-[10px] sm:text-xs mb-1">Buys</p>
                      <p className="font-bold text-emerald-400 text-xs sm:text-sm">{wallet.total_buys || 0}</p>
                    </div>
                    <div className="bg-rose-500/10 p-2 sm:p-3 rounded-lg border border-rose-500/20">
                      <p className="text-muted-foreground text-[10px] sm:text-xs mb-1">Sells</p>
                      <p className="font-bold text-rose-400 text-xs sm:text-sm">{wallet.total_sells || 0}</p>
                    </div>
                  </div>

                  <a
                    href={`https://basescan.org/address/${wallet.wallet_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    View on Basescan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            )}

            <div className="bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-xl p-3 sm:p-4">
              <div className="flex gap-2 sm:gap-3">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                  <p className="font-semibold text-xs sm:text-sm text-amber-400">Funding Instructions</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                    Send ETH from your wallet to any of these addresses. Each wallet needs at least 0.001 ETH to cover
                    gas fees and trading operations. The agent will automatically use funded wallets for market making.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
