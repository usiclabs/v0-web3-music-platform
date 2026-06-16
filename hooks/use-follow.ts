"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface UseFollowOptions {
  artistAddress: string
  enabled?: boolean
}

export function useFollow({ artistAddress, enabled = true }: UseFollowOptions) {
  const [isLoadingToggle, setIsLoadingToggle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cacheKey = enabled ? `/api/follows/status?artist=${artistAddress.toLowerCase()}` : null

  const { data, isLoading, mutate: revalidate } = useSWR(cacheKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  })

  const isFollowing = data?.isFollowing ?? false
  const followerCount = data?.followerCount ?? 0

  const toggleFollow = async () => {
    if (isLoadingToggle) return

    setIsLoadingToggle(true)
    setError(null)

    try {
      const response = await fetch("/api/follows/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerAddress: artistAddress.toLowerCase(),
          followingAddress: artistAddress.toLowerCase(),
          action: isFollowing ? "unfollow" : "follow",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update follow status")
      }

      // Optimistically update local state
      await revalidate({
        isFollowing: !isFollowing,
        followerCount: isFollowing ? Math.max(0, followerCount - 1) : followerCount + 1,
      })

      // Also invalidate related caches
      await mutate(`/api/follows/status?artist=${artistAddress.toLowerCase()}`)
      await mutate(`/api/artists/${artistAddress.toLowerCase()}`)

      setIsLoadingToggle(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred"
      setError(errorMsg)
      setIsLoadingToggle(false)
      throw err
    }
  }

  // Explicit follow action
  const follow = async () => {
    if (isFollowing || isLoadingToggle) return
    return toggleFollow()
  }

  // Explicit unfollow action
  const unfollow = async () => {
    if (!isFollowing || isLoadingToggle) return
    return toggleFollow()
  }

  return {
    isFollowing,
    followerCount,
    isLoadingToggle: isLoadingToggle || isLoading,
    error,
    toggleFollow,
    follow,
    unfollow,
  }
}
