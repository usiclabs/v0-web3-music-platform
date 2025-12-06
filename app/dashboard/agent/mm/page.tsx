"use client"

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
  buys: number
  sells: number
  usiBalance: string
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
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  )
}

function ActivityIcon({ type }: { type: string }) {
  if (type.includes("buy")) {
    return <TrendingUp className="w-4 h-4 text-emerald-500" />
  }
  if (type.includes("sell")) {
    return <TrendingDown className="w-4 h-4 text-red-500" />
  }
  if (type.includes("error") || type.includes("failed")) {
    return <XCircle className="w-4 h-4 text-red-500" />
  }
  if (type.includes("completed")) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-500" />
  }
  return <Activity className="w-4 h-4 text-blue-500" />
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-6 text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6">Connect your wallet to access the Market Maker agent dashboard</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoadingConfig) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config && !configError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create Your MM Agent</CardTitle>
                <CardDescription>Set up your own market maker bot with dedicated wallets</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                How It Works
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>5 fresh wallets will be generated exclusively for your MM agent</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Fund these wallets with ETH to enable automatic market making</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>Bot rotates through wallets to create organic trading volume</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>You maintain full control - only you can access your agent's funds</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Activity className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-yellow-600 dark:text-yellow-400">Important</p>
                  <p className="text-sm text-muted-foreground">
                    Your wallet private keys will be encrypted and stored securely in the database. Only you can access
                    your agent's wallets. Make sure you're comfortable with this before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleCreateAgent} disabled={isCreating} className="w-full" size="lg">
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Agent...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create My MM Agent
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-emerald-500/10 bg-gradient-to-r from-card/80 via-emerald-500/5 to-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                {config?.is_active && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                    <LivePulse active />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">$USI Market Maker</h1>
                  {config?.is_active && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <Radio className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  {config?.multi_wallet_mode && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                      <Users className="w-3 h-3 mr-1" />
                      {config.active_wallets} Wallets
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {config?.multi_wallet_mode ? "Multi-Wallet Volume Generator" : "Autonomous Volume Generator"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWalletModal(true)}
                className="gap-2 bg-transparent"
              >
                <Wallet className="w-4 h-4" />
                Fund Wallets
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCycle}
                disabled={isRunning || !config?.is_active}
                className="gap-2 bg-transparent"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Run Cycle
              </Button>

              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border">
                <span className="text-sm font-medium text-muted-foreground">Multi-Wallet</span>
                <Switch checked={config?.multi_wallet_mode} onCheckedChange={toggleMultiWallet} />
                <div
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    config?.multi_wallet_mode ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {config?.multi_wallet_mode ? `${config.active_wallets}x` : "1x"}
                </div>
              </div>

              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border">
                <span className="text-sm font-medium text-muted-foreground">Agent</span>
                <Switch checked={config?.is_active} onCheckedChange={toggleAgent} />
                <div
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    config?.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {config?.is_active ? "ON" : "OFF"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Config */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Buys</p>
                      <p className="text-3xl font-bold">{stats.totalBuys}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Sells</p>
                      <p className="text-3xl font-bold">{stats.totalSells}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Volume Generated</p>
                      <p className="text-3xl font-bold">
                        ${Number.parseFloat(stats.volumeGenerated || "0").toFixed(4)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">$USI Balance</p>
                      <p className="text-3xl font-bold">{Number.parseFloat(stats.usiBalance).toFixed(4)}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Wallet Stats Section */}
            {config?.multi_wallet_mode && stats.walletStats && stats.walletStats.length > 0 && (
              <Card className="bg-card/50 border-emerald-500/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Wallet Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.walletStats.map((wallet, idx) => (
                      <div
                        key={wallet.address}
                        className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-emerald-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-xs font-mono text-muted-foreground">
                              {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                            </div>
                            <div className="text-sm font-medium">{wallet.usiBalance} $USI</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <div className="text-emerald-400 font-bold">{wallet.buys}</div>
                            <div className="text-xs text-muted-foreground">Buys</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-400 font-bold">{wallet.sells}</div>
                            <div className="text-xs text-muted-foreground">Sells</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Configuration</CardTitle>
                <CardDescription>Configure your market making parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buy_amount">Buy Amount (ETH)</Label>
                    <Input
                      id="buy_amount"
                      type="number"
                      step="0.0001"
                      value={config.buy_amount_eth}
                      onChange={(e) => setConfig({ ...config, buy_amount_eth: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">ETH to spend per buy</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buy_interval">Buy Interval (minutes)</Label>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="buy_interval"
                        type="number"
                        value={config.buy_interval_minutes}
                        onChange={(e) =>
                          setConfig({ ...config, buy_interval_minutes: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">How often to buy</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sell_interval">Sell Interval (minutes)</Label>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4 text-muted-foreground" />
                      <Input
                        id="sell_interval"
                        type="number"
                        value={config.sell_interval_minutes}
                        onChange={(e) =>
                          setConfig({ ...config, sell_interval_minutes: Number.parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">How often to sell</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div>
                    <p className="font-medium">Token Address</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      0x987603A52d8B966E10FBD29DcB1A574049E25B07
                    </p>
                  </div>
                  <Badge>$USI</Badge>
                </div>

                <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
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

            {/* Info Card */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Automated Operation</h3>
                    <p className="text-sm text-muted-foreground">
                      When active, this agent automatically executes buy/sell cycles based on your configured intervals.
                      It buys $USI with ETH every {config.buy_interval_minutes} minutes and sells accumulated tokens
                      every {config.sell_interval_minutes} minutes to generate consistent trading volume.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Feed */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Activity Feed</CardTitle>
                    <CardDescription>Real-time MM operations</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    Live
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full px-6">
                  {activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                      <Activity className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Activate the agent to start generating volume
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                        >
                          <div className="mt-0.5">
                            <ActivityIcon type={activity.activity_type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{activity.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            {activity.metadata?.txHash && (
                              <a
                                href={`https://basescan.org/tx/${activity.metadata.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                              >
                                View TX
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              Fund Your MM Agent Wallets
            </DialogTitle>
            <DialogDescription>Send ETH to these addresses to enable market making operations</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <Activity className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">How to Fund</p>
                  <p className="text-sm text-muted-foreground">
                    Each wallet needs ETH on Base network to execute trades. Send at least 0.001 ETH per wallet to cover
                    gas costs and initial buys.
                  </p>
                </div>
              </div>
            </div>

            {wallets.length === 0 ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading wallets...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.map((wallet, idx) => (
                  <div
                    key={wallet.wallet_address}
                    className="p-4 rounded-lg bg-background border hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Wallet {idx + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {wallet.total_buys} buys · {wallet.total_sells} sells
                          </p>
                        </div>
                      </div>
                      <Badge variant={wallet.is_active ? "default" : "secondary"}>
                        {wallet.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="bg-muted/50 rounded-md p-3 mb-2">
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-xs font-mono flex-1 break-all">{wallet.wallet_address}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(wallet.wallet_address)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Balance: {wallet.eth_balance || "0"} ETH · {wallet.token_balance || "0"} $USI
                      </span>
                      <a
                        href={`https://basescan.org/address/${wallet.wallet_address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-1"
                      >
                        View on Basescan
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">Pro Tip</p>
                  <p className="text-sm text-muted-foreground">
                    In multi-wallet mode, the bot rotates through all active wallets to distribute trades and create
                    more organic-looking volume.
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
