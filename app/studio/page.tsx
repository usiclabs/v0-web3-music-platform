"use client"

import { StudioProvider, useStudio } from "@/lib/studio/studio-context"
import { StudioTimeline } from "@/components/studio/studio-timeline"
import { TransportControls } from "@/components/studio/transport-controls"
import { StudioSidebar } from "@/components/studio/studio-sidebar"
import { StudioMixer } from "@/components/studio/studio-mixer"
import { StudioHeader } from "@/components/studio/studio-header"
import { StudioWelcome } from "@/components/studio/studio-welcome"
import { memo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, Sliders, X } from "lucide-react"

export const dynamic = "force-dynamic"

const StudioContent = memo(function StudioContent() {
  const { project } = useStudio()
  const [showSamples, setShowSamples] = useState(false)
  const [showMixer, setShowMixer] = useState(false)

  if (!project) {
    return <StudioWelcome />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StudioHeader />

      <div className="hidden lg:flex flex-1 min-h-0">
        <StudioSidebar />
        <div className="flex-1 flex flex-col min-h-0">
          <StudioTimeline />
        </div>
        <StudioMixer />
      </div>

      <div className="lg:hidden flex-1 flex flex-col min-h-0 relative">
        {/* Mobile Action Buttons */}
        <div className="absolute top-2 right-2 z-20 flex gap-2">
          <Button
            size="sm"
            variant={showSamples ? "default" : "secondary"}
            className="h-9 shadow-lg"
            onClick={() => {
              setShowSamples(!showSamples)
              setShowMixer(false)
            }}
          >
            <Menu className="h-4 w-4 mr-1" />
            Samples
          </Button>
          <Button
            size="sm"
            variant={showMixer ? "default" : "secondary"}
            className="h-9 shadow-lg"
            onClick={() => {
              setShowMixer(!showMixer)
              setShowSamples(false)
            }}
          >
            <Sliders className="h-4 w-4 mr-1" />
            Mixer
          </Button>
        </div>

        {/* Timeline - always visible on mobile */}
        <div className="flex-1 min-h-0">
          <StudioTimeline />
        </div>

        {/* Mobile Samples Panel - slides in from left */}
        <div
          className={`absolute inset-y-0 left-0 w-full sm:w-80 bg-background/95 backdrop-blur-xl border-r border-border shadow-2xl transition-transform duration-300 z-30 ${
            showSamples ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h2 className="font-semibold">Samples</h2>
            <Button size="sm" variant="ghost" onClick={() => setShowSamples(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <StudioSidebar />
        </div>

        {/* Mobile Mixer Panel - slides in from right */}
        <div
          className={`absolute inset-y-0 right-0 w-full sm:w-80 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl transition-transform duration-300 z-30 ${
            showMixer ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h2 className="font-semibold">Mixer</h2>
            <Button size="sm" variant="ghost" onClick={() => setShowMixer(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <StudioMixer />
        </div>

        {/* Overlay - closes panels when tapped */}
        {(showSamples || showMixer) && (
          <div
            className="absolute inset-0 bg-black/50 z-20"
            onClick={() => {
              setShowSamples(false)
              setShowMixer(false)
            }}
          />
        )}
      </div>

      <TransportControls />
    </div>
  )
})

export default function StudioPage() {
  return (
    <StudioProvider>
      <StudioContent />
    </StudioProvider>
  )
}
