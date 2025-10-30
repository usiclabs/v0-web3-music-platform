"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { createClient } from "@/lib/supabase/client"
import { Activity, TrendingUp, TrendingDown, Clock, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SwapHistory {
  id: string
  user_address: string
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string
  tx_hash: string
  created_at: string
}

interface TokenTradingHistoryProps {
  tokenAddress: string
  limit?: number
}

export function TokenTradingHistory({ tokenAddress, limit = 5 }: TokenTradingHistoryProps) {
  const [history, setHistory] = useState<SwapHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [tokenAddress])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("swap_history")
        .select("*")
        .or(`token_in.eq.${tokenAddress},token_out.eq.${tokenAddress}`)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error
      setHistory(data || [])
    } catch (error) {
      console.error("[v0] Failed to load trading history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isLoading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Trades
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No trades yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Recent Trades
        </CardTitle>
        <CardDescription className="text-xs">Last {history.length} transactions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {history.map((swap) => {
          const isBuy = swap.token_out.toLowerCase() === tokenAddress.toLowerCase()
          return (
            <div
              key={swap.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`p-1.5 rounded-full ${isBuy ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  {isBuy ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant={isBuy ? "default" : "secondary"} className="text-xs">
                      {isBuy ? "Buy" : "Sell"}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">{formatAddress(swap.user_address)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(swap.created_at), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <a
                href={`https://basescan.org/tx/${swap.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
