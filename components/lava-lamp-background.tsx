"use client"

import { useEffect, useRef } from "react"

interface LavaLampBackgroundProps {
  count?: number
  duration?: number
  intensity?: number
  colors?: string[]
}

export function LavaLampBackground({
  count = 8,
  duration = 20,
  intensity = 100,
  colors = [
    "rgba(229, 62, 62, 0.3)", // Primary red
    "rgba(220, 38, 38, 0.25)", // Accent red
    "rgba(239, 68, 68, 0.2)", // Lighter red
    "rgba(185, 28, 28, 0.3)", // Darker red
    "rgba(252, 165, 165, 0.15)", // Light red/pink
  ],
}: LavaLampBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const circles = containerRef.current?.querySelectorAll(".lava-circle")
    if (!circles) return

    circles.forEach((circle, index) => {
      const element = circle as HTMLElement
      const delay = index * (duration / count)
      element.style.animationDelay = `${delay}s`
    })
  }, [count, duration])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: count }).map((_, index) => {
        const size = Math.random() * 300 + 150 // 150-450px
        const color = colors[index % colors.length]
        const startX = Math.random() * 100
        const startY = Math.random() * 100
        const endX = Math.random() * 100
        const endY = Math.random() * 100

        return (
          <div
            key={index}
            className="lava-circle absolute rounded-full"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              filter: `blur(${intensity}px)`,
              left: `${startX}%`,
              top: `${startY}%`,
              animation: `lava-float-${index} ${duration}s ease-in-out infinite`,
              willChange: "transform",
            }}
          />
        )
      })}

      <style jsx>{`
        ${Array.from({ length: count })
          .map((_, index) => {
            const startX = Math.random() * 100
            const startY = Math.random() * 100
            const midX = Math.random() * 100
            const midY = Math.random() * 100
            const endX = Math.random() * 100
            const endY = Math.random() * 100

            return `
              @keyframes lava-float-${index} {
                0%, 100% {
                  transform: translate(0, 0) scale(1);
                  opacity: 0.6;
                }
                25% {
                  transform: translate(${(midX - startX) * 2}px, ${(midY - startY) * 2}px) scale(1.2);
                  opacity: 0.8;
                }
                50% {
                  transform: translate(${(endX - startX) * 2}px, ${(endY - startY) * 2}px) scale(0.9);
                  opacity: 0.7;
                }
                75% {
                  transform: translate(${(midX - startX) * 1.5}px, ${(midY - startY) * 1.5}px) scale(1.1);
                  opacity: 0.75;
                }
              }
            `
          })
          .join("\n")}
      `}</style>
    </div>
  )
}
