"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { AgentCard } from "./agent-card"
import type { Agent } from "./agent-data"

interface AgentCarouselProps {
  agents: Agent[]
  selectedAgentId: string
  onSelectAgent: (id: string) => void
}

export function AgentCarousel({ agents, selectedAgentId, onSelectAgent }: AgentCarouselProps) {
  const selectedIndex = agents.findIndex((a) => a.id === selectedAgentId)
  const [autoPlay, setAutoPlay] = useState(true)

  const getCardPosition = (index: number) => {
    const diff = index - selectedIndex
    return diff
  }

  const getRotation = (position: number) => {
    if (position === 0) return 0
    return position > 0 ? 15 : -15
  }

  const getScale = (position: number) => {
    if (position === 0) return 1
    return 0.85
  }

  const handlePrev = () => {
    setAutoPlay(false)
    const newIndex = selectedIndex === 0 ? agents.length - 1 : selectedIndex - 1
    onSelectAgent(agents[newIndex].id)
  }

  const handleNext = () => {
    setAutoPlay(false)
    const newIndex = selectedIndex === agents.length - 1 ? 0 : selectedIndex + 1
    onSelectAgent(agents[newIndex].id)
  }

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div className="relative h-96 flex items-center justify-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full border border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Cards */}
        <div className="relative w-full h-full flex items-center justify-center">
          {agents.map((agent, index) => {
            const position = getCardPosition(index)
            const isVisible = Math.abs(position) <= 2

            if (!isVisible) return null

            return (
              <div
                key={agent.id}
                className="absolute"
                style={{
                  transform: `translateX(${position * 200}px) translateZ(${Math.abs(position) * -50}px)`,
                }}
              >
                <AgentCard
                  agent={agent}
                  isSelected={position === 0}
                  onClick={() => onSelectAgent(agent.id)}
                  rotation={getRotation(position)}
                  scale={getScale(position)}
                />
              </div>
            )
          })}

          {/* Glow Ring Platform */}
          {selectedIndex >= 0 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-24 border-2 border-red-500/30 rounded-full pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full border border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Pagination Dots */}
      <div className="flex justify-center gap-2 mt-8 md:hidden">
        {agents.map((agent, index) => (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              selectedIndex === index ? "w-8 bg-red-500" : "bg-red-500/30 hover:bg-red-500/60"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
