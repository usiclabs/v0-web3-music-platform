"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useAudioPlayer } from "@/lib/audio-player-context"
import type { TrackWithArtist } from "@/types/database"

interface PlayTrackButtonProps {
  track: TrackWithArtist
  className?: string
}

export function PlayTrackButton({ track, className }: PlayTrackButtonProps) {
  const { playTrack } = useAudioPlayer()

  return (
    <Button size="lg" className={className} onClick={() => playTrack(track)}>
      <Play className="h-5 w-5 mr-2 fill-current" />
      Play Track
    </Button>
  )
}
