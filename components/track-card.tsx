"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Heart, VideoIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { TrackWithArtist } from "@/types/database"
import { useAudioPlayer } from "@/lib/audio-player-context"
import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { AddToPlaylistModal } from "./add-to-playlist-modal"

interface TrackCardProps {
  track: TrackWithArtist & {
    total_earned?: number
    play_count?: number
    like_count?: number
    content_type?: string
    thumbnail_url?: string
  }
  queue?: TrackWithArtist[]
}

export function TrackCard({ track, queue }: TrackCardProps) {
  const { playTrack } = useAudioPlayer()
  const { address } = useWallet()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(track.like_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const [likesAvailable, setLikesAvailable] = useState(true)

  useEffect(() => {
    if (address) {
      checkIfLiked()
    }
  }, [address, track.id])

  async function checkIfLiked() {
    if (!address) return

    try {
      const response = await fetch("/api/likes/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress: address, trackIds: [track.id] }),
      })

      if (!response.ok) {
        setLikesAvailable(false)
        return
      }

      const data = await response.json()
      setIsLiked(data[track.id] || false)
    } catch (error) {
      console.error("Failed to check like status:", error)
      setLikesAvailable(false)
    }
  }

  async function toggleLike() {
    if (!address || isLiking || !likesAvailable) return

    setIsLiking(true)
    const wasLiked = isLiked

    setIsLiked(!isLiked)
    setLikeCount((prev) => (wasLiked ? prev - 1 : prev + 1))

    try {
      if (wasLiked) {
        const response = await fetch(`/api/likes/${track.id}?userAddress=${address}`, {
          method: "DELETE",
        })

        if (response.status === 503) {
          setLikesAvailable(false)
          setIsLiked(wasLiked)
          setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1))
          return
        }
      } else {
        const response = await fetch(`/api/likes/${track.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userAddress: address }),
        })

        if (response.status === 503) {
          setLikesAvailable(false)
          setIsLiked(wasLiked)
          setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1))
          return
        }
      }
    } catch (error) {
      console.error("Failed to toggle like:", error)
      setIsLiked(wasLiked)
      setLikeCount((prev) => (wasLiked ? prev + 1 : prev - 1))
    } finally {
      setIsLiking(false)
    }
  }

  const handlePlay = () => {
    if (track.content_type === "audio") {
      if (queue && queue.length > 0) {
        playTrack(track, queue)
      } else {
        playTrack(track)
      }
    }
  }

  const thumbnailUrl =
    track.content_type === "video"
      ? track.thumbnail_url || "/video-thumbnail.png"
      : track.cover_url || "/abstract-soundscape.png"

  return (
    <Card className="bg-card/50 backdrop-blur-xl border border-border/50 group overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:shadow-2xl hover:shadow-primary/40 hover:border-primary/50 hover:bg-card/70">
      <div className="relative aspect-square overflow-hidden">
        {track.content_type === "video" && (
          <div className="absolute top-2 right-2 z-10 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-primary/30 shadow-lg shadow-primary/20">
            <VideoIcon className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-xs font-bold text-white tracking-wide">VIDEO</span>
          </div>
        )}
        <Image
          src={thumbnailUrl || "/placeholder.svg"}
          alt={track.title}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center">
          {track.content_type === "video" ? (
            <Link href={`/track/${track.id}`}>
              <Button
                size="lg"
                className="rounded-full h-16 w-16 p-0 shadow-2xl shadow-primary/60 animate-scale-in hover:scale-125 transition-all duration-300 bg-primary hover:bg-primary/90"
              >
                <Play className="h-7 w-7 fill-current ml-1" />
              </Button>
            </Link>
          ) : (
            <Button
              size="lg"
              className="rounded-full h-16 w-16 p-0 shadow-2xl shadow-primary/60 animate-scale-in hover:scale-125 transition-all duration-300 bg-primary hover:bg-primary/90"
              onClick={handlePlay}
            >
              <Play className="h-7 w-7 fill-current ml-1" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-5">
        <Link href={`/track/${track.id}`}>
          <h3 className="font-bold text-lg mb-1.5 hover:text-primary transition-colors line-clamp-1 group-hover:text-primary">
            {track.title}
          </h3>
        </Link>
        <Link href={`/artist/${track.artist_id}`}>
          <p className="text-sm text-muted-foreground hover:text-foreground transition-colors line-clamp-1 font-medium">
            {track.artist.artist_name || formatAddress(track.artist_id)}
          </p>
        </Link>
        {track.total_earned !== undefined && track.total_earned > 0 && (
          <p className="text-xs font-bold mt-2 text-green-500 animate-pulse">
            {track.total_earned.toFixed(4)} USDC earned
          </p>
        )}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <span className="text-xs text-muted-foreground font-semibold">
            {track.unlock_type === "full_song"
              ? `${track.price_per_chunk} USDC to unlock`
              : `${track.price_per_chunk} USDC/play`}
          </span>
          <div className="flex items-center gap-2">
            <AddToPlaylistModal trackId={track.id} trackTitle={track.title} />
            {likesAvailable && (
              <>
                {likeCount > 0 && <span className="text-xs text-muted-foreground font-medium">{likeCount}</span>}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:scale-125 transition-all duration-300"
                  onClick={toggleLike}
                  disabled={!address || isLiking}
                >
                  <Heart
                    className={`h-4 w-4 transition-all duration-300 ${
                      isLiked ? "fill-red-500 text-red-500 scale-125" : ""
                    }`}
                  />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
