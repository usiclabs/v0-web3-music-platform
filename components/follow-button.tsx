"use client"

import { Button } from "@/components/ui/button"
import { UserPlus, UserMinus } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface FollowButtonProps {
  artistAddress: string
  initialFollowerCount?: number
  size?: "sm" | "lg" | "default"
  className?: string
  showCount?: boolean
  variant?: "default" | "outline"
}

export function FollowButton({
  artistAddress,
  initialFollowerCount = 0,
  size = "default",
  className,
  showCount = true,
  variant = "default",
}: FollowButtonProps) {
  const { address } = useWallet()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [isLoading, setIsLoading] = useState(false)

  // Don't show follow button if viewing own profile
  const isSelf = address?.toLowerCase() === artistAddress.toLowerCase()

  useEffect(() => {
    if (address && !isSelf) {
      checkIfFollowing()
    }
  }, [address, artistAddress, isSelf])

  async function checkIfFollowing() {
    if (!address) return

    try {
      const response = await fetch("/api/follows/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerAddress: address, artistAddresses: [artistAddress] }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsFollowing(data[artistAddress] || false)
      }
    } catch (error) {
      console.error("Failed to check follow status:", error)
    }
  }

  async function toggleFollow() {
    if (!address || isLoading || isSelf) return

    setIsLoading(true)
    const wasFollowing = isFollowing

    // Optimistic update
    setIsFollowing(!isFollowing)
    setFollowerCount((prev) => (wasFollowing ? prev - 1 : prev + 1))

    try {
      if (wasFollowing) {
        await fetch(`/api/follows/${artistAddress}?followerAddress=${address}`, {
          method: "DELETE",
        })
      } else {
        await fetch(`/api/follows/${artistAddress}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerAddress: address }),
        })
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error)
      // Revert on error
      setIsFollowing(wasFollowing)
      setFollowerCount((prev) => (wasFollowing ? prev + 1 : prev - 1))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSelf) return null

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={toggleFollow}
      disabled={!address || isLoading}
      className={cn("relative group transition-all", className)}
    >
      {isFollowing ? (
        <>
          <UserMinus className={cn("transition-all", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
          {showCount && followerCount > 0 && <span className="ml-2 text-sm font-medium">{followerCount}</span>}
          <span className="ml-2">Following</span>
        </>
      ) : (
        <>
          <UserPlus className={cn("transition-all", size === "sm" ? "h-4 w-4" : "h-5 w-5")} />
          {showCount && followerCount > 0 && <span className="ml-2 text-sm font-medium">{followerCount}</span>}
          <span className="ml-2">Follow</span>
        </>
      )}
    </Button>
  )
}
