"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2, Coins } from "lucide-react"
import { X402_CONFIG } from "@/lib/web3/contracts"
import { useWallet } from "@/lib/web3/wallet-context"

interface VideoPlayerProps {
  videoUrl: string
  thumbnailUrl?: string | null
  title: string
  pricePerChunk: number
  unlockType: string
  trackId: string
  onPaymentRequired?: (chunk: number) => void
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  pricePerChunk,
  unlockType,
  trackId,
  onPaymentRequired,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [unlockedChunks, setUnlockedChunks] = useState<Set<number>>(new Set([0])) // First 30s free
  const [currentChunk, setCurrentChunk] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const { address } = useWallet()

  const isFullUnlock = unlockType === "full_song"
  const chunkDuration = X402_CONFIG.CHUNK_DURATION

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const chunk = Math.floor(video.currentTime / chunkDuration)
      setCurrentChunk(chunk)

      // Check if payment is required for current chunk
      if (!isFullUnlock && chunk > 0 && !unlockedChunks.has(chunk)) {
        video.pause()
        setIsPlaying(false)
        onPaymentRequired?.(chunk)
      }
    }

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
    }
  }, [chunkDuration, isFullUnlock, unlockedChunks, onPaymentRequired])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = value[0]
    const newChunk = Math.floor(newTime / chunkDuration)

    // Prevent seeking to locked chunks
    if (!isFullUnlock && newChunk > 0 && !unlockedChunks.has(newChunk)) {
      onPaymentRequired?.(newChunk)
      return
    }

    video.currentTime = newTime
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex items-center justify-between mt-1 text-xs text-white/70">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="h-10 w-10 p-0 text-white hover:bg-white/20"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="h-5 w-5 fill-current ml-0.5" />
              )}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={([value]) => {
                  setVolume(value)
                  setIsMuted(value === 0)
                }}
                className="w-20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFullUnlock && (
              <div className="text-xs text-white/70 bg-white/10 px-2 py-1 rounded">
                Segment {currentChunk + 1} • {pricePerChunk} USDC
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Payment Required Overlay */}
      {!isFullUnlock && currentChunk > 0 && !unlockedChunks.has(currentChunk) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6">
            <Coins className="h-12 w-12 text-primary mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Payment Required</h3>
              <p className="text-white/70">
                Pay {pricePerChunk} USDC to continue watching segment {currentChunk + 1}
              </p>
            </div>
            <Button onClick={() => onPaymentRequired?.(currentChunk)} className="gap-2">
              <Coins className="h-4 w-4" />
              Pay {pricePerChunk} USDC
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
