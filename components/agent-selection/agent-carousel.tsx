"use client"

import { useState, useRef, useEffect } from "react"
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
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX
    handleSwipe()
  }

  const handleSwipe = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left, go to next
        handleNext()
      } else {
        // Swiped right, go to previous
        handlePrev()
      }
    }
  }

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div
        className="relative h-80 md:h-96 flex items-center justify-center px-4 md:px-12 lg:px-16 pb-16 md:pb-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left Arrow - Hidden on mobile, visible on desktop */}
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full border border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Cards */}
        <div className="relative w-full h-full flex items-center justify-center overflow-visible">
          {agents.map((agent, index) => {
            const position = getCardPosition(index)
            const isVisible = Math.abs(position) <= 2

            if (!isVisible) return null

            return (
              <div
                key={agent.id}
                className="absolute transition-all duration-500"
                style={{
                  transform: `translateX(${position * 300}px) scale(${getScale(position)})`,
                  zIndex: position === 0 ? 50 : Math.max(0, 20 - Math.abs(position) * 5),
                }}
              >
                <AgentCard
                  agent={agent}
                  isSelected={position === 0}
                  onClick={() => onSelectAgent(agent.id)}
                  rotation={getRotation(position)}
                  scale={getScale(position)}
                  isMobile={Math.abs(position) !== 0}
                />
              </div>
            )
          })}

          {/* Glow Ring Platform - Desktop only */}
          {selectedIndex >= 0 && (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-24 border-2 border-red-500/30 rounded-full pointer-events-none hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500/20 to-transparent rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Right Arrow - Hidden on mobile, visible on desktop */}
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-40 p-2 rounded-full border border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Pagination Dots */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 pb-4 md:pb-6 z-20">
        {agents.map((agent, index) => (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            className={`rounded-full transition-all duration-300 ${
              selectedIndex === index ? "w-8 h-2.5 bg-red-500" : "w-2.5 h-2.5 bg-red-500/40 hover:bg-red-500/60"
            }`}
            aria-label={`Go to agent ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
