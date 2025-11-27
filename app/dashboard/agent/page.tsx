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
  Radio,
} from "lucide-react"
import useSWR, { mutate } from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

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
      <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden">
        {/* Animated background grid */}
        <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black_40%,transparent_100%)]" />

        {/* Floating orbs */}
        <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative max-w-2xl w-full">
          {/* Ambient glow effect */}
          <div className="absolute -inset-2 bg-gradient-to-r from-primary/30 via-emerald-500/20 to-primary/30 rounded-3xl blur-2xl opacity-50" />

          <Card className="relative border-0 bg-card/90 backdrop-blur-2xl shadow-2xl overflow-hidden">
            {/* Top gradient border */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

            <CardContent className="pt-16 pb-12 px-8 md:px-12 text-center">
              {/* Animated robot icon */}
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-emerald-500/30 blur-xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/30 shadow-lg">
                  <Bot className="w-12 h-12 text-primary" />
                  {/* Pulsing dot */}
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
                x402 Investment Agent
              </h1>
              <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
                Your autonomous AI-powered trading companion for the music token economy
              </p>

              {/* Feature grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="group p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-emerald-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Autonomous</h3>
                  <p className="text-sm text-muted-foreground">24/7 market scanning and execution</p>
                </div>

                <div className="group p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-blue-500" />
                  </div>
                  <h3 className="font-semibold mb-1">Protected</h3>
                  <p className="text-sm text-muted-foreground">Built-in risk management</p>
                </div>

                <div className="group p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 hover:border-primary/30 transition-all duration-300">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Strategic</h3>
                  <p className="text-sm text-muted-foreground">Multi-signal analysis engine</p>
                </div>
              </div>

              {/* Stats preview */}
              <div className="flex items-center justify-center gap-8 mb-10 py-4 border-y border-border/50">
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono">4</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Strategies</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono">24/7</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Monitoring</p>
                </div>
                <div className="w-px h-8 bg-border/50" />
                <div className="text-center">
                  <p className="text-2xl font-bold font-mono">x402</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Protocol</p>
                </div>
              </div>

              {/* CTA text */}
              <p className="text-sm text-muted-foreground">Connect your wallet to activate your agent</p>
            </CardContent>
          </Card>

          {/* Bottom badge */}
          <div className="flex justify-center mt-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur border border-border/50 text-sm text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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

        <Tabs defaultValue="portfolio" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-card/50 border p-1 h-auto">
              <TabsTrigger
                value="portfolio"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <Wallet className="w-4 h-4" />
                <span>Portfolio</span>
              </TabsTrigger>
              <TabsTrigger
                value="trades"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <Activity className="w-4 h-4" />
                <span>Trades</span>
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <Clock className="w-4 h-4" />
                <span>Activity</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Holdings</CardTitle>
                    <CardDescription>Your agent's current token positions</CardDescription>
                  </div>
                  {portfolio.length > 0 && (
                    <Button variant="outline" size="sm" asChild>
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
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold mb-2">No positions yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Your agent will start acquiring tokens when activated. Enable the agent and run a scan to begin.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {portfolio.map((item: PortfolioItem, index: number) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border">
                              <span className="text-sm font-bold">{item.token_symbol?.slice(0, 2) || "??"}</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border flex items-center justify-center text-[10px] font-bold">
                              {index + 1}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">{item.token_symbol}</p>
                            <p className="text-sm text-muted-foreground">{item.token_name}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-medium">{item.amount.toFixed(4)}</p>
                          <p className="text-sm text-muted-foreground">${item.total_invested.toFixed(2)} cost</p>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="font-mono font-medium">${item.current_value.toFixed(2)} value</p>
                          <p className="text-sm text-muted-foreground">
                            {item.unrealized_pnl.toFixed(2)} unrealized P&L
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trades Tab */}
          <TabsContent value="trades" className="mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Trades</CardTitle>
                    <CardDescription>Your agent's latest trading activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {trades.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold mb-2">No trades yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Your agent will start executing trades when activated. Enable the agent and run a scan to begin.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {trades.map((trade: Trade) => (
                      <div
                        key={trade.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border">
                              <span className="text-sm font-bold">{trade.token_symbol?.slice(0, 2) || "??"}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">{trade.token_symbol}</p>
                            <p className="text-sm text-muted-foreground">
                              {trade.trade_type === "buy" ? "Bought" : "Sold"} {trade.amount_in.toFixed(4)} tokens
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-medium">${trade.amount_out.toFixed(2)} amount</p>
                          <p className="text-sm text-muted-foreground">
                            ${trade.price_per_token.toFixed(2)} price per token
                          </p>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="font-mono font-medium">{trade.status}</p>
                          <p className="text-sm text-muted-foreground">{trade.trigger_reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Activity Log</CardTitle>
                    <CardDescription>Your agent's recent activities</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {activity.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="font-semibold mb-2">No activities yet</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Your agent will start logging activities when activated. Enable the agent and run a scan to begin.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {activity.map((log: ActivityLog) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-border">
                              <span className="text-sm font-bold">{log.activity_type}</span>
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold">{log.activity_type}</p>
                            <p className="text-sm text-muted-foreground">{log.description}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-medium">{log.created_at}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Settings</CardTitle>
                    <CardDescription>Configure your agent's settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">{/* Settings form here */}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
