"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2, TrendingUp, TrendingDown, Users, Clock, Target, ExternalLink, Sparkles } from "lucide-react"
import { formatDistanceToNow, format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Label } from "@/components/ui/label"
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts"

interface MarketDetails {
  id: string
  title: string
  description: string
  category: string
  target_name: string
  target_image_url: string | null
  outcome_threshold: number
  outcome_metric: string
  outcome_operator: string
  resolution_date: string
  yes_probability: number
  no_probability: number
  total_volume: number
  yes_pool: number
  no_pool: number
  is_active: boolean
  resolution_value: number | null
  outcome_result: boolean | null
}

interface Position {
  outcome_side: string
  shares: number
  avg_price: number
  total_invested: number
  unrealized_pnl: number
}

export default function MarketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const [market, setMarket] = useState<MarketDetails | null>(null)
  const [position, setPosition] = useState<Position | null>(null)
  const [activeTab, setActiveTab] = useState("buy")
  const [selectedOutcome, setSelectedOutcome] = useState<"YES" | "NO">("YES")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(true)
  const [trading, setTrading] = useState(false)
  const [priceHistory, setPriceHistory] = useState<any[]>([])

  useEffect(() => {
    if (params.id && params.id !== "create") {
      fetchMarket()
      if (address) {
        fetchPosition()
      }
    }

    let interval: NodeJS.Timeout | undefined
    if (params.id && params.id !== "create") {
      interval = setInterval(() => {
        fetchMarket()
        if (address) {
          fetchPosition()
        }
      }, 5000)
    }

    if (params.id && params.id !== "create") {
      fetchPriceHistory()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [params.id, address])

  const fetchMarket = async () => {
    try {
      const res = await fetch(`/api/predictions/markets/${params.id}`)
      const data = await res.json()
      setMarket(data)
    } catch (error) {
      console.error("[v0] Error fetching market:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosition = async () => {
    try {
      const res = await fetch(`/api/predictions/positions/${params.id}?address=${address}`)
      const data = await res.json()
      setPosition(data)
    } catch (error) {
      console.error("[v0] Error fetching position:", error)
    }
  }

  const fetchPriceHistory = async () => {
    try {
      const res = await fetch(`/api/predictions/markets/${params.id}/history`)
      const data = await res.json()
      setPriceHistory(data)
    } catch (error) {
      console.error("[v0] Error fetching price history:", error)
    }
  }

  const handleTrade = async () => {
    if (!address || !amount || !market) return

    setTrading(true)
    try {
      const res = await fetch("/api/predictions/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketId: market.id,
          userAddress: address,
          tradeType: activeTab.toUpperCase(),
          outcomeSide: selectedOutcome,
          amount: activeTab === "sell" && position ? Number.parseFloat(amount) : Number.parseFloat(amount),
        }),
      })

      if (res.ok) {
        await fetchMarket()
        await fetchPosition()
        setAmount("")
      }
    } catch (error) {
      console.error("[v0] Trade error:", error)
    } finally {
      setTrading(false)
    }
  }

  const estimateShares = () => {
    if (!amount || !market) return 0
    const investAmount = Number.parseFloat(amount)
    const pool = selectedOutcome === "YES" ? market.yes_pool : market.no_pool
    const oppositePool = selectedOutcome === "YES" ? market.no_pool : market.yes_pool

    // AMM formula: shares = pool * (1 - (oppositePool / (oppositePool + amount)))
    return pool * (1 - oppositePool / (oppositePool + investAmount))
  }

  if (loading || !market) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="h-96 animate-pulse lg:col-span-2" />
            <Card className="h-96 animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" className="gap-2 h-9" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent h-9">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2 order-2 lg:order-1">
            <Card className="overflow-hidden">
              <div className="relative bg-gradient-to-br from-accent/10 via-accent/5 to-background p-4 sm:p-8">
                <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_top,transparent_50%,black)]" />

                <div className="relative">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {market.target_image_url && (
                      <img
                        src={market.target_image_url || "/placeholder.svg"}
                        alt={market.target_name}
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl object-cover ring-4 ring-background"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="gap-1 text-xs">
                          <Target className="h-3 w-3" />
                          {market.category}
                        </Badge>
                        <Badge variant={market.is_active ? "default" : "secondary"} className="text-xs">
                          {market.is_active ? "Active" : "Resolved"}
                        </Badge>
                      </div>
                      <h1 className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold leading-tight">{market.title}</h1>
                      <p className="mt-2 text-sm sm:text-base text-muted-foreground line-clamp-3 sm:line-clamp-none">
                        {market.description}
                      </p>

                      <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 rounded-full bg-background px-3 sm:px-4 py-1.5 sm:py-2">
                        <span className="text-xs sm:text-sm font-medium truncate">{market.target_name}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-8">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-muted/50 to-background p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6 flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        YES
                      </div>
                      <p className="font-mono text-3xl sm:text-5xl font-bold text-emerald-500">
                        {market.yes_probability}%
                      </p>
                      <p className="text-xs text-muted-foreground">${market.yes_pool.toFixed(0)} pool</p>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="flex items-center justify-end gap-2 text-xs sm:text-sm text-muted-foreground">
                        NO
                        <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <p className="font-mono text-3xl sm:text-5xl font-bold text-red-500">{market.no_probability}%</p>
                      <p className="text-xs text-muted-foreground">${market.no_pool.toFixed(0)} pool</p>
                    </div>
                  </div>

                  <div className="relative h-3 sm:h-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-500/20 via-muted to-emerald-500/20">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${market.yes_probability}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 sm:mt-8 grid grid-cols-3 gap-3 sm:gap-4">
                  <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center transition-all hover:border-accent">
                    <p className="text-xs sm:text-sm text-muted-foreground">Volume</p>
                    <p className="mt-1 font-mono text-base sm:text-2xl font-bold">
                      $
                      {market.total_volume >= 1000
                        ? `${(market.total_volume / 1000).toFixed(1)}K`
                        : market.total_volume.toFixed(0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center transition-all hover:border-accent">
                    <p className="text-xs sm:text-sm text-muted-foreground">Resolves</p>
                    <p className="mt-1 font-mono text-base sm:text-2xl font-bold">
                      <span className="hidden sm:inline">{formatDistanceToNow(new Date(market.resolution_date))}</span>
                      <span className="sm:hidden">
                        {formatDistanceToNow(new Date(market.resolution_date), { addSuffix: false }).split(" ")[0]}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 sm:p-4 text-center transition-all hover:border-accent">
                    <Clock className="mx-auto h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <p className="mt-1 text-xs sm:text-sm font-medium">
                      {format(new Date(market.resolution_date), "MMM d")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-accent/10 p-2 shrink-0">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base">Resolution Criteria</p>
                      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        This market resolves <span className="font-semibold text-foreground">YES</span> if{" "}
                        <span className="font-semibold text-foreground">{market.target_name}</span> reaches{" "}
                        <span className="font-semibold text-foreground">
                          {market.outcome_operator} {market.outcome_threshold.toLocaleString()}
                        </span>{" "}
                        {market.outcome_metric.replace("_", " ")} by{" "}
                        <span className="font-semibold text-foreground">
                          {format(new Date(market.resolution_date), "MMMM d, yyyy")}
                        </span>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <Card className="lg:sticky lg:top-24 overflow-hidden">
              <div className="bg-gradient-to-br from-accent/5 to-background p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold">Trade</h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Buy or sell outcome shares</p>
              </div>

              <div className="p-4 sm:p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 h-10">
                    <TabsTrigger value="buy" className="text-sm">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="text-sm" disabled={!position}>
                      Sell
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        variant={selectedOutcome === "YES" ? "default" : "outline"}
                        size="lg"
                        className={`flex-col gap-1 h-auto py-3 sm:py-4 transition-all ${
                          selectedOutcome === "YES"
                            ? "bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                            : "hover:border-emerald-500/50"
                        }`}
                        onClick={() => setSelectedOutcome("YES")}
                      >
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs">YES</span>
                        <span className="text-base sm:text-lg font-bold">{market.yes_probability}%</span>
                      </Button>
                      <Button
                        variant={selectedOutcome === "NO" ? "default" : "outline"}
                        size="lg"
                        className={`flex-col gap-1 h-auto py-3 sm:py-4 transition-all ${
                          selectedOutcome === "NO"
                            ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                            : "hover:border-red-500/50"
                        }`}
                        onClick={() => setSelectedOutcome("NO")}
                      >
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="text-xs">NO</span>
                        <span className="text-base sm:text-lg font-bold">{market.no_probability}%</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (USDC)</label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="h-11 sm:h-12 text-base sm:text-lg"
                      />
                    </div>

                    {amount && (
                      <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-3 sm:p-4">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Est. Shares</span>
                          <span className="font-mono font-bold">{estimateShares().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Avg Price</span>
                          <span className="font-mono">
                            ${(Number.parseFloat(amount) / estimateShares()).toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-3 text-xs sm:text-sm">
                          <span className="font-medium">Potential</span>
                          <span className="font-mono font-bold text-emerald-500">${estimateShares().toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          If {selectedOutcome} wins, you receive $1.00 per share
                        </p>
                      </div>
                    )}

                    <Button
                      className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
                      size="lg"
                      onClick={handleTrade}
                      disabled={!address || !amount || trading}
                    >
                      {!address ? "Connect Wallet" : trading ? "Processing..." : `Buy ${selectedOutcome}`}
                    </Button>
                  </TabsContent>

                  <TabsContent value="sell" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                    {position ? (
                      <>
                        <div className="rounded-xl border border-border bg-muted/50 p-3 sm:p-4 space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Your Shares</span>
                            <span className="font-mono font-bold">{position.shares.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Entry</span>
                            <span className="font-mono">${position.avg_price.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-3 text-sm">
                            <span className="font-medium">Current P&L</span>
                            <span
                              className={`font-mono font-bold ${position.unrealized_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                            >
                              {position.unrealized_pnl >= 0 ? "+" : ""}${position.unrealized_pnl.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sell-amount" className="text-sm">
                            Shares to Sell
                          </Label>
                          <Input
                            id="sell-amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            max={position.shares}
                            className="h-11 sm:h-12 text-base sm:text-lg"
                          />
                          <p className="text-xs text-muted-foreground">Max: {position.shares.toFixed(2)} shares</p>
                        </div>

                        {amount && (
                          <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-3 sm:p-4">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground">Est. Proceeds</span>
                              <span className="font-mono font-bold">
                                ${(Number.parseFloat(amount) * position.avg_price).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground">Current Market Price</span>
                              <span className="font-mono">${position.avg_price.toFixed(4)}</span>
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold shadow-lg transition-all hover:shadow-xl"
                          size="lg"
                          onClick={handleTrade}
                          disabled={!address || !amount || Number.parseFloat(amount) > position.shares || trading}
                          variant="destructive"
                        >
                          {trading ? "Processing..." : `Sell ${Number.parseFloat(amount).toFixed(2)} Shares`}
                        </Button>
                      </>
                    ) : (
                      <div className="rounded-xl border border-border bg-muted/30 p-6 sm:p-8 text-center">
                        <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                        <p className="mt-4 text-xs sm:text-sm text-muted-foreground">
                          Buy shares first to enable selling
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {position && (
                  <div className="mt-4 sm:mt-6 space-y-4 rounded-xl border border-accent/20 bg-accent/5 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">Your Position</p>
                      <Badge
                        variant={position.outcome_side === "YES" ? "default" : "destructive"}
                        className="font-mono text-xs"
                      >
                        {position.outcome_side}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Shares</span>
                        <span className="font-mono font-medium">{position.shares.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Invested</span>
                        <span className="font-mono font-medium">${position.total_invested.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-2 text-xs sm:text-sm">
                        <span className="font-medium">P&L</span>
                        <span
                          className={`font-mono font-bold ${
                            position.unrealized_pnl >= 0 ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {position.unrealized_pnl >= 0 ? "+" : ""}${position.unrealized_pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-6xl mt-8">
        <Card>
          <div className="p-4 sm:p-6">
            <h3 className="font-semibold mb-4">Price History</h3>
            {priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="yesProbability" stroke="#10b981" name="YES Probability" />
                  <Line type="monotone" dataKey="noProbability" stroke="#ef4444" name="NO Probability" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No price history available
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
