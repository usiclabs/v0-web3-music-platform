"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Image from "next/image"
import { Play, Pause, Heart, MessageCircle, Share2, Music2, Volume2, VolumeX, Loader2 } from 'lucide-react'
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
  const [bufferingVideos, setBufferingVideos] = useState<Set<string>>(new Set())
  const [videoProgress, setVideoProgress] = useState<Map<string, number>>(new Map())
  const [touchStart, setTouchStart] = useState<{ y: number; time: number } | null>(null)
  const [lastTap, setLastTap] = useState<{ time: number; side: 'left' | 'right' | null }>({ time: 0, side: null })
  const { address } = useWallet()
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map())
  const [isLiking, setIsLiking] = useState<string | null>(null)
  const [likeAnimation, setLikeAnimation] = useState<{ videoId: string; x: number; y: number } | null>(null)
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
    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId)
      clearTimeout(scrollTimeout)

      rafId = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop
        const itemHeight = window.innerHeight
        const index = Math.round(scrollTop / itemHeight)

        if (index !== lastIndex && index >= 0 && index < videos.length) {
          lastIndex = index
          setCurrentIndex(index)

          if (index + 1 < videos.length) {
            const nextVideo = videoRefs.current.get(videos[index + 1].id)
            if (nextVideo && nextVideo.readyState < 2) {
              nextVideo.load()
            }
          }

          console.log("[v0] Scrolled to video index:", index)
          videoRefs.current.forEach((video, videoId) => {
            const videoIndex = videos.findIndex((v) => v.id === videoId)
            if (videoIndex === index) {
              // Play current video
              console.log("[v0] Playing video:", videoId)
              video.play().catch((e) => console.log("[v0] Video autoplay prevented:", e.message))
              setPlayingVideos((prev) => new Set(prev).add(videoId))
            } else {
              // Pause and reset all other videos immediately
              console.log("[v0] Pausing video:", videoId)
              video.pause()
              video.currentTime = 0
              setPlayingVideos((prev) => {
                const newSet = new Set(prev)
                newSet.delete(videoId)
                return newSet
              })
            }
          })
        }
      })

      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop
        const itemHeight = window.innerHeight
        const targetIndex = Math.round(scrollTop / itemHeight)
        const targetScroll = targetIndex * itemHeight
        
        if (Math.abs(scrollTop - targetScroll) > 5) {
          container.scrollTo({
            top: targetScroll,
            behavior: 'smooth'
          })
        }
      }, 150)
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      clearTimeout(scrollTimeout)
      container.removeEventListener("scroll", handleScroll)
    }
  }, [videos])

  useEffect(() => {
    videoRefs.current.forEach((video, videoId) => {
      const handleWaiting = () => setBufferingVideos(prev => new Set(prev).add(videoId))
      const handleCanPlay = () => setBufferingVideos(prev => {
        const newSet = new Set(prev)
        newSet.delete(videoId)
        return newSet
      })
      const handleTimeUpdate = () => {
        if (video.duration) {
          const progress = (video.currentTime / video.duration) * 100
          setVideoProgress(prev => new Map(prev).set(videoId, progress))
        }
      }

      video.addEventListener('waiting', handleWaiting)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('timeupdate', handleTimeUpdate)

      return () => {
        video.removeEventListener('waiting', handleWaiting)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('timeupdate', handleTimeUpdate)
      }
    })
  }, [videos])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentVideo = videos[currentIndex]
      if (!currentVideo) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlayPause(currentVideo.id)
          break
        case 'ArrowUp':
          e.preventDefault()
          scrollToVideo(Math.max(0, currentIndex - 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          scrollToVideo(Math.min(videos.length - 1, currentIndex + 1))
          break
        case 'm':
          e.preventDefault()
          toggleMute(currentVideo.id)
          break
        case 'l':
          e.preventDefault()
          if (address) {
            toggleLike(currentVideo.id, new MouseEvent('click') as any)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, videos, address])

  const scrollToVideo = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return

    const itemHeight = window.innerHeight
    container.scrollTo({
      top: index * itemHeight,
      behavior: 'smooth'
    })
  }, [])

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

  const handleTouchStart = useCallback((e: React.TouchEvent, videoId: string) => {
    const touch = e.touches[0]
    setTouchStart({ y: touch.clientY, time: Date.now() })
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent, videoId: string) => {
    if (!touchStart) return

    const touch = e.changedTouches[0]
    const deltaY = touch.clientY - touchStart.y
    const deltaTime = Date.now() - touchStart.time
    const velocity = Math.abs(deltaY) / deltaTime

    const now = Date.now()
    const tapX = touch.clientX
    const screenWidth = window.innerWidth
    const side = tapX < screenWidth / 2 ? 'left' : 'right'

    if (now - lastTap.time < 300 && deltaTime < 200 && Math.abs(deltaY) < 10) {
      e.preventDefault()
      
      if (side === 'right' && address && !likedVideos.has(videoId)) {
        setLikeAnimation({ videoId, x: tapX, y: touch.clientY })
        toggleLike(videoId, e as any)
        setTimeout(() => setLikeAnimation(null), 1000)
      } else if (side === 'left') {
        const video = videoRefs.current.get(videoId)
        if (video) {
          video.currentTime = Math.max(0, video.currentTime - 10)
        }
      }
    } else if (deltaTime < 200 && Math.abs(deltaY) < 10) {
      togglePlayPause(videoId)
    }

    setLastTap({ time: now, side })
    setTouchStart(null)
  }, [touchStart, lastTap, address, likedVideos])

  async function toggleLike(videoId: string, e: React.MouseEvent | React.TouchEvent) {
    e.stopPropagation()
    if (!address || isLiking) return

    setIsLiking(videoId)
    const wasLiked = likedVideos.has(videoId)
    const currentCount = likeCounts.get(videoId) || 0

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
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("[v0] Share failed:", error)
        toast({
          title: "Share failed",
          description: "Could not share video",
          variant: "destructive",
        })
      }
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
        const isBuffering = bufferingVideos.has(video.id)
        const progress = videoProgress.get(video.id) || 0

        return (
          <div
            key={video.id}
            className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-black"
            onTouchStart={(e) => handleTouchStart(e, video.id)}
            onTouchEnd={(e) => handleTouchEnd(e, video.id)}
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
              preload={Math.abs(index - currentIndex) <= 1 ? "auto" : "metadata"}
            />

            {isBuffering && isActive && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              </div>
            )}

            {isActive && (
              <div className="absolute top-0 left-0 right-0 z-30 h-0.5 bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {likeAnimation && likeAnimation.videoId === video.id && (
              <div
                className="absolute z-40 pointer-events-none animate-like-burst"
                style={{ 
                  left: likeAnimation.x - 50, 
                  top: likeAnimation.y - 50 
                }}
              >
                <Heart className="h-24 w-24 fill-red-500 text-red-500 drop-shadow-2xl" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

            <div className="absolute right-4 bottom-32 md:bottom-24 z-20 flex flex-col gap-6">
              <Link href={`/artist/${video.artist_id}`} className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative w-14 h-14 rounded-full border-2 border-white overflow-hidden shadow-xl">
                  <Image
                    src={video.avatar_url || "/placeholder.svg"}
                    alt={video.artist_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-black shadow-lg">
                  <Music2 className="h-3 w-3 text-white" />
                </div>
              </Link>

              <button
                onClick={(e) => toggleLike(video.id, e)}
                disabled={!address || isLiking === video.id}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="relative w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <Heart
                    className={`h-7 w-7 transition-all duration-300 ${
                      isLiked
                        ? "fill-red-500 text-red-500 scale-110"
                        : "text-white group-hover:scale-110"
                    }`}
                  />
                  {isLiked && <div className="absolute inset-0 rounded-full bg-red-500/30 blur-xl animate-pulse" />}
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
                </span>
              </button>

              <Link href={`/track/${video.id}#comments`} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <MessageCircle className="h-7 w-7 text-white" />
                </div>
                <span className="text-white text-xs font-semibold drop-shadow-lg">
                  {video.view_count > 999 ? `${(video.view_count / 1000).toFixed(1)}K` : video.view_count}
                </span>
              </Link>

              <button onClick={(e) => handleShare(video, e)} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  <Share2 className="h-7 w-7 text-white" />
                </div>
              </button>

              <button onClick={() => toggleMute(video.id)} className="flex flex-col items-center gap-1 group">
                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                  {isMuted ? (
                    <VolumeX className="h-7 w-7 text-white" />
                  ) : (
                    <Volume2 className="h-7 w-7 text-white" />
                  )}
                </div>
              </button>
            </div>

            <div className="absolute left-4 md:left-6 bottom-32 md:bottom-24 right-24 z-20 space-y-3">
              <Link href={`/artist/${video.artist_id}`} className="flex items-center gap-3 group w-fit">
                <span className="text-white font-bold text-lg hover:underline drop-shadow-lg">{video.artist_name}</span>
                <VerifiedBadge />
              </Link>

              <Link href={`/track/${video.id}`} className="block group">
                <h2 className="text-white text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2 drop-shadow-lg">
                  {video.title}
                </h2>
              </Link>

              {video.ai_prompt && (
                <div className="flex items-center gap-2 text-white/90 text-sm drop-shadow-lg">
                  <Music2 className="h-4 w-4 flex-shrink-0" />
                  <p className="line-clamp-1">{video.ai_prompt}</p>
                </div>
              )}
            </div>

            {!isPlaying && (
              <button
                onClick={() => togglePlayPause(video.id)}
                className="absolute inset-0 z-10 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center transition-all duration-300 shadow-2xl">
                  <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />
                </div>
              </button>
            )}

            {index < videos.length - 1 && isActive && (
              <div className="absolute bottom-20 md:bottom-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 animate-bounce">
                <div className="h-8 w-0.5 bg-gradient-to-b from-white/70 via-white/40 to-transparent rounded-full" />
                <span className="text-white/60 text-xs font-semibold">{index + 1}/{videos.length}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
