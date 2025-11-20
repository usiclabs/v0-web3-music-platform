"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Play, Pause, Square, SkipBack, Circle, Repeat, Timer } from "lucide-react"
import { useStudio } from "@/lib/studio/studio-context"
import { useState } from "react"

export function TransportControls() {
  const { transport, play, pause, stop, setBPM, setLoop, clearLoop } = useStudio()
  const [loopStart, setLoopStart] = useState(0)
  const [loopEnd, setLoopEnd] = useState(0)
  const [masterVolume, setMasterVolume] = useState(0.7)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  return (
    <div className="border-t border-border/40 bg-card/95 backdrop-blur-xl p-4">
      <div className="container">
        <div className="flex items-center gap-6">
          {/* Transport Buttons */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
              <SkipBack className="h-4 w-4" />
            </Button>
            {transport.isPlaying ? (
              <Button size="icon" className="h-10 w-10 rounded-full" onClick={pause}>
                <Pause className="h-5 w-5 fill-current" />
              </Button>
            ) : (
              <Button size="icon" className="h-10 w-10 rounded-full" onClick={play}>
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stop}>
              <Square className="h-4 w-4" />
            </Button>
            <Button variant={transport.isRecording ? "destructive" : "ghost"} size="icon" className="h-8 w-8">
              <Circle className={`h-4 w-4 ${transport.isRecording ? "fill-current animate-pulse" : ""}`} />
            </Button>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <div className="font-mono text-sm tabular-nums min-w-[100px]">{formatTime(transport.currentTime)}</div>
          </div>

          {/* BPM Control */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">BPM</span>
            <Input
              type="number"
              value={transport.bpm}
              onChange={(e) => setBPM(Number(e.target.value))}
              className="w-16 h-8"
              min={40}
              max={300}
            />
          </div>

          {/* Time Signature */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Time</span>
            <div className="font-mono text-sm">{transport.timeSignature}</div>
          </div>

          {/* Loop Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant={transport.loop ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                if (transport.loop) {
                  clearLoop()
                } else {
                  setLoop(loopStart, loopEnd)
                }
              }}
            >
              <Repeat className="h-4 w-4 mr-1" />
              Loop
            </Button>
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-muted-foreground">Master</span>
            <Slider
              value={[masterVolume]}
              max={1}
              step={0.01}
              className="w-24"
              onValueChange={([value]) => setMasterVolume(value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
