"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)

    const timer = setTimeout(() => {
      setDisplayChildren(children)
      // Small delay before fade in for smoother transition
      requestAnimationFrame(() => {
        setIsTransitioning(false)
      })
    }, 200)

    return () => clearTimeout(timer)
  }, [pathname])

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isTransitioning ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
      }`}
      style={{
        willChange: isTransitioning ? "opacity, transform" : "auto",
      }}
    >
      {displayChildren}
    </div>
  )
}
