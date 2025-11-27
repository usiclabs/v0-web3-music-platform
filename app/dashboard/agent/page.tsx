"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from "lucide-react"
import useSWR, { mutate } from "swr"

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
        // Refresh all data
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to access the x402 Investment Agent</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const portfolio = portfolioData?.portfolio || []
  const totals = portfolioData?.totals || { totalInvested: 0, totalValue: 0, totalRealizedPnl: 0 }
  const trades = tradesData?.trades || []
  const stats = tradesData?.stats || { totalTrades: 0, successfulTrades: 0 }
  const activity = activityData?.activity || []
  const remainingBudget = (config.total_budget || 0) - (agentData?.agent?.spent_amount || 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{config.name || "Investment Agent"}</h1>
              <p className="text-muted-foreground text-sm">Autonomous x402 token investment agent</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRunCycle} disabled={isRunning || !config.is_active}>
              {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Run Scan
            </Button>

            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border">
              <span className="text-sm text-muted-foreground">Agent</span>
              <Switch checked={config.is_active} onCheckedChange={toggleAgent} />
              <Badge variant={config.is_active ? "default" : "secondary"}>
                {config.is_active ? "Active" : "Paused"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">${totals.totalValue.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                {totals.totalValue >= totals.totalInvested ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                )}
                <span className={totals.totalValue >= totals.totalInvested ? "text-green-500" : "text-red-500"}>
                  {totals.totalInvested > 0
                    ? (((totals.totalValue - totals.totalInvested) / totals.totalInvested) * 100).toFixed(1)
                    : 0}
                  %
                </span>
                <span className="text-muted-foreground ml-1">all time</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Budget</p>
                  <p className="text-2xl font-bold">${remainingBudget.toFixed(2)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="mt-2">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, (remainingBudget / (config.total_budget || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                  <p className="text-2xl font-bold">{stats.totalTrades}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {stats.successfulTrades} successful (
                {stats.totalTrades > 0 ? ((stats.successfulTrades / stats.totalTrades) * 100).toFixed(0) : 0}%)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Realized P&L</p>
                  <p
                    className={`text-2xl font-bold ${totals.totalRealizedPnl >= 0 ? "text-green-500" : "text-red-500"}`}
                  >
                    {totals.totalRealizedPnl >= 0 ? "+" : ""}${totals.totalRealizedPnl.toFixed(2)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-yellow-500" />
                </div>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">From {portfolio.length} positions</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="portfolio" className="gap-2">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="trades" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Trades</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio">
            <Card>
              <CardHeader>
                <CardTitle>Holdings</CardTitle>
                <CardDescription>Your agent's current token positions</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolio.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No positions yet</p>
                    <p className="text-sm">Your agent will start acquiring tokens when activated</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {portfolio.map((item: PortfolioItem) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-bold">{item.token_symbol?.slice(0, 2) || "??"}</span>
                          </div>
                          <div>
                            <p className="font-medium">{item.token_symbol}</p>
                            <p className="text-sm text-muted-foreground">{item.token_name}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-medium">{item.amount.toFixed(4)}</p>
                          <p className="text-sm text-muted-foreground">${item.total_invested.toFixed(2)} invested</p>
                        </div>

                        <div className="text-right">
                          <p className={`font-medium ${item.unrealized_pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {item.unrealized_pnl >= 0 ? "+" : ""}${item.unrealized_pnl.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.total_invested > 0
                              ? `${((item.unrealized_pnl / item.total_invested) * 100).toFixed(1)}%`
                              : "0%"}
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
          <TabsContent value="trades">
            <Card>
              <CardHeader>
                <CardTitle>Trade History</CardTitle>
                <CardDescription>All trades executed by your agent</CardDescription>
              </CardHeader>
              <CardContent>
                {trades.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No trades yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trades.map((trade: Trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              trade.trade_type === "buy"
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {trade.trade_type === "buy" ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {trade.trade_type === "buy" ? "Bought" : "Sold"} {trade.token_symbol}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(trade.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-medium">
                            {trade.trade_type === "buy"
                              ? `$${trade.amount_in} → ${trade.amount_out.toFixed(4)}`
                              : `${trade.amount_in.toFixed(4)} → $${trade.amount_out}`}
                          </p>
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">{trade.trigger_reason}</p>
                        </div>

                        <Badge variant={trade.status === "confirmed" ? "default" : "secondary"}>{trade.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
                <CardDescription>Recent agent activity and events</CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activity.map((log: ActivityLog) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                        <div
                          className={`w-2 h-2 mt-2 rounded-full ${
                            log.activity_type === "error"
                              ? "bg-red-500"
                              : log.activity_type === "trade"
                                ? "bg-green-500"
                                : "bg-blue-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{log.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {log.activity_type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Budget Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Budget Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Agent Name</Label>
                    <Input
                      value={config.name || ""}
                      onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="My Investment Agent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Budget (USDC)</Label>
                    <Input
                      type="number"
                      value={config.total_budget || 0}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, total_budget: Number.parseFloat(e.target.value) || 0 }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">Maximum amount the agent can invest</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Daily Limit (USDC): ${config.daily_limit}</Label>
                    <Slider
                      value={[config.daily_limit || 10]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, daily_limit: value }))}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Per-Trade Limit (USDC): ${config.per_trade_limit}</Label>
                    <Slider
                      value={[config.per_trade_limit || 1]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, per_trade_limit: value }))}
                      min={0.1}
                      max={50}
                      step={0.1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Strategy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Strategy Type</Label>
                    <Select
                      value={config.strategy_type}
                      onValueChange={(value) => setConfig((prev) => ({ ...prev, strategy_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="momentum">Momentum - Focus on price action</SelectItem>
                        <SelectItem value="value">Value - Focus on undervalued tokens</SelectItem>
                        <SelectItem value="balanced">Balanced - Equal weight all factors</SelectItem>
                        <SelectItem value="custom">Custom - Manual configuration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Liquidity (USDC): ${config.min_liquidity}</Label>
                    <Slider
                      value={[config.min_liquidity || 1000]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, min_liquidity: value }))}
                      min={100}
                      max={50000}
                      step={100}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Slippage: {config.max_slippage}%</Label>
                    <Slider
                      value={[config.max_slippage || 5]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, max_slippage: value }))}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Minimum Holders: {config.min_holder_count}</Label>
                    <Slider
                      value={[config.min_holder_count || 10]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, min_holder_count: value }))}
                      min={1}
                      max={500}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Risk Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Stop Loss: {config.stop_loss_percent}%</Label>
                    <Slider
                      value={[config.stop_loss_percent || 20]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, stop_loss_percent: value }))}
                      min={5}
                      max={50}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically sell if position drops by this percentage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Take Profit: {config.take_profit_percent}%</Label>
                    <Slider
                      value={[config.take_profit_percent || 50]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, take_profit_percent: value }))}
                      min={10}
                      max={200}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Automatically sell if position gains this percentage
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Max Portfolio Per Token: {config.max_portfolio_percent}%</Label>
                    <Slider
                      value={[config.max_portfolio_percent || 10]}
                      onValueChange={([value]) => setConfig((prev) => ({ ...prev, max_portfolio_percent: value }))}
                      min={5}
                      max={50}
                      step={5}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <Card className="lg:col-span-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Save Configuration</p>
                      <p className="text-sm text-muted-foreground">Update your agent settings</p>
                    </div>
                    <Button onClick={handleSaveConfig} disabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Settings className="w-4 h-4 mr-2" />
                      )}
                      {isSaving ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
