"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, ArrowRight } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { formatDistanceToNow } from "date-fns"
import { formatUnits } from "viem"

interface SwapHistoryItem {
  id: string
  user_address: string
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string
  tx_hash: string
  created_at: string
}

interface TokenSwapHistoryProps {
  tokenAddress?: string
  userAddress?: string
  limit?: number
}

export function TokenSwapHistory({ tokenAddress, userAddress, limit = 20 }: TokenSwapHistoryProps) {
  const [swaps, setSwaps] = useState<SwapHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSwapHistory()
  }, [tokenAddress, userAddress])

  const loadSwapHistory = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      let query = supabase
        .from("swap_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      // Filter by token if provided
      if (tokenAddress) {
        query = query.or(`token_in.eq.${tokenAddress},token_out.eq.${tokenAddress}`)
      }

      // Filter by user if provided
      if (userAddress) {
        query = query.eq("user_address", userAddress)
      }

      const { data, error } = await query

      if (error) throw error
      
      setSwaps(data || [])
    } catch (error) {
      console.error("[v0] Failed to load swap history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: string, decimals = 18) => {
    try {
      const formatted = formatUnits(BigInt(amount), decimals)
      return Number.parseFloat(formatted).toFixed(4)
    } catch {
      return "0.0000"
    }
  }

  if (isLoading) {
    return (
      <Card className="glass-premium border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Swaps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (swaps.length === 0) {
    return (
      <Card className="glass-premium border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Swaps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No swap history found
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-premium border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Swaps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {swaps.map((swap) => (
            <div
              key={swap.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatAddress(swap.token_in)}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Badge variant="outline" className="font-mono text-xs">
                    {formatAddress(swap.token_out)}
                  </Badge>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-sm font-mono">{formatAmount(swap.amount_in)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-mono">{formatAmount(swap.amount_out)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {formatDistanceToNow(new Date(swap.created_at), { addSuffix: true })}
                </span>
                <a
                  href={`https://basescan.org/tx/${swap.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
