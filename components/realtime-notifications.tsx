"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { Music, TrendingUp } from "lucide-react"

export function RealtimeNotifications() {
  const { addToast } = useToast()
  const router = useRouter()
  const { address } = useWallet()
  const supabase = createClient()

  useEffect(() => {
    console.log("[v0] RealtimeNotifications component mounted")
    console.log("[v0] Current wallet address:", address)

    // Subscribe to new stream events
    console.log("[v0] Setting up stream notifications channel...")
    const streamChannel = supabase
      .channel("stream-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "streams",
        },
        async (payload) => {
          console.log("[v0] Stream event received:", payload)

          const stream = payload.new as {
            listener_address: string
            track_id: string
            started_at: string
          }

          console.log("[v0] Stream data:", {
            listener: stream.listener_address,
            track: stream.track_id,
            currentUser: address,
          })

          // Don't show notification for current user's own streams
          if (address && stream.listener_address.toLowerCase() === address.toLowerCase()) {
            console.log("[v0] Skipping notification - user's own stream")
            return
          }

          console.log("[v0] Fetching track and profile info...")
          // Fetch track and user info
          const [trackResult, profileResult] = await Promise.all([
            supabase.from("tracks").select("title, artist_id").eq("id", stream.track_id).single(),
            supabase.from("profiles").select("artist_name").eq("wallet_address", stream.listener_address).single(),
          ])

          console.log("[v0] Track result:", trackResult)
          console.log("[v0] Profile result:", profileResult)

          const trackTitle = trackResult.data?.title || "Unknown Track"
          const username =
            profileResult.data?.artist_name ||
            `${stream.listener_address.slice(0, 6)}...${stream.listener_address.slice(-4)}`

          console.log("[v0] Showing stream notification:", { username, trackTitle })

          // Show clickable toast notification
          addToast({
            title: (
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-accent" />
                <span>New Stream</span>
              </div>
            ),
            description: (
              <div
                className="cursor-pointer hover:underline"
                onClick={() => {
                  console.log("[v0] Navigating to track:", stream.track_id)
                  router.push(`/track/${stream.track_id}`)
                }}
              >
                <span className="font-medium">{username}</span> just streamed{" "}
                <span className="font-medium text-accent">{trackTitle}</span>
              </div>
            ),
            variant: "default",
            duration: 8000,
          })
        },
      )
      .subscribe((status) => {
        console.log("[v0] Stream channel subscription status:", status)
      })

    // Subscribe to token buying activity (swap_history)
    console.log("[v0] Setting up swap notifications channel...")
    const swapChannel = supabase
      .channel("swap-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "swap_history",
        },
        async (payload) => {
          console.log("[v0] Swap event received:", payload)

          const swap = payload.new as {
            user_address: string
            token_in: string
            token_out: string
            amount_in: string
            amount_out: string
            created_at: string
          }

          console.log("[v0] Swap data:", {
            user: swap.user_address,
            tokenIn: swap.token_in,
            tokenOut: swap.token_out,
            amountOut: swap.amount_out,
            currentUser: address,
          })

          // Don't show notification for current user's own swaps
          if (address && swap.user_address.toLowerCase() === address.toLowerCase()) {
            console.log("[v0] Skipping notification - user's own swap")
            return
          }

          // Only show notifications for $USI purchases (when token_out is USI)
          if (swap.token_out !== "USI") {
            console.log("[v0] Skipping notification - not a USI purchase, token_out:", swap.token_out)
            return
          }

          console.log("[v0] Fetching user profile for swap notification...")
          // Fetch user info
          const { data: profile } = await supabase
            .from("profiles")
            .select("artist_name")
            .eq("wallet_address", swap.user_address)
            .single()

          console.log("[v0] Profile result:", profile)

          const username = profile?.artist_name || `${swap.user_address.slice(0, 6)}...${swap.user_address.slice(-4)}`
          const amount = Number.parseFloat(swap.amount_out).toFixed(2)

          console.log("[v0] Showing swap notification:", { username, amount })

          // Show clickable toast notification
          addToast({
            title: (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span>Token Activity</span>
              </div>
            ),
            description: (
              <div
                className="cursor-pointer hover:underline"
                onClick={() => {
                  console.log("[v0] Navigating to swap page")
                  router.push("/swap")
                }}
              >
                <span className="font-medium">{username}</span> bought{" "}
                <span className="font-medium text-accent">{amount} $USI</span>
              </div>
            ),
            variant: "default",
            duration: 8000,
          })
        },
      )
      .subscribe((status) => {
        console.log("[v0] Swap channel subscription status:", status)
      })

    console.log("[v0] Both notification channels set up")

    // Cleanup subscriptions on unmount
    return () => {
      console.log("[v0] Cleaning up notification subscriptions")
      supabase.removeChannel(streamChannel)
      supabase.removeChannel(swapChannel)
    }
  }, [address, addToast, router, supabase])

  return null // This component doesn't render anything
}
