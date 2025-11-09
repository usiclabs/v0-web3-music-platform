"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Heart, Sparkles } from "lucide-react"
import { useAudioPlayer } from "@/lib/audio-player-context"
import type { TrackWithArtist } from "@/types/database"

type TrackWithStats = TrackWithArtist & {
  total_earned?: number
  play_count?: number
  like_count?: number
}

interface WallpaperCarouselProps {
  tracks: TrackWithStats[]
}

export function WallpaperCarousel({ tracks }: WallpaperCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoplayRef = useRef<NodeJS.Timeout>()
  const { playTrack } = useAudioPlayer()

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index)
    setScrollProgress(0)
  }, [])

  const nextSlide = useCallback(() => {
    goToSlide((currentIndex + 1) % tracks.length)
  }, [currentIndex, tracks.length, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide(currentIndex === 0 ? tracks.length - 1 : currentIndex - 1)
  }, [currentIndex, tracks.length, goToSlide])

  useEffect(() => {
    if (!isAutoPlaying || tracks.length <= 1) return

    autoplayRef.current = setInterval(() => {
      nextSlide()
    }, 6000)

    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current)
    }
  }, [isAutoPlaying, nextSlide, tracks.length])

  useEffect(() => {
    let animationFrameId: number
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 6000, 1)
      setScrollProgress(progress)

      if (progress < 1 && isAutoPlaying) {
        animationFrameId = requestAnimationFrame(animate)
      }
    }

    if (isAutoPlaying) {
      animationFrameId = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [currentIndex, isAutoPlaying])

  const handleInteractionStart = () => {
    setIsAutoPlaying(false)
  }

  const handleInteractionEnd = () => {
    setIsAutoPlaying(true)
  }

  if (tracks.length === 0) return null

  const currentTrack = tracks[currentIndex]
  const nextIndex = (currentIndex + 1) % tracks.length
  const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-black"
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      <div className="absolute inset-0">
        {tracks.map((track, index) => {
          const isActive = index === currentIndex
          const opacity = isActive ? 1 : 0
          const scale = isActive ? 1 + scrollProgress * 0.1 : 1

          return (
            <div
              key={track.id}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity }}
            >
              <div
                className="absolute inset-0 transition-transform duration-6000 ease-out"
                style={{
                  transform: `scale(${scale})`,
                }}
              >
                <Image
                  src={
                    track.cover_url ||
                    `/placeholder.svg?height=1080&width=1920&query=${encodeURIComponent(track.title)}`
                  }
                  alt={track.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  quality={90}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>
          )
        })}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {/* Previous slide preview */}
        <div
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-16 h-24 md:w-24 md:h-36 rounded-lg overflow-hidden opacity-40 blur-[2px] transition-all duration-500 hover:opacity-60"
          style={{
            transform: `translateY(-50%) translateX(${-20 + scrollProgress * 20}px) scale(${0.8 + scrollProgress * 0.1})`,
          }}
        >
          <Image src={tracks[prevIndex].cover_url || "/placeholder.svg"} alt="" fill className="object-cover" />
        </div>

        {/* Next slide preview */}
        <div
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-16 h-24 md:w-24 md:h-36 rounded-lg overflow-hidden opacity-40 blur-[2px] transition-all duration-500 hover:opacity-60"
          style={{
            transform: `translateY(-50%) translateX(${20 - scrollProgress * 20}px) scale(${0.8 + scrollProgress * 0.1})`,
          }}
        >
          <Image src={tracks[nextIndex].cover_url || "/placeholder.svg"} alt="" fill className="object-cover" />
        </div>
      </div>

      <div className="relative h-full flex items-end pb-16 md:pb-24">
        <div className="container px-6 md:px-8 max-w-4xl">
          <div
            className="space-y-4 md:space-y-6"
            style={{
              transform: `translateY(${scrollProgress * -10}px)`,
              opacity: 1 - scrollProgress * 0.3,
            }}
          >
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/40 shadow-lg shadow-primary/20"
              style={{
                transform: `translateY(${-scrollProgress * 15}px)`,
                opacity: 1 - scrollProgress * 0.4,
              }}
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-bold text-primary tracking-wide">FEATURED</span>
            </div>

            {/* Title */}
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-black text-white text-balance leading-[0.95] tracking-tight"
              style={{
                transform: `translateY(${-scrollProgress * 20}px)`,
                opacity: 1 - scrollProgress * 0.5,
                textShadow: "0 4px 24px rgba(0,0,0,0.5)",
              }}
            >
              {currentTrack.title}
            </h1>

            {/* Artist */}
            <Link href={`/artist/${currentTrack.artist_id}`}>
              <p
                className="text-xl md:text-3xl text-white/90 hover:text-primary transition-colors font-semibold"
                style={{
                  transform: `translateY(${-scrollProgress * 18}px)`,
                  opacity: 1 - scrollProgress * 0.4,
                }}
              >
                {currentTrack.artist?.artist_name ||
                  `${currentTrack.artist_id.slice(0, 6)}...${currentTrack.artist_id.slice(-4)}`}
              </p>
            </Link>

            {/* Stats */}
            <div
              className="flex items-center gap-6 text-base md:text-lg text-white/70 font-medium"
              style={{
                transform: `translateY(${-scrollProgress * 15}px)`,
                opacity: 1 - scrollProgress * 0.4,
              }}
            >
              {currentTrack.play_count && currentTrack.play_count > 0 && (
                <span className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {currentTrack.play_count.toLocaleString()} plays
                </span>
              )}
              {currentTrack.like_count && currentTrack.like_count > 0 && (
                <span className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {currentTrack.like_count.toLocaleString()} likes
                </span>
              )}
            </div>

            {/* Actions */}
            <div
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              style={{
                transform: `translateY(${-scrollProgress * 12}px)`,
                opacity: 1 - scrollProgress * 0.3,
              }}
            >
              <Button
                size="lg"
                className="rounded-full px-8 h-14 text-lg font-bold shadow-2xl shadow-primary/50 hover:shadow-primary/70 hover:scale-105 active:scale-95 transition-all bg-primary hover:bg-primary/90"
                onClick={() => playTrack(currentTrack, tracks)}
              >
                <Play className="h-5 w-5 mr-2 fill-current" />
                Play Now
              </Button>
              <Link href={`/track/${currentTrack.id}`} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-full px-8 h-14 text-lg font-bold bg-white/10 backdrop-blur-xl border-2 border-white/30 hover:bg-white/20 hover:border-white/50 hover:scale-105 active:scale-95 transition-all"
                >
                  View Details
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {tracks.map((_, index) => {
          const isActive = index === currentIndex
          return (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="group relative"
              aria-label={`Go to slide ${index + 1}`}
            >
              {/* Background track */}
              <div className="h-1.5 w-8 bg-white/30 rounded-full overflow-hidden backdrop-blur-sm">
                {/* Progress fill */}
                {isActive && (
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{
                      width: `${scrollProgress * 100}%`,
                    }}
                  />
                )}
              </div>
              {/* Active indicator */}
              {isActive && (
                <div className="absolute inset-0 rounded-full ring-2 ring-primary/50 ring-offset-2 ring-offset-black" />
              )}
              {/* Hover effect */}
              <div className="absolute inset-0 -m-2 rounded-full group-hover:bg-white/10 transition-colors" />
            </button>
          )
        })}
      </div>

      {tracks.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/60 hover:scale-110 active:scale-95 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
            aria-label="Previous slide"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 h-12 w-12 md:h-14 md:w-14 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/60 hover:scale-110 active:scale-95 transition-all opacity-0 hover:opacity-100 focus:opacity-100"
            aria-label="Next slide"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
