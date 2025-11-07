"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useWallet } from "@/lib/web3/wallet-context"

interface PresenceOptions {
  status?: "online" | "offline" | "listening" | "streaming"
  currentTrackId?: string
  currentStreamId?: string
}

export function usePresence(options: PresenceOptions = {}) {
  const { address } = useWallet()
  const supabase = createClient()
  const heartbeatInterval = useRef<NodeJS.Timeout>()
  const lastStatus = useRef<string>()
  const lastTrackId = useRef<string>()
  const lastStreamId = useRef<string>()

  useEffect(() => {
    if (!address) {
      console.log("[v0] No address, skipping presence tracking")
      return
    }

    console.log("[v0] Starting presence tracking for:", address, "status:", options.status || "online")

    const updatePresence = async (presenceData: PresenceOptions) => {
      try {
        console.log("[v0] Updating presence...", {
          user_address: address,
          status: presenceData.status || "online",
          current_track_id: presenceData.currentTrackId || null,
          current_stream_id: presenceData.currentStreamId || null,
        })

        const { error } = await supabase.from("user_presence").upsert(
          {
            user_address: address,
            status: presenceData.status || "online",
            current_track_id: presenceData.currentTrackId || null,
            current_stream_id: presenceData.currentStreamId || null,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_address",
          },
        )

        if (error) {
          console.error("[v0] Error updating presence:", error.message)
        } else {
          console.log("[v0] Presence updated successfully")
        }
      } catch (error) {
        console.error("[v0] Error in updatePresence:", error)
      }
    }

    // Initial presence update
    updatePresence(options)
    lastStatus.current = options.status
    lastTrackId.current = options.currentTrackId
    lastStreamId.current = options.currentStreamId

    // Update presence every 30 seconds (heartbeat)
    heartbeatInterval.current = setInterval(() => {
      updatePresence(options)
    }, 30000)

    // Set offline when user leaves
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status on page unload
      const data = new FormData()
      data.append("user_address", address)
      data.append("status", "offline")

      // This is a fallback - we'll also handle this in the cleanup
      navigator.sendBeacon("/api/presence/offline", data)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Update presence when status, currentTrackId, or currentStreamId changes
    const currentStatus = options.status
    const currentTrackId = options.currentTrackId
    const currentStreamId = options.currentStreamId

    if (
      currentStatus !== lastStatus.current ||
      currentTrackId !== lastTrackId.current ||
      currentStreamId !== lastStreamId.current
    ) {
      updatePresence({ status: currentStatus, currentTrackId, currentStreamId })
      lastStatus.current = currentStatus
      lastTrackId.current = currentTrackId
      lastStreamId.current = currentStreamId
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)

      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current)
      }

      // Set user offline on cleanup
      updatePresence({ status: "offline" })
    }
  }, [address, supabase, options]) // Updated to include the entire options object
}
