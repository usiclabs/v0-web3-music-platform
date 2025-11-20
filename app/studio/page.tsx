"use client"

import { StudioProvider, useStudio } from "@/lib/studio/studio-context"
import { StudioTimeline } from "@/components/studio/studio-timeline"
import { TransportControls } from "@/components/studio/transport-controls"
import { StudioSidebar } from "@/components/studio/studio-sidebar"
import { StudioMixer } from "@/components/studio/studio-mixer"
import { StudioHeader } from "@/components/studio/studio-header"
import { StudioWelcome } from "@/components/studio/studio-welcome"
import { memo } from "react"

const StudioContent = memo(function StudioContent() {
  const { project } = useStudio()

  console.log("[v0] StudioContent render, project:", project ? project.name : "null")

  if (!project) {
    return <StudioWelcome />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StudioHeader />

      <div className="flex-1 flex min-h-0">
        <StudioSidebar />

        <div className="flex-1 flex flex-col min-h-0">
          <StudioTimeline />
        </div>

        <StudioMixer />
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
