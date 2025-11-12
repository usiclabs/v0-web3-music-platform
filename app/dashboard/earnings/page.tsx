"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, TrendingUp, Wallet, Zap, Download, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import { formatUnits } from "viem"
import { useReadContract } from "wagmi"
import { USDC_ADDRESS, ERC20_ABI } from "@/lib/web3/contracts"
import { useChainId } from "wagmi"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type DateRange = "7d" | "30d" | "90d" | "all"

export default function EarningsPage() {
  const { address, isConnected } = useWallet()
  const chainId = useChainId()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>("30d")
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [recentEarnings, setRecentEarnings] = useState(0)
  const [previousPeriodEarnings, setPreviousPeriodEarnings] = useState(0)
  const [earningsByTrack, setEarningsByTrack] = useState<any[]>([])
  const [earningsOverTime, setEarningsOverTime] = useState<any[]>([])
  const [totalStreams, setTotalStreams] = useState(0)

  const { data: walletBalance } = useReadContract({
    address: USDC_ADDRESS[chainId as keyof typeof USDC_ADDRESS],
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  })

  const formattedWalletBalance = walletBalance ? Number(formatUnits(walletBalance, 6)) : 0

  const getDateRangeStart = (range: DateRange) => {
    const now = new Date()
    switch (range) {
      case "7d":
        return new Date(now.setDate(now.getDate() - 7))
      case "30d":
        return new Date(now.setDate(now.getDate() - 30))
      case "90d":
        return new Date(now.setDate(now.getDate() - 90))
      case "all":
        return new Date(0)
    }
  }

  const growthPercentage =
    previousPeriodEarnings > 0 ? ((recentEarnings - previousPeriodEarnings) / previousPeriodEarnings) * 100 : 0

  useEffect(() => {
    async function loadEarnings() {
      if (!address) {
        setLoading(false)
        return
      }

      try {
        const supabase = createBrowserClient()

        const { data: streams } = await supabase
          .from("streams")
          .select("track_id, total_paid, last_played_at, tracks!inner(artist_id, title)")
          .eq("tracks.artist_id", address.toLowerCase())
          .order("last_played_at", { ascending: false })

        if (!streams) {
          setLoading(false)
          return
        }

        const total = streams.reduce((sum, s) => sum + Number(s.total_paid), 0)
        setTotalEarnings(total)
        setTotalStreams(streams.length)

        const rangeStart = getDateRangeStart(dateRange)
        const rangeStreams = streams.filter((s) => new Date(s.last_played_at) >= rangeStart)
        const rangeTotal = rangeStreams.reduce((sum, s) => sum + Number(s.total_paid), 0)
        setRecentEarnings(rangeTotal)

        const rangeDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365
        const previousStart = new Date(rangeStart)
        previousStart.setDate(previousStart.getDate() - rangeDays)
        const previousStreams = streams.filter(
          (s) => new Date(s.last_played_at) >= previousStart && new Date(s.last_played_at) < rangeStart,
        )
        const previousTotal = previousStreams.reduce((sum, s) => sum + Number(s.total_paid), 0)
        setPreviousPeriodEarnings(previousTotal)

        const trackEarnings = streams.reduce(
          (acc, stream) => {
            const trackId = stream.track_id
            if (!acc[trackId]) {
              acc[trackId] = {
                trackId,
                title: (stream.tracks as any).title,
                earnings: 0,
                streams: 0,
                lastPlayed: stream.last_played_at,
              }
            }
            acc[trackId].earnings += Number(stream.total_paid)
            acc[trackId].streams += 1
            return acc
          },
          {} as Record<
            string,
            { trackId: string; title: string; earnings: number; streams: number; lastPlayed: string }
          >,
        )

        const sortedEarnings = Object.values(trackEarnings).sort((a, b) => b.earnings - a.earnings)
        setEarningsByTrack(sortedEarnings)

        const earningsByDay = rangeStreams.reduce(
          (acc, stream) => {
            const date = new Date(stream.last_played_at).toLocaleDateString()
            if (!acc[date]) {
              acc[date] = 0
            }
            acc[date] += Number(stream.total_paid)
            return acc
          },
          {} as Record<string, number>,
        )

        const chartData = Object.entries(earningsByDay)
          .map(([date, earnings]) => ({
            date,
            earnings: Number(earnings.toFixed(2)),
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-30) // Last 30 data points

        setEarningsOverTime(chartData)
      } catch (error) {
        console.error("Failed to load earnings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadEarnings()
  }, [address, dateRange])

  const handleExport = () => {
    const csvContent = [
      ["Track", "Earnings (USDC)", "Streams", "Avg per Stream", "Last Played"],
      ...earningsByTrack.map((track) => [
        track.title,
        track.earnings.toFixed(2),
        track.streams,
        (track.earnings / track.streams).toFixed(2),
        new Date(track.lastPlayed).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `earnings-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32 bg-black">
        <main className="container py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to view your earnings history"
            icon={<DollarSign className="h-10 w-10 md:h-12 md:w-12 text-primary" />}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-12">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading earnings...</p>
          </div>
        </main>
      </div>
    )
  }

  const avgPerStream = totalStreams > 0 ? totalEarnings / totalStreams : 0

  return (
    <div className="min-h-screen pb-32">
      <main className="container py-8 md:py-12 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Earnings</h1>
            <p className="text-muted-foreground">Track your earnings history - all payments are instant</p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2 w-full md:w-auto bg-transparent">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border-primary/30 p-4 mb-6 hover:border-primary/50 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold mb-1">Instant Payments</p>
              <p className="text-sm text-muted-foreground">
                All earnings go directly to your wallet in real-time. No withdrawal needed - funds are available
                immediately.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["7d", "30d", "90d", "all"] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(range)}
              className="shrink-0"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
            </Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl border border-primary/30 p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Period Earnings</p>
            </div>
            <p className="text-3xl font-bold mb-2">{recentEarnings.toFixed(2)} USDC</p>
            <div className="flex items-center gap-2 text-xs">
              {growthPercentage !== 0 && (
                <span className={`flex items-center gap-1 ${growthPercentage > 0 ? "text-green-500" : "text-red-500"}`}>
                  {growthPercentage > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {Math.abs(growthPercentage).toFixed(1)}%
                </span>
              )}
              <span className="text-muted-foreground">vs previous period</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-xl border border-accent/30 p-6 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20 border border-accent/30">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">Lifetime Total</p>
            </div>
            <p className="text-3xl font-bold mb-2">{totalEarnings.toFixed(2)} USDC</p>
            <p className="text-xs text-muted-foreground">From {totalStreams.toLocaleString()} streams</p>
          </Card>

          <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 backdrop-blur-xl border border-chart-3/30 p-6 hover:border-chart-3/50 transition-all hover:shadow-lg hover:shadow-chart-3/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20 border border-chart-3/30">
                <Wallet className="h-5 w-5 text-chart-3" />
              </div>
              <p className="text-sm text-muted-foreground">Wallet Balance</p>
            </div>
            <p className="text-3xl font-bold mb-2">{formattedWalletBalance.toFixed(2)} USDC</p>
            <p className="text-xs text-muted-foreground">Available now</p>
          </Card>

          <Card className="bg-gradient-to-br from-chart-2/10 to-chart-2/5 backdrop-blur-xl border border-chart-2/30 p-6 hover:border-chart-2/50 transition-all hover:shadow-lg hover:shadow-chart-2/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/20 border border-chart-2/30">
                <DollarSign className="h-5 w-5 text-chart-2" />
              </div>
              <p className="text-sm text-muted-foreground">Avg per Stream</p>
            </div>
            <p className="text-3xl font-bold mb-2">{avgPerStream.toFixed(4)} USDC</p>
            <p className="text-xs text-muted-foreground">Average earnings</p>
          </Card>
        </div>

        {earningsOverTime.length > 0 && (
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-8">
            <h3 className="text-lg font-semibold mb-6">Earnings Over Time</h3>
            <ChartContainer
              config={{
                earnings: {
                  label: "Earnings (USDC)",
                  color: "hsl(180 100% 60%)",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="var(--color-earnings)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-earnings)", r: 5, strokeWidth: 2, stroke: "hsl(180 100% 80%)" }}
                    activeDot={{ r: 7, fill: "hsl(180 100% 70%)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        )}

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-6">Earnings by Track</h3>
          <div className="space-y-3">
            {earningsByTrack.length > 0 ? (
              earningsByTrack.map((track, index) => (
                <div
                  key={track.trackId}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 border border-primary/30 text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{track.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{track.streams} streams</span>
                        <span>•</span>
                        <span>{(track.earnings / track.streams).toFixed(4)} USDC/stream</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                          Last: {new Date(track.lastPlayed).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xl font-bold">{track.earnings.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">USDC</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20 mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-semibold mb-2">No earnings yet</p>
                <p className="text-sm text-muted-foreground">Start uploading tracks to earn from streams</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                <p className="font-semibold">USDC on Base</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Network</p>
                <p className="font-semibold">Base (Chain ID: 8453)</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                <p className="font-mono text-sm break-all">
                  {address ? `${address.slice(0, 10)}...${address.slice(-8)}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Payment Flow</p>
                <p className="font-semibold">Direct to Wallet (X402)</p>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
