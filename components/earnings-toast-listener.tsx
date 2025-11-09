"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface EarningEvent {
  id: string
  artist_address: string
  artist_name: string | null
  amount: number
  track_title: string | null
  created_at: string
}

export function EarningsToastListener() {
  const { toast } = useToast()
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to real-time earnings events
    const channel = supabase
      .channel("earnings-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "earnings_events",
        },
        (payload) => {
          console.log("[v0] Earnings event received:", payload)

          const event = payload.new as EarningEvent

          // Avoid duplicate toasts
          if (processedEvents.has(event.id)) {
            return
          }

          setProcessedEvents((prev) => new Set([...prev, event.id]))

          // Show toast notification
          const username =
            event.artist_name || `${event.artist_address.slice(0, 6)}...${event.artist_address.slice(-4)}`
          const amount = event.amount.toFixed(2)

          toast({
            title: "💰 Artist Earned!",
            description: `${username} just earned $${amount}${event.track_title ? ` from "${event.track_title}"` : ""}`,
            duration: 4000,
          })
        },
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [toast, processedEvents])

  return null
}
