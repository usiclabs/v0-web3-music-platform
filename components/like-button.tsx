"use client"

import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface LikeButtonProps {
  trackId: string
  initialLikeCount?: number
  size?: "sm" | "lg" | "default"
  className?: string
  showCount?: boolean
}

export function LikeButton({
  trackId,
  initialLikeCount = 0,
  size = "default",
  className,
  showCount = true,
}: LikeButtonProps) {
  const { address } = useWallet()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    if (address) {
      checkIfLiked()
    }
  }, [address, trackId])

  async function checkIfLiked() {
    if (!address) return

    try {
      const response = await fetch("/api/likes/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address, trackIds: [trackId] }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsLiked(data[trackId] || false)
      }
    } catch (error) {
      console.error("Failed to check like status:", error)
    }
  }

  async function toggleLike() {
    if (!address || isLiking) return

    setIsLiking(true)
    const wasLiked = isLiked

    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1))

    try {
      if (wasLiked) {
        await fetch(`/api/likes/${trackId}?userAddress=${address}`, {
          method: "DELETE",
        })
      } else {
        await fetch(`/api/likes/${trackId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address }),
        })
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
      // Revert on error
      setIsLiked(wasLiked)
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1))
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={toggleLike}
      disabled={!address || isLiking}
      className={cn("relative group", className)}
    >
      <Heart
        className={cn(
          "transition-all",
          size === "sm" && "h-4 w-4",
          size === "default" && "h-5 w-5",
          size === "lg" && "h-5 w-5",
          isLiked ? "fill-red-500 text-red-500 scale-110" : "",
        )}
      />
      {showCount && likeCount > 0 && <span className="ml-2 text-sm font-medium">{likeCount}</span>}
    </Button>
  )
}
