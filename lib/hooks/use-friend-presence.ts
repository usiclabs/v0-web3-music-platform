"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"

interface FriendPresence {
  user_address: string
  status: "online" | "offline" | "listening" | "streaming"
  current_track_id?: string
  current_stream_id?: string
  last_seen_at: string
  artist_name?: string
  track_title?: string
}

export function useFriendPresence() {
  const [friendsPresence, setFriendsPresence] = useState<FriendPresence[]>([])
  const [onlineFriends, setOnlineFriends] = useState<string[]>([])
  const { address } = useWallet()
  const supabase = createClient()

  useEffect(() => {
    if (!address) return

    const loadFriendPresence = async () => {
      try {
        // Get list of friends (people user follows)
        const { data: follows, error: followsError } = await supabase
          .from("follows")
          .select("following_address")
          .eq("follower_address", address)

        if (followsError) {
          console.error("[v0] Error fetching follows:", followsError)
          return
        }

        if (!follows || follows.length === 0) {
          setFriendsPresence([])
          setOnlineFriends([])
          return
        }

        const friendAddresses = follows.map((f) => f.following_address)

        // Get presence for all friends
        const { data: presenceData, error: presenceError } = await supabase
          .from("user_presence")
          .select("*")
          .in("user_address", friendAddresses)
          .neq("status", "offline")

        if (presenceError) {
          console.error("[v0] Error fetching presence:", presenceError)
          return
        }

        if (presenceData) {
          // Enrich with profile and track data
          const enrichedPresence = await Promise.all(
            presenceData.map(async (presence) => {
              const [profileResult, trackResult] = await Promise.all([
                supabase
                  .from("profiles")
                  .select("artist_name")
                  .eq("wallet_address", presence.user_address)
                  .maybeSingle(),
                presence.current_track_id
                  ? supabase.from("tracks").select("title").eq("id", presence.current_track_id).maybeSingle()
                  : Promise.resolve({ data: null }),
              ])

              return {
                ...presence,
                artist_name: profileResult.data?.artist_name,
                track_title: trackResult.data?.title,
              }
            }),
          )

          setFriendsPresence(enrichedPresence)
          setOnlineFriends(enrichedPresence.map((p) => p.user_address))
        }
      } catch (error) {
        console.error("[v0] Error in loadFriendPresence:", error)
      }
    }

    loadFriendPresence()

    // Subscribe to presence changes for friends
    const channel = supabase
      .channel("friend-presence")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
        },
        (payload) => {
          console.log("[v0] Presence change:", payload)
          loadFriendPresence()
        },
      )
      .subscribe()

    // Refresh every minute
    const interval = setInterval(loadFriendPresence, 60000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [address, supabase])

  return { friendsPresence, onlineFriends }
}
