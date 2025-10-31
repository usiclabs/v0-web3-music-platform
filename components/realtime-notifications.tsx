"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/toast"
import { useWallet } from "@/lib/web3/wallet-context"
import { Music, TrendingUp, Coins } from "lucide-react"

export function RealtimeNotifications() {
  const { addToast } = useToast()
  const router = useRouter()
  const { address } = useWallet()
  const supabase = createClient()
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
          filter: address ? `listener_address=neq.${address}` : undefined,
        },
        async (payload) => {
          try {
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
              supabase.from("tracks").select("title, artist_id").eq("id", stream.track_id).maybeSingle(),
              supabase
                .from("profiles")
                .select("artist_name")
                .eq("wallet_address", stream.listener_address)
                .maybeSingle(),
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
          } catch (error) {
            console.error("[v0] ❌ Error processing stream notification:", error)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Stream channel subscription status:", status)
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[v0] ❌ Stream channel subscription failed:", status)
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
          filter: address ? `user_address=neq.${address}` : undefined,
        },
        async (payload) => {
          try {
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
              .maybeSingle()

            console.log("[v0] Track lookup result:", track)

            const { data: profile } = await supabase
              .from("profiles")
              .select("artist_name")
              .eq("wallet_address", swap.user_address)
              .maybeSingle()

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
              console.log("[v0] addToast called successfully")
            } else {
              console.log("[v0] Skipping notification - not a music token or USI purchase")
            }
          } catch (error) {
            console.error("[v0] ❌ Error processing swap notification:", error)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Swap channel subscription status:", status)
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[v0] ❌ Swap channel subscription failed:", status)
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

  return null
}
