"use client"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Card } from "@/components/ui/card"
import { TokenPriceChart } from "@/components/token-price-chart"
import { DollarSign, Activity, LineChart, ExternalLink, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import useSWR from "swr"

interface TokenMetricsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tokenData: {
    symbol: string
    price: string
    change: string
    volume: string
    marketCap: string
    contractAddress: string
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TokenMetricsModal({ open, onOpenChange, tokenData }: TokenMetricsModalProps) {
  const { toast } = useToast()

  // Fetch price history for the chart
  const { data: priceData, isLoading } = useSWR(
    open ? `/api/token/price-history/${tokenData.contractAddress}` : null,
    fetcher,
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    },
  )

  // Fetch additional token metrics from DexScreener
  const { data: dexData } = useSWR(
    open ? `https://api.dexscreener.com/latest/dex/tokens/${tokenData.contractAddress}` : null,
    fetcher,
    {
      refreshInterval: 30000,
    },
  )

  const pair = dexData?.pairs?.[0]
  const isPositive = tokenData.change.startsWith("+")

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const formatLiquidity = (liquidity: any) => {
    if (!liquidity?.usd) return "N/A"
    const num = Number.parseFloat(liquidity.usd)
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`
    return `$${num.toFixed(2)}`
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent className="h-full w-full sm:max-w-2xl bg-background/80 backdrop-blur-2xl border-l border-border/50">
        <div className="flex flex-col h-full overflow-hidden">
          <DrawerHeader className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-primary" />
                  USI Token Metrics
                </DrawerTitle>
                <DrawerDescription className="text-muted-foreground mt-1">
                  Real-time analytics and performance metrics
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                  Current Price
                </p>
                <p className="text-2xl font-bold text-primary">{tokenData.price}</p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                  24h Change
                </p>
                <p className={`text-2xl font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
                  {tokenData.change}
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                  24h Volume
                </p>
                <p className="text-2xl font-bold text-blue-400">{tokenData.volume}</p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                  Market Cap
                </p>
                <p className="text-2xl font-bold text-primary">{tokenData.marketCap}</p>
              </Card>
            </div>

            {/* Additional Metrics from DexScreener */}
            {pair && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                  <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                    Liquidity
                  </p>
                  <p className="text-xl font-bold text-foreground">{formatLiquidity(pair.liquidity)}</p>
                </Card>

                <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                  <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
                    24h Transactions
                  </p>
                  <p className="text-xl font-bold text-foreground">
                    {pair.txns?.h24?.buys + pair.txns?.h24?.sells || "N/A"}
                  </p>
                </Card>

                <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 group">
                  <p className="text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">DEX</p>
                  <p className="text-xl font-bold text-foreground">{pair.dexId || "Uniswap"}</p>
                </Card>
              </div>
            )}

            {/* Price Chart */}
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                <span>Price Chart (7 Days)</span>
              </h3>
              {isLoading ? (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  <Activity className="h-6 w-6 animate-spin mr-2" />
                  Loading chart data...
                </div>
              ) : priceData?.priceHistory && priceData.priceHistory.length > 0 ? (
                <TokenPriceChart data={priceData.priceHistory} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No price history available yet
                </div>
              )}
            </Card>

            {/* Contract Information */}
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:bg-card/70 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <span>Contract Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors">
                  <span className="text-sm text-muted-foreground">Contract Address</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-foreground">
                      {tokenData.contractAddress.slice(0, 6)}...{tokenData.contractAddress.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(tokenData.contractAddress, "Contract address")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 backdrop-blur-sm hover:bg-background/70 transition-colors">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm font-semibold text-foreground">Base</span>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                    onClick={() => window.open(`https://basescan.org/token/${tokenData.contractAddress}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on BaseScan
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-background/50 backdrop-blur-sm hover:bg-background/80"
                    onClick={() => window.open(`https://dexscreener.com/base/${tokenData.contractAddress}`, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on DexScreener
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
