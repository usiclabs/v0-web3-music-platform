"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { Music, TrendingUp, Coins, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RealtimeNotifications() {
  const { addToast } = useToast()
  const router = useRouter()
  const { address } = useWallet()
  const supabase = createClient()
  const [streamStatus, setStreamStatus] = useState<string>("connecting")
  const [swapStatus, setSwapStatus] = useState<string>("connecting")
  const [showDebug, setShowDebug] = useState(false)

  useEffect(() => {
    console.log("[v0] RealtimeNotifications component mounted")
    console.log("[v0] Current wallet address:", address)

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
          console.log("[v0] ✅ Stream event received:", payload)

          const stream = payload.new as {
            listener_address: string
            track_id: string
            started_at: string
            chunks_played: number
          }

          console.log("[v0] Stream data:", {
            listener: stream.listener_address,
            track: stream.track_id,
            chunks: stream.chunks_played,
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

          console.log("[v0] Showing stream unlock notification:", { username, trackTitle })

          addToast({
            title: (
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-green-500" />
                <span>Song Unlocked</span>
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
                <span className="font-medium">{username}</span> just unlocked{" "}
                <span className="font-medium text-green-500">{trackTitle}</span>
              </div>
            ),
            variant: "default",
            duration: 8000,
          })
        },
      )
      .subscribe((status) => {
        console.log("[v0] Stream channel subscription status:", status)
        setStreamStatus(status)
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[v0] ❌ Stream channel subscription failed:", status)
          console.error(
            "[v0] Make sure Realtime is enabled on the 'streams' table in Supabase Dashboard > Database > Replication",
          )
        }
      })

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
          console.log("[v0] ✅ Swap event received:", payload)

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

          console.log("[v0] Fetching user profile and checking if token is a music token...")

          const { data: track } = await supabase
            .from("tracks")
            .select("title, coin_address, artist_id")
            .eq("coin_address", swap.token_out)
            .single()

          console.log("[v0] Track lookup result:", track)

          // Fetch user info
          const { data: profile } = await supabase
            .from("profiles")
            .select("artist_name")
            .eq("wallet_address", swap.user_address)
            .single()

          console.log("[v0] Profile result:", profile)

          const username = profile?.artist_name || `${swap.user_address.slice(0, 6)}...${swap.user_address.slice(-4)}`

          if (track) {
            const amount = Number.parseFloat(swap.amount_out).toFixed(2)
            console.log("[v0] Showing tokenized music purchase notification:", {
              username,
              trackTitle: track.title,
              amount,
            })

            addToast({
              title: (
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-accent" />
                  <span>Token Purchased</span>
                </div>
              ),
              description: (
                <div
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    console.log("[v0] Navigating to tokens page")
                    router.push("/tokens")
                  }}
                >
                  <span className="font-medium">{username}</span> bought{" "}
                  <span className="font-medium text-accent">
                    {amount} ${track.title}
                  </span>{" "}
                  tokens
                </div>
              ),
              variant: "default",
              duration: 8000,
            })
          } else if (swap.token_out === "USI") {
            const amount = Number.parseFloat(swap.amount_out).toFixed(2)
            console.log("[v0] Showing USI purchase notification:", { username, amount })

            addToast({
              title: (
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <span>Platform Token Activity</span>
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
          } else {
            console.log("[v0] Skipping notification - not a music token or USI purchase")
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Swap channel subscription status:", status)
        setSwapStatus(status)
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[v0] ❌ Swap channel subscription failed:", status)
          console.error(
            "[v0] Make sure Realtime is enabled on the 'swap_history' table in Supabase Dashboard > Database > Replication",
          )
        }
      })

    console.log("[v0] Both notification channels set up")
    console.log(
      "[v0] ⚠️ If you don't see notifications, make sure Realtime is enabled on 'streams' and 'swap_history' tables in Supabase",
    )

    // Cleanup subscriptions on unmount
    return () => {
      console.log("[v0] Cleaning up notification subscriptions")
      supabase.removeChannel(streamChannel)
      supabase.removeChannel(swapChannel)
    }
  }, [address, addToast, router, supabase])

  const testNotifications = () => {
    console.log("[v0] Testing toast notifications...")

    // Test stream notification
    addToast({
      title: (
        <div className="flex items-center gap-2">
          <Music className="h-4 w-4 text-green-500" />
          <span>Song Unlocked (Test)</span>
        </div>
      ),
      description: (
        <div>
          <span className="font-medium">Test User</span> just unlocked{" "}
          <span className="font-medium text-green-500">Test Track</span>
        </div>
      ),
      variant: "default",
      duration: 5000,
    })

    // Test token purchase notification
    setTimeout(() => {
      addToast({
        title: (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-accent" />
            <span>Token Purchased (Test)</span>
          </div>
        ),
        description: (
          <div>
            <span className="font-medium">Test User</span> bought{" "}
            <span className="font-medium text-accent">100 $TEST</span> tokens
          </div>
        ),
        variant: "default",
        duration: 5000,
      })
    }, 1000)

    console.log("[v0] Test notifications triggered")
  }

  if (process.env.NODE_ENV === "development" || showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <div className="rounded-lg border border-border bg-background/95 p-3 text-xs backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            {streamStatus === "SUBSCRIBED" && swapStatus === "SUBSCRIBED" ? (
              <Bell className="h-4 w-4 text-green-500" />
            ) : (
              <BellOff className="h-4 w-4 text-red-500" />
            )}
            <span>Notifications</span>
          </div>
          <div className="space-y-1 text-muted-foreground">
            <div>
              Streams:{" "}
              <span className={streamStatus === "SUBSCRIBED" ? "text-green-500" : "text-yellow-500"}>
                {streamStatus}
              </span>
            </div>
            <div>
              Swaps:{" "}
              <span className={swapStatus === "SUBSCRIBED" ? "text-green-500" : "text-yellow-500"}>{swapStatus}</span>
            </div>
          </div>
          <Button size="sm" onClick={testNotifications} className="mt-2 w-full">
            Test Notifications
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowDebug(false)} className="mt-1 w-full text-xs">
            Hide Debug
          </Button>
        </div>
      </div>
    )
  }

  return null
}
