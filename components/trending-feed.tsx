"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Play, Pause, Heart, Share2, TrendingUp, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { useWallet } from "@/lib/web3/wallet-context"
import Link from "next/link"
import type { Track } from "@/types/database"
import { useToast } from "@/hooks/use-toast"

interface TrendingTrack extends Track {
  artist_name: string
  avatar_url: string | null
  total_plays: number
  total_listeners: number
}

interface TrendingFeedProps {
  tracks: TrendingTrack[]
}

export function TrendingFeed({ tracks }: TrendingFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scrollOffsets, setScrollOffsets] = useState<number[]>(new Array(tracks.length).fill(0))
  const { currentTrack, isPlaying, playTrack, pauseTrack } = useAudioPlayer()
  const { address } = useWallet()
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map())
  const [isLiking, setIsLiking] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!address || tracks.length === 0) return

    async function loadLikes() {
      try {
        const trackIds = tracks.map((t) => t.id)

        const response = await fetch("/api/likes/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address, trackIds }),
        })

        if (response.ok) {
          const data = await response.json()
          const liked = new Set<string>()
          Object.entries(data).forEach(([trackId, isLiked]) => {
            if (isLiked) liked.add(trackId)
          })
          setLikedTracks(liked)
        }

        const counts = new Map<string, number>()
        await Promise.all(
          trackIds.map(async (trackId) => {
            const res = await fetch(`/api/likes/${trackId}`)
            if (res.ok) {
              const { count } = await res.json()
              counts.set(trackId, count)
            }
          }),
        )
        setLikeCounts(counts)
      } catch (error) {
        console.error("Failed to load likes:", error)
      }
    }

    loadLikes()
  }, [address, tracks])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const itemHeight = window.innerHeight
      const index = Math.round(scrollTop / itemHeight)
      setCurrentIndex(index)

      const newOffsets = tracks.map((_, i) => {
        const cardTop = i * itemHeight
        const cardBottom = cardTop + itemHeight
        const viewportTop = scrollTop
        const viewportBottom = scrollTop + itemHeight

        if (cardBottom < viewportTop - itemHeight || cardTop > viewportBottom + itemHeight) {
          return 0
        }

        const cardCenter = cardTop + itemHeight / 2
        const viewportCenter = scrollTop + itemHeight / 2
        const distanceFromCenter = cardCenter - viewportCenter

        return distanceFromCenter * 0.1
      })

      setScrollOffsets(newOffsets)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [tracks.length])

  const handlePlayPause = (track: TrendingTrack) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pauseTrack()
    } else {
      playTrack(track, tracks)
    }
  }

  async function toggleLike(trackId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!address || isLiking) return

    setIsLiking(trackId)
    const wasLiked = likedTracks.has(trackId)
    const currentCount = likeCounts.get(trackId) || 0

    const newLiked = new Set(likedTracks)
    if (wasLiked) {
      newLiked.delete(trackId)
    } else {
      newLiked.add(trackId)
    }
    setLikedTracks(newLiked)
    setLikeCounts(new Map(likeCounts).set(trackId, wasLiked ? currentCount - 1 : currentCount + 1))

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
      setLikedTracks(likedTracks)
      setLikeCounts(new Map(likeCounts).set(trackId, currentCount))
    } finally {
      setIsLiking(null)
    }
  }

  async function handleShare(track: TrendingTrack, e: React.MouseEvent) {
    e.stopPropagation()

    const trackUrl = `${window.location.origin}/track/${track.id}`
    const shareData = {
      title: track.title,
      text: `Check out "${track.title}" by ${track.artist_name} on ANTI`,
      url: trackUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Shared successfully",
          description: "Track shared via your device",
        })
      } else {
        await navigator.clipboard.writeText(trackUrl)
        toast({
          title: "Link copied!",
          description: "Track link copied to clipboard",
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Share failed:", error)
        toast({
          title: "Share failed",
          description: "Could not share track",
          variant: "destructive",
        })
      }
    }
  }

  if (tracks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 mb-4 animate-pulse">
            <TrendingUp className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            No Trending Tracks Yet
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Check back soon for the hottest tracks! Be the first to discover new music.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll overflow-x-clip snap-y snap-mandatory scroll-smooth hide-scrollbar"
      style={{ scrollbarWidth: "none" }}
    >
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id
        const isCurrentlyPlaying = isCurrentTrack && isPlaying
        const isLiked = likedTracks.has(track.id)
        const likeCount = likeCounts.get(track.id) || 0
        const parallaxOffset = scrollOffsets[index] || 0

        return (
          <div
            key={track.id}
            className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
          >
            <div
              className="absolute inset-0 z-0"
              style={{
                transform: `translateY(${parallaxOffset}px)`,
                willChange: "transform",
              }}
            >
              <Image
                src={track.cover_url || "/placeholder.svg?height=1920&width=1080"}
                alt={track.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-12">
              <div className="flex items-center gap-2 text-white/90 animate-fade-in">
                <div className="relative">
                  <TrendingUp className="h-5 w-5 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/50 blur-xl animate-pulse" />
                </div>
                <span className="text-sm font-medium">#{index + 1} Trending</span>
              </div>

              <div className="space-y-6 pb-52 md:pb-8">
                <div className="space-y-3 animate-fade-in-up">
                  <Link href={`/track/${track.id}`} className="block group">
                    <h1 className="text-4xl md:text-6xl font-bold text-white text-balance leading-tight group-hover:text-primary transition-all duration-300 cursor-pointer">
                      {track.title}
                    </h1>
                  </Link>
                  <Link href={`/artist/${track.artist_id}`} className="flex items-center gap-3 group w-fit">
                    {track.avatar_url && (
                      <Image
                        src={track.avatar_url || "/placeholder.svg"}
                        alt={track.artist_name}
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-white/20 group-hover:ring-primary group-hover:scale-110 transition-all duration-300"
                      />
                    )}
                    <span className="text-lg text-white/90 group-hover:text-primary transition-colors">
                      {track.artist_name}
                    </span>
                  </Link>

                  <div className="flex items-center gap-6 text-white/70">
                    <div className="flex items-center gap-2 hover:text-white transition-colors">
                      <Play className="h-4 w-4" />
                      <span className="text-sm font-medium">{track.total_plays.toLocaleString()} plays</span>
                    </div>
                    <div className="flex items-center gap-2 hover:text-white transition-colors">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">{track.total_listeners.toLocaleString()} listeners</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                  <Button
                    size="lg"
                    onClick={() => handlePlayPause(track)}
                    className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl shadow-primary/50 relative group"
                  >
                    <div className="absolute inset-0 rounded-full bg-primary/50 blur-xl group-hover:blur-2xl transition-all" />
                    {isCurrentlyPlaying ? (
                      <Pause className="h-6 w-6 relative z-10" fill="currentColor" />
                    ) : (
                      <Play className="h-6 w-6 ml-1 relative z-10" fill="currentColor" />
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={(e) => toggleLike(track.id, e)}
                    disabled={!address || isLiking === track.id}
                    className="h-14 w-14 rounded-full bg-white/10 border-white/20 hover:bg-white/20 hover:scale-110 active:scale-95 backdrop-blur-xl transition-all duration-300 relative group"
                  >
                    <Heart
                      className={`h-5 w-5 transition-all duration-300 ${
                        isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white"
                      }`}
                    />
                    {likeCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-scale-in">
                        {likeCount > 99 ? "99+" : likeCount}
                      </span>
                    )}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={(e) => handleShare(track, e)}
                    className="h-14 w-14 rounded-full bg-white/10 border-white/20 hover:bg-white/20 hover:scale-110 active:scale-95 backdrop-blur-xl transition-all duration-300"
                  >
                    <Share2 className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </div>
            </div>

            {index < tracks.length - 1 && (
              <div className="absolute bottom-32 md:bottom-24 right-6 z-20 animate-bounce">
                <div className="h-8 w-0.5 bg-gradient-to-b from-white/50 to-transparent rounded-full" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
