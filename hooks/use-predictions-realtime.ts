"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export function usePredictionsRealtime(marketId: string) {
  const [market, setMarket] = useState<any>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!marketId) return

    // Subscribe to market updates
    const channel = supabase
      .channel(`market:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prediction_markets",
          filter: `id=eq.${marketId}`,
        },
        (payload) => {
          console.log("[v0] Market update received:", payload)
          setMarket(payload.new)
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [marketId, supabase])

  return market
}

export function usePredictionsTrades(marketId: string) {
  const [trades, setTrades] = useState<any[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!marketId) return

    // Subscribe to new trades
    const channel = supabase
      .channel(`trades:${marketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "prediction_trades",
          filter: `market_id=eq.${marketId}`,
        },
        (payload) => {
          console.log("[v0] New trade:", payload)
          setTrades((prev) => [payload.new, ...prev].slice(0, 50))
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [marketId, supabase])

  return trades
}
