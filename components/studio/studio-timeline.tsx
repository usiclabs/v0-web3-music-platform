"use client"

import type React from "react"

import { useStudio } from "@/lib/studio/studio-context"
import { Button } from "@/components/ui/button"
import { Plus, Volume2, VolumeX, Mic, Trash2 } from "lucide-react"
import { useRef, useState } from "react"
import type { Sample } from "@/lib/studio/sample-library"

export function StudioTimeline() {
  const { tracks, regions, addTrack, deleteTrack, transport, addRegion, toggleMute, toggleSolo } = useStudio()
  const timelineRef = useRef<HTMLDivElement>(null)
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50)

  // Calculate timeline width based on zoom
  const timelineWidth = Math.max(2000, transport.currentTime * pixelsPerSecond + 1000)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Generate time markers
  const timeMarkers = []
  for (let i = 0; i <= timelineWidth / pixelsPerSecond; i += 5) {
    timeMarkers.push(i)
  }

  const handleDrop = async (e: React.DragEvent, trackId: string) => {
    e.preventDefault()
    const data = e.dataTransfer.getData("application/json")
    if (!data) return

    try {
      const sample: Sample = JSON.parse(data)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const startTime = x / pixelsPerSecond

      await addRegion(trackId, sample.url, Math.max(0, startTime))
    } catch (error) {
      console.error("[v0] Failed to add sample:", error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="border-b border-border/40 bg-card/50 px-4 py-2 flex items-center gap-2">
        <Button size="sm" onClick={() => addTrack("audio")}>
          <Plus className="h-4 w-4 mr-2" />
          Audio Track
        </Button>
        <Button size="sm" variant="outline" onClick={() => addTrack("midi")}>
          <Plus className="h-4 w-4 mr-2" />
          MIDI Track
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min="10"
            max="200"
            value={pixelsPerSecond}
            onChange={(e) => setPixelsPerSecond(Number(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers */}
        <div className="w-48 border-r border-border/40 bg-card/30 overflow-y-auto">
          {/* Ruler spacer */}
          <div className="h-8 border-b border-border/40 flex items-center px-2">
            <span className="text-xs font-medium text-muted-foreground">Tracks</span>
          </div>

          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="h-20 border-b border-border/40 flex flex-col justify-center px-2 gap-1"
              style={{ backgroundColor: `${track.color}15` }}
            >
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleMute(track.id)}>
                  {track.is_muted ? <VolumeX className="h-3 w-3 text-destructive" /> : <Volume2 className="h-3 w-3" />}
                </Button>
                <Button
                  variant={track.is_soloed ? "default" : "ghost"}
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleSolo(track.id)}
                >
                  <span className="text-xs font-bold">S</span>
                </Button>
                <Button variant={track.is_armed ? "destructive" : "ghost"} size="icon" className="h-6 w-6">
                  <Mic className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium truncate flex-1">{track.name}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => deleteTrack(track.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {tracks.length === 0 && (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
              Add a track to get started
            </div>
          )}
        </div>

        {/* Timeline Scroll Area */}
        <div ref={timelineRef} className="flex-1 overflow-auto relative">
          {/* Time Ruler */}
          <div className="sticky top-0 h-8 border-b border-border/40 bg-card/95 backdrop-blur-sm z-10 flex items-end">
            {timeMarkers.map((time) => (
              <div
                key={time}
                className="absolute flex flex-col items-start"
                style={{ left: `${time * pixelsPerSecond}px` }}
              >
                <div className="h-2 w-px bg-border" />
                <span className="text-xs text-muted-foreground ml-1">{formatTime(time)}</span>
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div className="relative" style={{ width: `${timelineWidth}px` }}>
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className="h-20 border-b border-border/40 relative"
                style={{ backgroundColor: `${track.color}05` }}
                onDrop={(e) => handleDrop(e, track.id)}
                onDragOver={handleDragOver}
              >
                {/* Grid lines */}
                {timeMarkers.map((time) => (
                  <div
                    key={time}
                    className="absolute top-0 bottom-0 w-px bg-border/20"
                    style={{ left: `${time * pixelsPerSecond}px` }}
                  />
                ))}

                {/* Regions */}
                {regions
                  .filter((r) => r.track_id === track.id)
                  .map((region) => (
                    <div
                      key={region.id}
                      className="absolute top-2 bottom-2 rounded border-2 border-white/20 bg-primary/80 backdrop-blur-sm cursor-move hover:border-primary transition-all group"
                      style={{
                        left: `${region.start_time * pixelsPerSecond}px`,
                        width: `${region.duration * pixelsPerSecond}px`,
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden">
                        {/* Waveform placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white/90 truncate px-2">{region.name}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive hover:bg-destructive/90"
                        onClick={(e) => {
                          e.stopPropagation()
                          // deleteRegion(region.id)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
              </div>
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
              style={{ left: `${transport.currentTime * pixelsPerSecond}px` }}
            >
              <div className="absolute -top-8 -left-2 w-4 h-4 bg-primary rotate-45 transform origin-bottom" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
