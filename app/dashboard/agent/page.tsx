"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Bot,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  RefreshCw,
  DollarSign,
  Target,
  Shield,
  Zap,
  Clock,
  Loader2,
  Sparkles,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Music,
  Disc3,
  Headphones,
  Radio,
  AlertTriangle,
  Filter,
  Save,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { checkAgentTokenGate, type AgentTokenGateStatus } from "@/lib/web3/agent-token-gate"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface AgentConfig {
  id: string
  name: string
  is_active: boolean
  total_budget: number
  spent_amount: number
  daily_limit: number
  per_trade_limit: number
  strategy_type: string
  min_liquidity: number
  max_slippage: number
  stop_loss_percent: number
  take_profit_percent: number
  max_portfolio_percent: number
  min_holder_count: number
  min_artist_followers: number
  preferred_genres: string[]
  blacklisted_tokens: string[]
  whitelisted_tokens: string[]
  last_active_at: string | null
}

interface PortfolioItem {
  id: string
  token_address: string
  token_symbol: string
  token_name: string
  amount: number
  avg_buy_price: number
  total_invested: number
  current_value: number
  unrealized_pnl: number
  realized_pnl: number
}

interface Trade {
  id: string
  trade_type: "buy" | "sell"
  token_symbol: string
  amount_in: number
  amount_out: number
  price_per_token: number
  tx_hash: string
  status: string
  trigger_reason: string
  created_at: string
}

interface ActivityLog {
  id: string
  activity_type: string
  description: string
  created_at: string
  metadata: Record<string, any>
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

function MiniChart({ positive }: { positive: boolean }) {
  return (
    <svg viewBox="0 0 100 32" className="w-24 h-8">
      <path
        d={
          positive
            ? "M0 24 L10 20 L20 22 L30 18 L40 16 L50 14 L60 12 L70 10 L80 8 L90 6 L100 4"
            : "M0 8 L10 10 L20 8 L30 12 L40 14 L50 16 L60 18 L70 20 L80 22 L90 24 L100 28"
        }
        fill="none"
        stroke={positive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={
          positive
            ? "M0 24 L10 20 L20 22 L30 18 L40 16 L50 14 L60 12 L70 10 L80 8 L90 6 L100 4 L100 32 L0 32 Z"
            : "M0 8 L10 10 L20 8 L30 12 L40 14 L50 16 L60 18 L70 20 L80 22 L90 24 L100 28 L100 32 L0 32 Z"
        }
        fill={positive ? "url(#greenGradient)" : "url(#redGradient)"}
      />
      <defs>
        <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(16, 185, 129)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(16, 185, 129)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(239, 68, 68)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="rgb(239, 68, 68)" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function AgentDashboardPage() {
  const { address, isConnected } = useWallet()
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [config, setConfig] = useState<Partial<AgentConfig>>({
    name: "My Investment Agent",
    is_active: false,
    total_budget: 100,
    daily_limit: 10,
    per_trade_limit: 1,
    strategy_type: "balanced",
    min_liquidity: 1000,
    max_slippage: 5,
    stop_loss_percent: 20,
    take_profit_percent: 50,
    max_portfolio_percent: 10,
    min_holder_count: 10,
    min_artist_followers: 0,
    preferred_genres: [],
    blacklisted_tokens: [],
    whitelisted_tokens: [],
  })

  const [tokenGateStatus, setTokenGateStatus] = useState<AgentTokenGateStatus | null>(null)

  // Fetch agent config
  const { data: agentData, error: agentError } = useSWR(
    address ? `/api/agents/config?address=${address}` : null,
    fetcher,
  )

  // Fetch portfolio
  const { data: portfolioData } = useSWR(
    agentData?.agent?.id ? `/api/agents/portfolio?agentId=${agentData.agent.id}` : null,
    fetcher,
  )

  // Fetch trades
  const { data: tradesData } = useSWR(
    agentData?.agent?.id ? `/api/agents/trades?agentId=${agentData.agent.id}` : null,
    fetcher,
  )

  // Fetch activity
  const { data: activityData } = useSWR(
    agentData?.agent?.id ? `/api/agents/activity?agentId=${agentData.agent.id}` : null,
    fetcher,
  )

  useEffect(() => {
    if (agentData?.agent) {
      const { portfolio, recent_trades, ...agentConfig } = agentData.agent
      setConfig(agentConfig)
    }
  }, [agentData])

  useEffect(() => {
    if (address) {
      checkAgentTokenGate(address).then(setTokenGateStatus)
    }
  }, [address])

  const handleSaveConfig = async () => {
    if (!address) return
    setIsSaving(true)

    try {
      const { portfolio, recent_trades, ...configToSave } = config as any

      const response = await fetch("/api/agents/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerAddress: address,
          ...configToSave,
        }),
      })

      if (response.ok) {
        mutate(`/api/agents/config?address=${address}`)
      }
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunCycle = async () => {
    if (!agentData?.agent?.id) return
    setIsRunning(true)

    try {
      const response = await fetch("/api/agents/run-cycle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentData.agent.id }),
      })

      if (response.ok) {
        mutate(`/api/agents/portfolio?agentId=${agentData.agent.id}`)
        mutate(`/api/agents/trades?agentId=${agentData.agent.id}`)
        mutate(`/api/agents/activity?agentId=${agentData.agent.id}`)
      }
    } catch (error) {
      console.error("Failed to run cycle:", error)
    } finally {
      setIsRunning(false)
    }
  }

  const toggleAgent = async () => {
    setConfig((prev) => ({ ...prev, is_active: !prev.is_active }))
    await handleSaveConfig()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
        {/* Animated background with music waveform pattern */}
        <div className="fixed inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(229,62,62,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(229,62,62,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        {/* Animated equalizer bars background */}
        <div className="fixed bottom-0 left-0 right-0 h-64 flex items-end justify-center gap-1 opacity-10 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-red-500 to-red-500/50 rounded-t"
              style={{
                height: `${Math.random() * 100 + 20}%`,
                animation: `pulse ${0.5 + Math.random() * 1}s ease-in-out infinite`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Floating vinyl records */}
        <div className="fixed top-20 left-10 w-32 h-32 opacity-10 animate-spin" style={{ animationDuration: "20s" }}>
          <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-500/30" />
          </div>
        </div>
        <div
          className="fixed bottom-32 right-16 w-24 h-24 opacity-10 animate-spin"
          style={{ animationDuration: "15s", animationDirection: "reverse" }}
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-red-500/30" />
          </div>
        </div>

        {/* Red glow orbs */}
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="relative max-w-2xl w-full z-10">
          {/* Ambient glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-red-500/20 via-red-600/30 to-red-500/20 rounded-3xl blur-2xl opacity-50" />

          <Card className="relative border-0 bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Top gradient border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

            <CardContent className="pt-16 pb-12 px-8 md:px-12 text-center">
              {/* Animated icon with vinyl/music theme */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500/30 to-red-600/30 blur-xl animate-pulse" />
                {/* Spinning vinyl disc */}
                <div
                  className="relative w-28 h-28 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center ring-2 ring-red-500/30 shadow-lg animate-spin"
                  style={{ animationDuration: "8s" }}
                >
                  {/* Vinyl grooves */}
                  <div className="absolute inset-2 rounded-full border border-zinc-700/50" />
                  <div className="absolute inset-4 rounded-full border border-zinc-700/30" />
                  <div className="absolute inset-6 rounded-full border border-zinc-700/20" />
                  {/* Center label */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                {/* Pulsing status dot */}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 animate-ping" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                x402 Investment Agent
              </h1>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                Your autonomous AI DJ for the music token economy — spinning profits 24/7
              </p>

              {/* Feature grid with music theme */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="group p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Headphones className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Always Listening</h3>
                  <p className="text-sm text-muted-foreground">24/7 market monitoring for artist tokens</p>
                </div>

                <div className="group p-5 rounded-2xl bg-gradient-to-br from-red-600/10 to-red-600/5 border border-red-600/10 hover:border-red-600/30 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-600/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Protected Drops</h3>
                  <p className="text-sm text-muted-foreground">Built-in stop-loss & risk management</p>
                </div>

                <div className="group p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/10 hover:border-red-500/30 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">Hit Detector</h3>
                  <p className="text-sm text-muted-foreground">Multi-signal analysis for rising artists</p>
                </div>
              </div>

              {/* Stats preview with music terminology */}
              <div className="flex items-center justify-center gap-6 md:gap-8 mb-10 py-4 border-y border-border/50">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Music className="w-4 h-4 text-red-500" />
                    <p className="text-2xl font-bold font-mono text-foreground">4</p>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Strategies</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Radio className="w-4 h-4 text-red-500" />
                    <p className="text-2xl font-bold font-mono text-foreground">24/7</p>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">On Air</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Disc3 className="w-4 h-4 text-red-500" />
                    <p className="text-2xl font-bold font-mono text-foreground">x402</p>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Protocol</p>
                </div>
              </div>

              {/* CTA text */}
              <p className="text-sm text-muted-foreground">Connect your wallet to drop the beat</p>
            </CardContent>
          </Card>

          {/* Bottom badge */}
          <div className="flex justify-center mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur border border-red-500/20 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Powered by ERC-8004 Agent Protocol
            </div>
          </div>
        </div>
      </div>
    )
  }

  const portfolio = portfolioData?.portfolio || []
  const totals = portfolioData?.totals || { totalInvested: 0, totalValue: 0, totalRealizedPnl: 0 }
  const trades = tradesData?.trades || []
  const stats = tradesData?.stats || { totalTrades: 0, successfulTrades: 0 }
  const activity = activityData?.activity || []
  const remainingBudget = (config.total_budget || 0) - (agentData?.agent?.spent_amount || 0)
  const budgetUsedPercent = ((agentData?.agent?.spent_amount || 0) / (config.total_budget || 1)) * 100
  const totalReturn =
    totals.totalInvested > 0 ? ((totals.totalValue - totals.totalInvested) / totals.totalInvested) * 100 : 0
  const isPositive = totalReturn >= 0

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot className="w-7 h-7 text-primary-foreground" />
                </div>
                {config.is_active && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center">
                    <LivePulse active />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{config.name || "Investment Agent"}</h1>
                  {config.is_active && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <Radio className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">x402 Autonomous Investment Protocol</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunCycle}
                disabled={isRunning || !config.is_active}
                className="gap-2 bg-transparent"
              >
                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Scan Now
              </Button>

              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-card border shadow-sm">
                <span className="text-sm font-medium text-muted-foreground">Agent</span>
                <Switch
                  checked={config.is_active}
                  onCheckedChange={toggleAgent}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <div
                  className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    config.is_active ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {config.is_active ? "Active" : "Paused"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Portfolio Value Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Portfolio Value</p>
                  <p className="text-3xl font-bold tracking-tight">
                    $
                    {totals.totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                      isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-sm font-semibold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                      {isPositive ? "+" : ""}
                      {totalReturn.toFixed(2)}%
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">all time</span>
                </div>
                <MiniChart positive={isPositive} />
              </div>
            </CardContent>
          </Card>

          {/* Budget Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Available Budget</p>
                  <p className="text-3xl font-bold tracking-tight">
                    ${remainingBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-medium">{budgetUsedPercent.toFixed(1)}%</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, budgetUsedPercent)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trades Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Trades</p>
                  <p className="text-3xl font-bold tracking-tight">{stats.totalTrades}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">
                    <span className="font-semibold">{stats.successfulTrades}</span>
                    <span className="text-muted-foreground"> successful</span>
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({stats.totalTrades > 0 ? ((stats.successfulTrades / stats.totalTrades) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Realized P&L Card */}
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="pt-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Realized P&L</p>
                  <p
                    className={`text-3xl font-bold tracking-tight ${
                      totals.totalRealizedPnl >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {totals.totalRealizedPnl >= 0 ? "+" : ""}$
                    {Math.abs(totals.totalRealizedPnl).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">From</span>
                <span className="font-semibold">{portfolio.length}</span>
                <span className="text-muted-foreground">positions</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-4 md:space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-card/50 border p-1 h-auto w-full md:w-auto overflow-x-auto scrollbar-hide">
              <TabsTrigger
                value="portfolio"
                className="gap-1.5 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-2.5 md:px-4 py-2 min-w-fit"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Portfolio</span>
              </TabsTrigger>
              <TabsTrigger
                value="trades"
                className="gap-1.5 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-2.5 md:px-4 py-2 min-w-fit"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Trades</span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="gap-1.5 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-2.5 md:px-4 py-2 min-w-fit"
              >
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Activity</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-1.5 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-2.5 md:px-4 py-2 min-w-fit"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="mt-4 md:mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50 p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base md:text-lg">Holdings</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Your agent's current token positions
                    </CardDescription>
                  </div>
                  {portfolio.length > 0 && (
                    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto bg-transparent">
                      <Link href="/tokens">
                        View All Tokens
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {portfolio.length === 0 ? (
                  <div className="text-center py-12 md:py-16 px-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">No positions yet</h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">
                      Your agent will start acquiring tokens when activated. Enable the agent and run a scan to begin.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {portfolio.map((item: PortfolioItem, index: number) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="relative">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border">
                              <span className="text-xs md:text-sm font-bold">
                                {item.token_symbol?.slice(0, 2) || "??"}
                              </span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-background border flex items-center justify-center text-[9px] md:text-[10px] font-bold">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-sm md:text-base">{item.token_symbol}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">{item.token_name}</p>
                          </div>
                        </div>

                        <div className="flex justify-between sm:gap-6 pl-13 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <p className="font-mono font-medium text-sm md:text-base">{item.amount.toFixed(4)}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              ${item.total_invested.toFixed(2)} cost
                            </p>
                          </div>

                          <div className="text-right min-w-[80px] md:min-w-[100px]">
                            <p className="font-mono font-medium text-sm md:text-base">
                              ${item.current_value.toFixed(2)}
                            </p>
                            <p
                              className={`text-xs md:text-sm ${item.unrealized_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                            >
                              {item.unrealized_pnl >= 0 ? "+" : ""}
                              {item.unrealized_pnl.toFixed(2)} P&L
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="mt-4 md:mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">Recent Trades</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Your agent's latest trading activities
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {trades.length === 0 ? (
                  <div className="text-center py-12 md:py-16 px-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">No trades yet</h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">
                      Your agent will start executing trades when activated. Enable the agent and run a scan to begin.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {trades.map((trade: Trade) => (
                      <div
                        key={trade.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className="relative">
                            <div
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ring-1 ring-border ${trade.trade_type === "buy" ? "bg-emerald-500/20" : "bg-red-500/20"}`}
                            >
                              {trade.trade_type === "buy" ? (
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                              ) : (
                                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-sm md:text-base">{trade.token_symbol}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              {trade.trade_type === "buy" ? "Bought" : "Sold"} {trade.amount_in.toFixed(4)} tokens
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between sm:gap-6 pl-13 sm:pl-0">
                          <div className="text-left sm:text-right">
                            <p className="font-mono font-medium text-sm md:text-base">${trade.amount_out.toFixed(2)}</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              @ ${trade.price_per_token.toFixed(4)}/token
                            </p>
                          </div>

                          <div className="text-right min-w-[70px] md:min-w-[100px]">
                            <Badge
                              variant={
                                trade.status === "completed"
                                  ? "default"
                                  : trade.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-[10px] md:text-xs"
                            >
                              {trade.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[70px] md:max-w-[100px]">
                              {trade.trigger_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4 md:mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50 p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base md:text-lg">Activity Log</CardTitle>
                    <CardDescription className="text-xs md:text-sm">Your agent's recent activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activity.length === 0 ? (
                  <div className="text-center py-12 md:py-16 px-4">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold mb-2 text-sm md:text-base">No activities yet</h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto">
                      Your agent will start logging activities when activated. Enable the agent and run a scan to begin.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {activity.map((log: ActivityLog) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 md:gap-4 p-3 md:p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[10px] md:text-xs">
                              {log.activity_type}
                            </Badge>
                            <span className="text-[10px] md:text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{log.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4 md:mt-6">
            <div className="space-y-4 md:space-y-6">
              {/* Token Gate Status Card */}
              {tokenGateStatus && (
                <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                  <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Shield className="w-4 h-4 md:w-5 md:h-5" />
                      Access Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <div className="flex items-center gap-3">
                      {tokenGateStatus.status === "approved" ? (
                        <>
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-medium text-emerald-500">Access Granted</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              You hold {tokenGateStatus.formattedBalance} $USI ({tokenGateStatus.percentageOwned}%)
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="font-medium text-amber-500">Insufficient Balance</p>
                            <p className="text-xs md:text-sm text-muted-foreground">
                              Need {tokenGateStatus.formattedRequired} $USI (2% of supply)
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Budget & Limits */}
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                    Budget & Limits
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Configure spending limits for your agent
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Total Budget (USDC)</Label>
                      <Input
                        type="number"
                        value={config.total_budget || 0}
                        onChange={(e) => setConfig({ ...config, total_budget: Number.parseFloat(e.target.value) || 0 })}
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Maximum amount agent can invest</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Daily Limit (USDC)</Label>
                      <Input
                        type="number"
                        value={config.daily_limit || 0}
                        onChange={(e) => setConfig({ ...config, daily_limit: Number.parseFloat(e.target.value) || 0 })}
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Max spend per day</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Per Trade Limit (USDC)</Label>
                      <Input
                        type="number"
                        value={config.per_trade_limit || 0}
                        onChange={(e) =>
                          setConfig({ ...config, per_trade_limit: Number.parseFloat(e.target.value) || 0 })
                        }
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Max per single trade</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Max Portfolio % Per Token</Label>
                      <Input
                        type="number"
                        value={config.max_portfolio_percent || 0}
                        onChange={(e) =>
                          setConfig({ ...config, max_portfolio_percent: Number.parseFloat(e.target.value) || 0 })
                        }
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Diversification limit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Settings */}
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Target className="w-4 h-4 md:w-5 md:h-5" />
                    Strategy
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Choose your investment approach</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {["momentum", "value", "balanced"].map((strategy) => (
                      <button
                        key={strategy}
                        onClick={() => setConfig({ ...config, strategy_type: strategy })}
                        className={`p-3 md:p-4 rounded-xl border-2 transition-all text-left ${
                          config.strategy_type === strategy
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <p className="font-semibold capitalize text-sm md:text-base">{strategy}</p>
                        <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                          {strategy === "momentum" && "Follow price trends"}
                          {strategy === "value" && "Find undervalued tokens"}
                          {strategy === "balanced" && "Mixed approach"}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Shield className="w-4 h-4 md:w-5 md:h-5" />
                    Risk Management
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Protect your investments</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Stop Loss %</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={config.stop_loss_percent || 0}
                          onChange={(e) =>
                            setConfig({ ...config, stop_loss_percent: Number.parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 md:h-10 text-sm"
                        />
                        <span className="text-sm text-muted-foreground w-8">%</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Auto-sell if price drops</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Take Profit %</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={config.take_profit_percent || 0}
                          onChange={(e) =>
                            setConfig({ ...config, take_profit_percent: Number.parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 md:h-10 text-sm"
                        />
                        <span className="text-sm text-muted-foreground w-8">%</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Auto-sell if price rises</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Max Slippage %</Label>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          value={config.max_slippage || 0}
                          onChange={(e) =>
                            setConfig({ ...config, max_slippage: Number.parseFloat(e.target.value) || 0 })
                          }
                          className="h-9 md:h-10 text-sm"
                        />
                        <span className="text-sm text-muted-foreground w-8">%</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground">Trade tolerance</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Min Liquidity (USDC)</Label>
                      <Input
                        type="number"
                        value={config.min_liquidity || 0}
                        onChange={(e) =>
                          setConfig({ ...config, min_liquidity: Number.parseFloat(e.target.value) || 0 })
                        }
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Minimum pool liquidity</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Token Filters */}
              <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
                <CardHeader className="p-4 md:p-6 pb-3 md:pb-4">
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Filter className="w-4 h-4 md:w-5 md:h-5" />
                    Token Filters
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">Set criteria for token selection</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Min Holder Count</Label>
                      <Input
                        type="number"
                        value={config.min_holder_count || 0}
                        onChange={(e) =>
                          setConfig({ ...config, min_holder_count: Number.parseInt(e.target.value) || 0 })
                        }
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Minimum token holders</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs md:text-sm">Min Artist Followers</Label>
                      <Input
                        type="number"
                        value={config.min_artist_followers || 0}
                        onChange={(e) =>
                          setConfig({ ...config, min_artist_followers: Number.parseInt(e.target.value) || 0 })
                        }
                        className="h-9 md:h-10 text-sm"
                      />
                      <p className="text-[10px] md:text-xs text-muted-foreground">Artist social following</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button onClick={handleSaveConfig} disabled={isSaving} className="flex-1 h-10 md:h-11">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())
