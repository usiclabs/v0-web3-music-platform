"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { Music, TrendingUp, Coins, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RealtimeNotifications() {
  const { addToast } = useToast()
  const router = useRouter()
  const { address } = useWallet()
  const supabase = createClient()
  const [streamStatus, setStreamStatus] = useState<string>("connecting")
  const [swapStatus, setSwapStatus] = useState<string>("connecting")
  const [showDebug, setShowDebug] = useState(false)
  const hasShownErrorToast = useRef(false)

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
          // Filter out current user's streams at the database level
          filter: address ? `listener_address=neq.${address}` : undefined,
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

          if (address && stream.listener_address.toLowerCase() === address.toLowerCase()) {
            console.log("[v0] Skipping notification - user's own stream")
            return
          }

          console.log("[v0] Fetching track and profile info...")
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
          setShowDebug(true)
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
          // Filter out current user's swaps at the database level
          filter: address ? `user_address=neq.${address}` : undefined,
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
          setShowDebug(true)
        }
      })

    console.log("[v0] Both notification channels set up")

    return () => {
      console.log("[v0] Cleaning up notification subscriptions")
      supabase.removeChannel(streamChannel)
      supabase.removeChannel(swapChannel)
      hasShownErrorToast.current = false
    }
  }, [address, addToast, router, supabase])

  const testNotifications = () => {
    console.log("[v0] Testing toast notifications...")

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

  const hasError =
    streamStatus === "CHANNEL_ERROR" ||
    streamStatus === "TIMED_OUT" ||
    swapStatus === "CHANNEL_ERROR" ||
    swapStatus === "TIMED_OUT"

  if (showDebug || hasError) {
    return (
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
        <div className="rounded-lg border-2 border-red-500/50 bg-background/95 p-4 shadow-xl backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 font-semibold text-red-500">
            <AlertCircle className="h-5 w-5" />
            <span>{hasError ? "Notifications Disabled" : "Debug Panel"}</span>
          </div>

          <div className="mb-3 space-y-1 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Streams:</span>
              <span className={streamStatus === "SUBSCRIBED" ? "text-green-500" : "text-red-500"}>{streamStatus}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Swaps:</span>
              <span className={swapStatus === "SUBSCRIBED" ? "text-green-500" : "text-red-500"}>{swapStatus}</span>
            </div>
          </div>

          {hasError && (
            <div className="mb-3 rounded-md bg-red-500/10 p-3 text-xs text-red-500">
              <p className="font-semibold mb-1">Action Required:</p>
              <p>Run the SQL script from the scripts folder:</p>
              <code className="block mt-1 bg-black/20 p-1 rounded">fix_realtime_rls_policies.sql</code>
            </div>
          )}

          {streamStatus === "SUBSCRIBED" && swapStatus === "SUBSCRIBED" && (
            <div className="mb-3 rounded-md bg-green-500/10 p-3 text-xs text-green-500">
              <p className="font-semibold mb-1">Realtime Connected</p>
              <p>Waiting for events... Try streaming a song or swapping tokens to see notifications.</p>
            </div>
          )}

          <div className="space-y-2">
            <Button size="sm" onClick={testNotifications} className="w-full bg-transparent" variant="outline">
              Test Toast System
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowDebug(false)} className="w-full text-xs">
              Hide Panel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (streamStatus === "SUBSCRIBED" && swapStatus === "SUBSCRIBED") {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setShowDebug(true)}
        className="fixed bottom-20 right-4 z-40 opacity-30 hover:opacity-100 transition-opacity"
        title="Show notification debug panel"
      >
        <AlertCircle className="h-4 w-4" />
      </Button>
    )
  }

  return null
}
