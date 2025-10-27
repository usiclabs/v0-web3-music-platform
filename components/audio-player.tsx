"use client"

import { useAudioPlayer } from "@/lib/audio-player-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  AlertCircle,
  Coins,
  ChevronDown,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { X402_CONFIG } from "@/lib/web3/contracts"

export function AudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    paymentRequired,
    currentChunk,
    pause,
    resume,
    seek,
    setVolume,
    payForChunk,
    skipTrack,
  } = useAudioPlayer()
  const [isMuted, setIsMuted] = useState(false)
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  if (!currentTrack) return null

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 md:bottom-4 right-4 z-50 h-14 w-14 rounded-full hover:bg-primary/20 shadow-2xl shadow-primary/50 flex items-center justify-center transition-all hover:scale-110 animate-slide-up bg-primary/10 backdrop-blur-xl border border-primary/30 text-primary"
      >
        {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
      </button>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(0.7)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  const handlePayment = async () => {
    setIsPaymentProcessing(true)
    try {
      await payForChunk(currentChunk)
    } catch (err) {
      console.error("Payment failed:", err)
    } finally {
      setIsPaymentProcessing(false)
    }
  }

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/80 backdrop-blur-2xl animate-slide-up">
      <div className="container py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMinimized(true)}
          className="absolute top-2 right-2 h-8 w-8 p-0 hover:bg-white/10 transition-all z-10"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {error && (
          <div className="mb-3 flex items-center justify-between gap-2 text-sm bg-destructive/10 px-3 py-2 rounded-lg animate-slide-in-right border border-destructive/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive animate-pulse" />
              <span className="text-foreground">{error}</span>
            </div>
            {paymentRequired && (
              <Button
                size="sm"
                onClick={handlePayment}
                disabled={isPaymentProcessing}
                className="flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Coins className="h-4 w-4" />
                {isPaymentProcessing ? "Processing..." : `Pay ${currentTrack.price_per_chunk} USDC`}
              </Button>
            )}
          </div>
        )}

        {paymentRequired && (
          <div className="mb-3 flex items-center justify-between gap-2 text-sm bg-primary/10 px-3 py-2 rounded-lg animate-slide-in-right border border-primary/30 animate-pulse-glow">
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 flex-shrink-0 text-primary animate-glow" />
              <span className="text-foreground">
                Segment {currentChunk + 1} • {X402_CONFIG.CHUNK_DURATION}s • {currentTrack.price_per_chunk} USDC
              </span>
            </div>
            <Button
              size="sm"
              onClick={handlePayment}
              disabled={isPaymentProcessing}
              className="flex items-center gap-2 hover:scale-105 transition-transform"
            >
              <Coins className="h-4 w-4" />
              {isPaymentProcessing ? "Processing..." : "Pay to Continue"}
            </Button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative h-14 w-14 rounded-lg overflow-hidden flex-shrink-0 group">
              <Image
                src={currentTrack.cover_url || "/placeholder.svg?height=56&width=56&query=music"}
                alt={currentTrack.title}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/track/${currentTrack.id}`}>
                <h4 className="font-semibold text-sm truncate hover:text-primary transition-colors">
                  {currentTrack.title}
                </h4>
              </Link>
              <Link href={`/artist/${currentTrack.artist_id}`}>
                <p className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors">
                  {currentTrack.artist?.artist_name || formatAddress(currentTrack.artist_id)}
                </p>
              </Link>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:scale-110 transition-transform"
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`h-4 w-4 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : ""}`} />
            </Button>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:scale-110 transition-transform">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-10 w-10 rounded-full p-0 hover:scale-110 transition-transform shadow-lg shadow-primary/30"
                onClick={isPlaying ? pause : resume}
                disabled={paymentRequired}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:scale-110 transition-transform">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right font-mono">{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={([value]) => seek(value)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10 font-mono">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:scale-110 transition-transform"
              onClick={handleVolumeToggle}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={([value]) => {
                setVolume(value)
                setIsMuted(value === 0)
              }}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
