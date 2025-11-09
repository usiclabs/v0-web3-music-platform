"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/lib/web3/wallet-context"

export function RealtimeNotifications() {
  const { toast } = useToast()
  const router = useRouter()
  const { address } = useWallet()
  const supabase = createClient()
  const hasShownErrorToast = useRef(false)

  useEffect(() => {
    console.log("[v0] RealtimeNotifications component mounted")
    console.log("[v0] Current wallet address:", address)

    const notificationChannel = supabase
      .channel("user-notifications-toasts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: address ? `recipient_address=eq.${address}` : undefined,
        },
        async (payload) => {
          try {
            console.log("[v0] ✅ Notification received:", payload)

            const notification = payload.new as {
              type: string
              sender_address: string
              track_id?: string
              comment_id?: string
              content?: string
            }

            const { data: profile } = await supabase
              .from("profiles")
              .select("artist_name")
              .eq("wallet_address", notification.sender_address)
              .maybeSingle()

            const senderName =
              profile?.artist_name ||
              `${notification.sender_address.slice(0, 6)}...${notification.sender_address.slice(-4)}`

            if (notification.type === "follow") {
              toast({
                title: "New Follower",
                description: `${senderName} started following you`,
                variant: "default",
              })
            } else if (notification.type === "like" && notification.track_id) {
              const { data: track } = await supabase
                .from("tracks")
                .select("title")
                .eq("id", notification.track_id)
                .maybeSingle()

              toast({
                title: "New Like",
                description: `${senderName} liked your track "${track?.title || "Unknown"}"`,
                variant: "default",
              })
            } else if ((notification.type === "comment" || notification.type === "reply") && notification.track_id) {
              const { data: track } = await supabase
                .from("tracks")
                .select("title")
                .eq("id", notification.track_id)
                .maybeSingle()

              const action = notification.type === "reply" ? "replied to your comment" : "commented on"
              const trackText = notification.type === "comment" ? ` "${track?.title || "your track"}"` : ""

              toast({
                title: notification.type === "reply" ? "New Reply" : "New Comment",
                description: `${senderName} ${action}${trackText}`,
                variant: "default",
              })
            }
          } catch (error) {
            console.error("[v0] ❌ Error processing notification:", error)
          }
        },
      )
      .subscribe((status) => {
        console.log("[v0] Notification channel subscription status:", status)
      })

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

            toast({
              title: "Song Unlocked",
              description: `${username} just unlocked "${trackTitle}"`,
              variant: "default",
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

              toast({
                title: "Token Purchased",
                description: `${username} bought ${amount} $${track.title} tokens`,
                variant: "default",
              })
            } else if (swap.token_out === "USI") {
              const amount = Number.parseFloat(swap.amount_out).toFixed(2)
              console.log("[v0] Showing USI purchase notification:", { username, amount })

              toast({
                title: "Platform Token Activity",
                description: `${username} bought ${amount} $USI`,
                variant: "default",
              })
              console.log("[v0] toast called successfully")
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

    console.log("[v0] All notification channels set up")

    return () => {
      console.log("[v0] Cleaning up notification subscriptions")
      supabase.removeChannel(notificationChannel)
      supabase.removeChannel(streamChannel)
      supabase.removeChannel(swapChannel)
      hasShownErrorToast.current = false
    }
  }, [address, toast, router, supabase])

  return null
}
