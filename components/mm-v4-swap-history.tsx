import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowDown, ArrowUp, TrendingUp, TrendingDown, Zap, AlertCircle } from "lucide-react"
import useSWR from "swr"
import { cn } from "@/lib/utils"

interface SwapHistoryProps {
  agentId: string
}

export function MMV4SwapHistory({ agentId }: SwapHistoryProps) {
  const { data, isLoading, error } = useSWR(
    `/api/agents/mm/v4-support/history?agent_id=${agentId}`,
    (url) => fetch(url).then((r) => r.json()),
    { refreshInterval: 5000 }
  )

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Swap History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            Swap History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-400">Failed to load swap history</p>
        </CardContent>
      </Card>
    )
  }

  const swaps = data?.swaps || []
  const metrics = data?.metrics || {}

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-400" />
              Swap History & Metrics
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Last 50 swaps on Uniswap V4 pools
            </p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-sm font-semibold text-green-400">
                {metrics.successRate?.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-background/50 p-3 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground">Total Profit/Loss</p>
            <p
              className={cn(
                "text-sm font-semibold",
                metrics.totalProfitLoss >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              ${metrics.totalProfitLoss?.toFixed(2)}
            </p>
          </div>
          <div className="bg-background/50 p-3 rounded-lg border border-border/30">
            <p className="text-xs text-muted-foreground">Completed Swaps</p>
            <p className="text-sm font-semibold">{metrics.completedSwaps}</p>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-2 pr-4">
            {swaps.length === 0 ? (
              <div className="flex items-center justify-center h-[380px] text-muted-foreground">
                <p className="text-sm">No swaps yet</p>
              </div>
            ) : (
              swaps.map((swap) => (
                <div
                  key={swap.id}
                  className="flex items-start gap-3 p-3 bg-background/30 rounded-lg border border-border/30 hover:bg-background/50 transition-colors"
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                    swap.swap_direction === "buy"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  )}>
                    {swap.swap_direction === "buy" ? (
                      <ArrowDown className="h-4 w-4" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium capitalize">{swap.swap_direction}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          swap.status === "completed"
                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                            : swap.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                              : "bg-red-500/10 text-red-400 border-red-500/30"
                        )}
                      >
                        {swap.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ${swap.input_amount} → ${swap.output_amount}
                    </p>
                    {swap.profit_loss !== null && (
                      <p
                        className={cn(
                          "text-xs font-medium",
                          swap.profit_loss >= 0 ? "text-green-400" : "text-red-400"
                        )}
                      >
                        P&L: ${swap.profit_loss.toFixed(2)}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                    {new Date(swap.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
