"use client"

import { useStudio } from "@/lib/studio/studio-context"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { X } from "lucide-react"
import { useState } from "react"

export function StudioMixer() {
  const { tracks, setTrackVolume, setTrackPan } = useStudio()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="absolute top-20 right-4 z-10 bg-transparent"
        onClick={() => setIsOpen(true)}
      >
        Open Mixer
      </Button>
    )
  }

  return (
    <div className="w-80 border-l border-border/40 bg-card/30 flex flex-col">
      <div className="p-3 border-b border-border/40 flex items-center justify-between">
        <h2 className="font-semibold">Mixer</h2>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex gap-4">
          {tracks.map((track) => (
            <div key={track.id} className="flex flex-col items-center gap-4 min-w-[80px]">
              {/* Fader */}
              <div className="h-48 flex flex-col items-center">
                <Slider
                  orientation="vertical"
                  value={[track.volume]}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => setTrackVolume(track.id, value)}
                  className="h-full"
                />
                <span className="text-xs mt-2 font-mono">{Math.round(track.volume * 100)}</span>
              </div>

              {/* Pan */}
              <div className="w-full">
                <Slider
                  value={[track.pan]}
                  min={-1}
                  max={1}
                  step={0.01}
                  onValueChange={([value]) => setTrackPan(track.id, value)}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>L</span>
                  <span>C</span>
                  <span>R</span>
                </div>
              </div>

              {/* Track Name */}
              <div className="text-xs text-center truncate w-full" style={{ color: track.color }}>
                {track.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
