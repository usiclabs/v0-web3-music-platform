"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Play, Pause, Heart, MessageCircle, Share2, Music2, Volume2, VolumeX } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useWallet } from "@/lib/web3/wallet-context"
import Link from "next/link"
import type { Track } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { VerifiedBadge } from "@/components/verified-badge"

interface VideoTrack extends Track {
  artist_name: string
  avatar_url: string | null
  view_count: number
  like_count: number
}

interface VideosFeedProps {
  videos: VideoTrack[]
}

export function VideosFeed({ videos }: VideosFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set())
  const { address } = useWallet()
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map())
  const [isLiking, setIsLiking] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const counts = new Map<string, number>()
    videos.forEach((video) => {
      counts.set(video.id, video.like_count)
    })
    setLikeCounts(counts)
  }, [videos])

  useEffect(() => {
    if (!address || videos.length === 0) return

    async function loadLikes() {
      try {
        const videoIds = videos.map((v) => v.id)
        const response = await fetch("/api/likes/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address, trackIds: videoIds }),
        })

        if (response.ok) {
          const data = await response.json()
          const liked = new Set<string>()
          Object.entries(data).forEach(([videoId, isLiked]) => {
            if (isLiked) liked.add(videoId)
          })
          setLikedVideos(liked)
        }
      } catch (error) {
        console.error("[v0] Failed to load likes:", error)
      }
    }

    loadLikes()
  }, [address, videos])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let rafId: number
    let lastIndex = -1

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)

      rafId = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop
        const itemHeight = window.innerHeight
        const index = Math.round(scrollTop / itemHeight)

        if (index !== lastIndex) {
          lastIndex = index
          setCurrentIndex(index)

          // Pause all videos except current
          videoRefs.current.forEach((video, videoId) => {
            const videoIndex = videos.findIndex((v) => v.id === videoId)
            if (videoIndex === index) {
              // Play current video
              video.play().catch((e) => console.error("[v0] Video autoplay failed:", e))
              setPlayingVideos((prev) => new Set(prev).add(videoId))
            } else {
              // Pause other videos
              video.pause()
              setPlayingVideos((prev) => {
                const newSet = new Set(prev)
                newSet.delete(videoId)
                return newSet
              })
            }
          })
        }
      })
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    
    // Initial play
    handleScroll()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      container.removeEventListener("scroll", handleScroll)
    }
  }, [videos])

  const togglePlayPause = (videoId: string) => {
    const video = videoRefs.current.get(videoId)
    if (!video) return

    if (playingVideos.has(videoId)) {
      video.pause()
      setPlayingVideos((prev) => {
        const newSet = new Set(prev)
        newSet.delete(videoId)
        return newSet
      })
    } else {
      video.play().catch((e) => console.error("[v0] Video play failed:", e))
      setPlayingVideos((prev) => new Set(prev).add(videoId))
    }
  }

  const toggleMute = (videoId: string) => {
    const video = videoRefs.current.get(videoId)
    if (!video) return

    if (mutedVideos.has(videoId)) {
      video.muted = false
      setMutedVideos((prev) => {
        const newSet = new Set(prev)
        newSet.delete(videoId)
        return newSet
      })
    } else {
      video.muted = true
      setMutedVideos((prev) => new Set(prev).add(videoId))
    }
  }

  async function toggleLike(videoId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!address || isLiking) return

    setIsLiking(videoId)
    const wasLiked = likedVideos.has(videoId)
    const currentCount = likeCounts.get(videoId) || 0

    // Optimistic update
    const newLiked = new Set(likedVideos)
    if (wasLiked) {
      newLiked.delete(videoId)
    } else {
      newLiked.add(videoId)
    }
    setLikedVideos(newLiked)
    setLikeCounts(new Map(likeCounts).set(videoId, wasLiked ? currentCount - 1 : currentCount + 1))

    try {
      if (wasLiked) {
        await fetch(`/api/likes/${videoId}?userAddress=${address}`, {
          method: "DELETE",
        })
      } else {
        await fetch(`/api/likes/${videoId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address }),
        })
      }
    } catch (error) {
      console.error("[v0] Failed to toggle like:", error)
      // Revert on error
      setLikedVideos(likedVideos)
      setLikeCounts(new Map(likeCounts).set(videoId, currentCount))
    } finally {
      setIsLiking(null)
    }
  }

  async function handleShare(video: VideoTrack, e: React.MouseEvent) {
    e.stopPropagation()

    const videoUrl = `${window.location.origin}/track/${video.id}`
    const shareData = {
      title: video.title,
      text: `Check out "${video.title}" by ${video.artist_name} on MYUSIC`,
      url: videoUrl,
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast({
          title: "Shared successfully",
          description: "Video shared via your device",
        })
      } else {
        await navigator.clipboard.writeText(videoUrl)
        toast({
          title: "Link copied!",
          description: "Video link copied to clipboard",
        })
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("[v0] Share failed:", error)
        toast({
          title: "Share failed",
          description: "Could not share video",
          variant: "destructive",
        })
      }
    }
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-6 animate-fade-in px-4">
          <div className="relative inline-flex items-center justify-center w-32 h-32 mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-black flex items-center justify-center border-2 border-primary/50">
              <Music2 className="h-12 w-12 text-primary animate-bounce" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            No Videos Yet
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto leading-relaxed">
            Check back soon for amazing music videos from talented artists!
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
      {videos.map((video, index) => {
        const isPlaying = playingVideos.has(video.id)
        const isMuted = mutedVideos.has(video.id)
        const isLiked = likedVideos.has(video.id)
        const likeCount = likeCounts.get(video.id) || 0
        const isActive = index === currentIndex

        return (
          <div
            key={video.id}
            className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black"
          >
            <video
              ref={(el) => {
                if (el) videoRefs.current.set(video.id, el)
              }}
              src={video.video_url!}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
              poster={video.cover_url || undefined}
            />

            {/* Gradient overlays for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

            <div className="absolute right-4 bottom-32 md:bottom-24 z-20 flex flex-col gap-6">
              {/* Artist avatar */}
              <Link href={`/artist/${video.artist_id}`} className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-14 h-14 rounded-full border-2 border-white overflow-hidden">
                  <Image
                    src={video.avatar_url || "/placeholder.svg"}
                    alt={video.artist_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-black">
                  <Music2 className="h-3 w-3 text-white" />
                </div>
              </Link>

              {/* Like button */}
              <button
                onClick={(e) => toggleLike(video.id, e)}
                disabled={!address || isLiking === video.id}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="relative w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart
                    className={`h-7 w-7 transition-all duration-300 ${
                      isLiked
                        ? "fill-red-500 text-red-500 scale-110 animate-heart-beat"
                        : "text-white group-hover:scale-110"
                    }`}
                  />
                  {isLiked && <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl animate-pulse" />}
                </div>
                <span className="text-white text-xs font-semibold">
                  {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                </span>
              </button>

              {/* Comment button */}
              <Link href={`/track/${video.id}#comments`} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold">
                  {video.view_count > 999 ? `${(video.view_count / 1000).toFixed(1)}K` : video.view_count}
                </span>
              </Link>

              {/* Share button */}
              <button onClick={(e) => handleShare(video, e)} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
              </button>

              {/* Mute toggle */}
              <button onClick={() => toggleMute(video.id)} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isMuted ? (
                    <VolumeX className="h-7 w-7 text-white" />
                  ) : (
                    <Volume2 className="h-7 w-7 text-white" />
                  )}
                </div>
              </button>
            </div>

            <div className="absolute left-4 md:left-6 bottom-32 md:bottom-24 right-24 z-20 space-y-3">
              {/* Artist info */}
              <Link href={`/artist/${video.artist_id}`} className="flex items-center gap-3 group w-fit">
                <span className="text-white font-bold text-lg hover:underline">{video.artist_name}</span>
                <VerifiedBadge />
              </Link>

              {/* Track title */}
              <Link href={`/track/${video.id}`} className="block group">
                <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                  {video.title}
                </h2>
              </Link>

              {/* Music note with scrolling text effect (if caption exists) */}
              {video.ai_prompt && (
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Music2 className="h-4 w-4" />
                  <p className="line-clamp-1">{video.ai_prompt}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => togglePlayPause(video.id)}
              className="absolute inset-0 z-10 flex items-center justify-center group"
            >
              <div
                className={`w-20 h-20 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 ${
                  isPlaying ? "opacity-0 group-active:opacity-100" : "opacity-100"
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-10 w-10 text-white" fill="currentColor" />
                ) : (
                  <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                )}
              </div>
            </button>

            {/* Scroll indicator */}
            {index < videos.length - 1 && isActive && (
              <div className="absolute bottom-20 md:bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
                <div className="h-8 w-0.5 bg-gradient-to-b from-white/70 via-white/40 to-transparent rounded-full" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
