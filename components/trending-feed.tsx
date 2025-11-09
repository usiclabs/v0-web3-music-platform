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

    let rafId: number
    let lastScrollTop = 0

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop
        const itemHeight = window.innerHeight
        const index = Math.round(scrollTop / itemHeight)

        if (index !== currentIndex) {
          setCurrentIndex(index)
        }

        if (Math.abs(scrollTop - lastScrollTop) > 5) {
          const newOffsets = tracks.map((_, i) => {
            const cardTop = i * itemHeight
            const cardCenter = cardTop + itemHeight / 2
            const viewportCenter = scrollTop + itemHeight / 2
            const distanceFromCenter = cardCenter - viewportCenter

            // Smooth parallax effect with better performance
            return distanceFromCenter * 0.15
          })

          setScrollOffsets(newOffsets)
          lastScrollTop = scrollTop
        }
      })
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      container.removeEventListener("scroll", handleScroll)
    }
  }, [tracks.length, currentIndex])

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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-6 animate-fade-in px-4">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-black flex items-center justify-center border-2 border-primary/50">
              <TrendingUp className="h-12 w-12 text-primary animate-bounce" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            No Trending Tracks Yet
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            Check back soon for the hottest tracks! Be the first to discover new music.
          </p>
          <Link href="/discover">
            <Button
              size="lg"
              className="rounded-full px-8 mt-4 shadow-lg shadow-primary/50 hover:scale-105 transition-transform"
            >
              Explore Music
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll overflow-x-clip snap-y snap-mandatory scroll-smooth hide-scrollbar bg-black"
      style={{ scrollbarWidth: "none" }}
    >
      {tracks.map((track, index) => {
        const isCurrentTrack = currentTrack?.id === track.id
        const isCurrentlyPlaying = isCurrentTrack && isPlaying
        const isLiked = likedTracks.has(track.id)
        const likeCount = likeCounts.get(track.id) || 0
        const parallaxOffset = scrollOffsets[index] || 0
        const isActive = index === currentIndex

        return (
          <div
            key={track.id}
            className="relative h-screen w-full snap-start snap-always flex items-center justify-center"
          >
            <div
              className="absolute inset-0 z-0 transition-transform duration-200 ease-out"
              style={{
                transform: `translateY(${parallaxOffset}px) scale(${isActive ? 1.05 : 1})`,
                willChange: "transform",
              }}
            >
              <Image
                src={track.cover_url || "/placeholder.svg?height=1920&width=1080"}
                alt={track.title}
                fill
                className="object-cover"
                priority={index === 0}
                loading={index < 2 ? "eager" : "lazy"}
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
            </div>

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-12">
              <div className="flex items-center gap-3 text-white/90 animate-fade-in">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-lg opacity-75 animate-pulse" />
                  <div className="relative px-4 py-2 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      #{index + 1} Trending
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-8 pb-52 md:pb-12">
                <div className="space-y-4 animate-fade-in-up">
                  {/* Track title with hover effect */}
                  <Link href={`/track/${track.id}`} className="block group">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white text-balance leading-[0.95] tracking-tight group-hover:text-primary transition-all duration-500 cursor-pointer drop-shadow-2xl">
                      {track.title}
                    </h1>
                  </Link>

                  {/* Artist info with enhanced avatar styling */}
                  <Link href={`/artist/${track.artist_id}`} className="flex items-center gap-4 group w-fit">
                    {track.avatar_url && (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <Image
                          src={track.avatar_url || "/placeholder.svg"}
                          alt={track.artist_name}
                          width={48}
                          height={48}
                          className="relative rounded-full ring-2 ring-white/30 group-hover:ring-primary group-hover:scale-110 transition-all duration-300"
                        />
                      </div>
                    )}
                    <span className="text-xl md:text-2xl font-semibold text-white/90 group-hover:text-primary transition-colors duration-300">
                      {track.artist_name}
                    </span>
                  </Link>

                  <div className="flex items-center gap-6 md:gap-8 text-white/80 text-base md:text-lg">
                    <div className="flex items-center gap-2.5 hover:text-white transition-colors group">
                      <div className="relative">
                        <Play className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 blur-md bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-semibold tabular-nums">{track.total_plays.toLocaleString()}</span>
                      <span className="text-sm">plays</span>
                    </div>
                    <div className="flex items-center gap-2.5 hover:text-white transition-colors group">
                      <div className="relative">
                        <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <div className="absolute inset-0 blur-md bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="font-semibold tabular-nums">{track.total_listeners.toLocaleString()}</span>
                      <span className="text-sm">listeners</span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center gap-4 md:gap-5 animate-fade-in-up"
                  style={{ animationDelay: "200ms" }}
                >
                  {/* Play/Pause button with pulsing glow */}
                  <Button
                    size="lg"
                    onClick={() => handlePlayPause(track)}
                    className="relative h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-primary to-accent hover:from-primary/90 hover:to-accent/90 hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl border-0 group overflow-hidden"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-2xl opacity-75 group-hover:opacity-100 group-hover:blur-3xl transition-all duration-500 animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {isCurrentlyPlaying ? (
                      <Pause className="h-8 w-8 md:h-10 md:w-10 relative z-10 drop-shadow-lg" fill="currentColor" />
                    ) : (
                      <Play className="h-8 w-8 md:h-10 md:w-10 ml-1 relative z-10 drop-shadow-lg" fill="currentColor" />
                    )}
                  </Button>

                  {/* Like button with animated heart */}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={(e) => toggleLike(track.id, e)}
                    disabled={!address || isLiking === track.id}
                    className="relative h-16 w-16 md:h-18 md:w-18 rounded-full bg-black/30 border-white/20 hover:bg-black/50 hover:border-white/40 hover:scale-110 active:scale-95 backdrop-blur-2xl transition-all duration-300 group"
                  >
                    <Heart
                      className={`h-6 w-6 md:h-7 md:w-7 transition-all duration-300 ${
                        isLiked
                          ? "fill-red-500 text-red-500 scale-110 animate-heart-beat"
                          : "text-white group-hover:scale-110"
                      }`}
                    />
                    {likeCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg animate-scale-in ring-2 ring-black/50">
                        {likeCount > 99 ? "99+" : likeCount}
                      </span>
                    )}
                    {isLiked && <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl animate-pulse" />}
                  </Button>

                  {/* Share button */}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={(e) => handleShare(track, e)}
                    className="h-16 w-16 md:h-18 md:w-18 rounded-full bg-black/30 border-white/20 hover:bg-black/50 hover:border-white/40 hover:scale-110 active:scale-95 backdrop-blur-2xl transition-all duration-300 group"
                  >
                    <Share2 className="h-6 w-6 md:h-7 md:w-7 text-white group-hover:rotate-12 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </div>

            {index < tracks.length - 1 && (
              <div className="absolute bottom-32 md:bottom-28 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
                <div className="text-white/60 text-xs font-medium uppercase tracking-wider">Scroll</div>
                <div className="h-10 w-0.5 bg-gradient-to-b from-white/70 via-white/40 to-transparent rounded-full" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
