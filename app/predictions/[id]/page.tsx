"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Share2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useAccount } from "wagmi"

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

  useEffect(() => {
    if (params.id) {
      fetchMarket()
      if (address) {
        fetchPosition()
      }
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
          amount: Number.parseFloat(amount),
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
        <div className="container mx-auto">
          <Card className="h-96 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            Back to Markets
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {/* Market Title */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Badge className="mb-3">{market.category}</Badge>
                  <h1 className="text-3xl font-bold">{market.title}</h1>
                  <p className="mt-2 text-muted-foreground">{market.description}</p>

                  {/* Target Info */}
                  <div className="mt-4 flex items-center gap-3">
                    {market.target_image_url && (
                      <img
                        src={market.target_image_url || "/placeholder.svg"}
                        alt={market.target_name}
                        className="h-10 w-10 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Target</p>
                      <p className="font-semibold">{market.target_name}</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Probability Chart */}
              <div className="mt-8 rounded-lg border border-border bg-muted/30 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">YES</p>
                    <p className="mt-1 text-4xl font-bold text-emerald-500">{market.yes_probability}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">NO</p>
                    <p className="mt-1 text-4xl font-bold text-red-500">{market.no_probability}%</p>
                  </div>
                </div>
                <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-background">
                  <div className="h-full bg-emerald-500" style={{ width: `${market.yes_probability}%` }} />
                </div>
              </div>

              {/* Market Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="mt-1 text-xl font-bold">${market.total_volume.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Resolves</p>
                  <p className="mt-1 text-xl font-bold">{formatDistanceToNow(new Date(market.resolution_date))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="mt-1" variant={market.is_active ? "default" : "secondary"}>
                    {market.is_active ? "Active" : "Resolved"}
                  </Badge>
                </div>
              </div>

              {/* Resolution Criteria */}
              <div className="mt-8 rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Resolution Criteria</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Resolves YES if {market.target_name} reaches {market.outcome_operator}{" "}
                  {market.outcome_threshold.toLocaleString()} {market.outcome_metric.replace("_", " ")} by{" "}
                  {new Date(market.resolution_date).toLocaleDateString()}.
                </p>
              </div>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy">Buy</TabsTrigger>
                  <TabsTrigger value="sell">Sell</TabsTrigger>
                </TabsList>

                <TabsContent value="buy" className="mt-6">
                  {/* Outcome Selection */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedOutcome === "YES" ? "default" : "outline"}
                      className={selectedOutcome === "YES" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                      onClick={() => setSelectedOutcome("YES")}
                    >
                      YES {market.yes_probability}%
                    </Button>
                    <Button
                      variant={selectedOutcome === "NO" ? "default" : "outline"}
                      className={selectedOutcome === "NO" ? "bg-red-500 hover:bg-red-600" : ""}
                      onClick={() => setSelectedOutcome("NO")}
                    >
                      NO {market.no_probability}%
                    </Button>
                  </div>

                  {/* Amount Input */}
                  <div className="mt-6">
                    <label className="text-sm text-muted-foreground">Amount (USDC)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  {/* Estimate */}
                  {amount && (
                    <div className="mt-4 rounded-lg bg-muted/30 p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Shares</span>
                        <span className="font-mono font-semibold">{estimateShares().toFixed(2)}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg. Price</span>
                        <span className="font-mono">${(Number.parseFloat(amount) / estimateShares()).toFixed(4)}</span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span className="text-muted-foreground">Max Payout</span>
                        <span className="font-mono font-semibold text-emerald-500">${estimateShares().toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Buy Button */}
                  <Button
                    className="mt-6 w-full"
                    size="lg"
                    onClick={handleTrade}
                    disabled={!address || !amount || trading}
                  >
                    {!address ? "Connect Wallet" : trading ? "Processing..." : `Buy ${selectedOutcome}`}
                  </Button>
                </TabsContent>

                <TabsContent value="sell" className="mt-6">
                  <p className="text-center text-sm text-muted-foreground">Sell functionality coming soon</p>
                </TabsContent>
              </Tabs>

              {/* User Position */}
              {position && (
                <div className="mt-6 rounded-lg border border-border p-4">
                  <p className="text-sm font-semibold">Your Position</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Side</span>
                      <Badge variant={position.outcome_side === "YES" ? "default" : "destructive"}>
                        {position.outcome_side}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shares</span>
                      <span className="font-mono">{position.shares.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Invested</span>
                      <span className="font-mono">${position.total_invested.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">P&L</span>
                      <span
                        className={`font-mono font-semibold ${position.unrealized_pnl >= 0 ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {position.unrealized_pnl >= 0 ? "+" : ""}${position.unrealized_pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
