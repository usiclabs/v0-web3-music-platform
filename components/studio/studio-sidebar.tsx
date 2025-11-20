"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Music, Disc3, AudioWaveform as Waveform, Zap, Play } from "lucide-react"
import { useState, useMemo } from "react"
import { SAMPLE_CATEGORIES, getSamplesByCategory, searchSamples } from "@/lib/studio/sample-library"
import type { Sample } from "@/lib/studio/sample-library"
import { useStudio } from "@/lib/studio/studio-context"

export function StudioSidebar() {
  const [selectedCategory, setSelectedCategory] = useState<string>("Drums")
  const [searchQuery, setSearchQuery] = useState("")
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null)
  const { addTrack, addRegion, tracks } = useStudio()

  const audioRef = useState<HTMLAudioElement | null>(null)[0]

  const displayedSamples = useMemo(() => {
    if (searchQuery) {
      return searchSamples(searchQuery)
    }
    return getSamplesByCategory(selectedCategory)
  }, [selectedCategory, searchQuery])

  const handleDragStart = (e: React.DragEvent, sample: Sample) => {
    e.dataTransfer.setData("application/json", JSON.stringify(sample))
    e.dataTransfer.effectAllowed = "copy"
  }

  const handleSampleClick = async (sample: Sample) => {
    // If no tracks exist, create one first
    if (tracks.length === 0) {
      await addTrack("audio")
    }

    // Add sample to first audio track
    const audioTrack = tracks.find((t) => t.track_type === "audio")
    if (audioTrack) {
      await addRegion(audioTrack.id, sample.url, 0)
    }
  }

  const handlePreview = (sample: Sample) => {
    if (playingSampleId === sample.id) {
      setPlayingSampleId(null)
      if (audioRef) {
        audioRef.pause()
        audioRef.currentTime = 0
      }
    } else {
      if (audioRef) {
        audioRef.pause()
      }
      const audio = new Audio(sample.url)
      audio.play()
      setPlayingSampleId(sample.id)
      audio.onended = () => setPlayingSampleId(null)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Drums":
        return Disc3
      case "Bass":
        return Music
      case "Synths":
        return Waveform
      case "FX":
        return Zap
      default:
        return Music
    }
  }

  return (
    <div className="w-full lg:w-64 border-r border-border/40 bg-card/30 flex flex-col h-full">
      <div className="p-3 border-b border-border/40 lg:block hidden">
        <h2 className="font-semibold mb-3">Sample Browser</h2>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search samples..."
            className="pl-8 h-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-3 border-b border-border/40 lg:hidden">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search samples..."
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="p-3 space-y-1 border-b border-border/40">
        {SAMPLE_CATEGORIES.map((category) => {
          const Icon = getCategoryIcon(category.name)
          return (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "secondary" : "ghost"}
              className="w-full justify-start h-10 text-sm"
              onClick={() => {
                setSelectedCategory(category.name)
                setSearchQuery("")
              }}
            >
              <Icon className="h-4 w-4 mr-2" />
              {category.name}
              <span className="ml-auto text-xs text-muted-foreground">{category.count}</span>
            </Button>
          )
        })}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {displayedSamples.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">No samples found</div>
          ) : (
            displayedSamples.map((sample) => (
              <div
                key={sample.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sample)}
                className="group flex items-center gap-2 p-3 rounded-md hover:bg-accent/50 active:bg-accent cursor-pointer transition-colors touch-manipulation"
                onClick={() => handleSampleClick(sample)}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePreview(sample)
                  }}
                >
                  <Play className={`h-4 w-4 ${playingSampleId === sample.id ? "text-primary" : ""}`} />
                </Button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{sample.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {sample.duration.toFixed(1)}s {sample.bpm && `• ${sample.bpm} BPM`}
                    {sample.key && ` • ${sample.key}`}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
