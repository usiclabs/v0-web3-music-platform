"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useAccount } from "wagmi"
import { X, Pause, Volume2, VolumeX, Lock, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Story {
  id: string
  artist_address: string
  media_url: string
  media_type: string
  thumbnail_url: string
  duration: number
  caption: string
  link_url: string
  link_text: string
  is_token_gated: boolean
  required_token_address: string
  required_token_amount: number
  view_count: number
  created_at: string
}

interface ArtistWithStories {
  artist: {
    wallet_address: string
    artist_name: string
    avatar_url: string
    profile_token_address: string
  }
  stories: Story[]
  hasUnviewed: boolean
}

interface StoriesViewerProps {
  artist: ArtistWithStories
  allArtists: ArtistWithStories[]
  onClose: () => void
  onStoryChange?: () => void
}

export function StoriesViewer({ artist, allArtists, onClose, onStoryChange }: StoriesViewerProps) {
  const { address } = useAccount()
  const [currentArtistIndex, setCurrentArtistIndex] = useState(() =>
    allArtists.findIndex((a) => a.artist.wallet_address === artist.artist.wallet_address),
  )
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasAccess, setHasAccess] = useState(true)
  const [isCheckingAccess, setIsCheckingAccess] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout>()

  const currentArtist = allArtists[currentArtistIndex]
  const currentStory = currentArtist.stories[currentStoryIndex]
  const isVideo = currentStory.media_type === "video"

  useEffect(() => {
    checkStoryAccess()
    recordView()
  }, [currentStoryIndex, currentArtistIndex])

  useEffect(() => {
    if (isPaused || !hasAccess) return

    const duration = isVideo
      ? (videoRef.current?.duration || currentStory.duration) * 1000
      : currentStory.duration * 1000
    const interval = 50
    const increment = (interval / duration) * 100

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext()
          return 0
        }
        return prev + increment
      })
    }, interval)

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [isPaused, currentStoryIndex, currentArtistIndex, hasAccess, isVideo])

  async function checkStoryAccess() {
    if (!currentStory.is_token_gated || !address) {
      setHasAccess(true)
      return
    }

    setIsCheckingAccess(true)
    try {
      const response = await fetch("/api/stories/check-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          viewerAddress: address,
          tokenAddress: currentStory.required_token_address,
          requiredAmount: currentStory.required_token_amount,
        }),
      })

      const data = await response.json()
      setHasAccess(data.hasAccess)
    } catch (error) {
      console.error("[Stories Viewer] Error checking access:", error)
      setHasAccess(false)
    } finally {
      setIsCheckingAccess(false)
    }
  }

  async function recordView() {
    if (!address || !hasAccess) return

    try {
      await fetch(`/api/stories/${currentStory.id}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ viewerAddress: address }),
      })
      onStoryChange?.()
    } catch (error) {
      console.error("[Stories Viewer] Error recording view:", error)
    }
  }

  function goToNext() {
    if (currentStoryIndex < currentArtist.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1)
      setProgress(0)
    } else if (currentArtistIndex < allArtists.length - 1) {
      setCurrentArtistIndex((prev) => prev + 1)
      setCurrentStoryIndex(0)
      setProgress(0)
    } else {
      onClose()
    }
  }

  function goToPrevious() {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1)
      setProgress(0)
    } else if (currentArtistIndex > 0) {
      setCurrentArtistIndex((prev) => prev - 1)
      const prevArtist = allArtists[currentArtistIndex - 1]
      setCurrentStoryIndex(prevArtist.stories.length - 1)
      setProgress(0)
    }
  }

  function handleTap(e: React.MouseEvent | React.TouchEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX : e.clientX
    const clickPosition = (x - rect.left) / rect.width

    if (clickPosition < 0.33) {
      goToPrevious()
    } else if (clickPosition > 0.66) {
      goToNext()
    } else {
      setIsPaused(!isPaused)
      if (isVideo && videoRef.current) {
        if (isPaused) {
          videoRef.current.play()
        } else {
          videoRef.current.pause()
        }
      }
    }
  }

  function toggleMute() {
    setIsMuted(!isMuted)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    return `${Math.floor(seconds / 86400)}d`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Desktop Navigation */}
      <div className="hidden md:flex absolute inset-y-0 left-0 items-center pl-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 hover:bg-black/70"
          onClick={goToPrevious}
          disabled={currentArtistIndex === 0 && currentStoryIndex === 0}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="hidden md:flex absolute inset-y-0 right-0 items-center pr-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 hover:bg-black/70"
          onClick={goToNext}
          disabled={
            currentArtistIndex === allArtists.length - 1 && currentStoryIndex === currentArtist.stories.length - 1
          }
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Story Container */}
      <div className="relative w-full h-full md:w-[420px] md:h-[calc(100vh-80px)] md:rounded-2xl overflow-hidden bg-black">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentArtist.stories.map((_, idx) => (
            <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: idx < currentStoryIndex ? "100%" : idx === currentStoryIndex ? `${progress}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 flex items-center justify-between">
          <Link
            href={`/artist/${currentArtist.artist.wallet_address}`}
            className="flex items-center gap-3 group"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar className="h-10 w-10 ring-2 ring-white">
              <AvatarImage src={currentArtist.artist.avatar_url || "/placeholder.svg"} />
              <AvatarFallback>{currentArtist.artist.artist_name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm group-hover:underline">
                {currentArtist.artist.artist_name || `${currentArtist.artist.wallet_address.slice(0, 8)}...`}
              </span>
              <span className="text-white/70 text-xs">{timeSince(currentStory.created_at)} ago</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {isVideo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 hover:bg-black/70 text-white"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer"
          onClick={handleTap}
          onTouchStart={handleTap}
        >
          {isCheckingAccess ? (
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
              <p className="text-white/70">Checking access...</p>
            </div>
          ) : !hasAccess ? (
            <div className="flex flex-col items-center gap-6 p-8 text-center max-w-sm">
              <div className="h-20 w-20 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Lock className="h-10 w-10 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Token-Gated Story</h3>
                <p className="text-white/70 text-sm">
                  Hold {currentStory.required_token_amount} {currentArtist.artist.artist_name} tokens to view this story
                </p>
              </div>
              <Link href={`/artist/${currentArtist.artist.wallet_address}`}>
                <Button className="rounded-full">Get Tokens</Button>
              </Link>
            </div>
          ) : isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="w-full h-full object-cover"
              autoPlay
              loop={false}
              muted={isMuted}
              playsInline
              onEnded={goToNext}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0
                }
              }}
            />
          ) : (
            <img
              src={currentStory.media_url || "/placeholder.svg"}
              alt="Story"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Caption & Link */}
        {hasAccess && (currentStory.caption || currentStory.link_url) && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
            {currentStory.caption && <p className="text-white text-sm mb-3">{currentStory.caption}</p>}
            {currentStory.link_url && (
              <a
                href={currentStory.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/30 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-white text-sm font-medium">{currentStory.link_text || "Learn More"}</span>
                <ExternalLink className="h-4 w-4 text-white" />
              </a>
            )}
          </div>
        )}

        {/* Pause Indicator */}
        {isPaused && hasAccess && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-20 w-20 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center">
              <Pause className="h-10 w-10 text-white fill-current" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
