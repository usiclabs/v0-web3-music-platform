"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    if (prevPathRef.current === pathname) {
      setDisplayChildren(children)
      return
    }

    // Fade out, swap, fade in
    setIsTransitioning(true)
    const swap = setTimeout(() => {
      setDisplayChildren(children)
      setIsTransitioning(false)
      prevPathRef.current = pathname
      // Scroll to top on route change, smoothly
      window.scrollTo({ top: 0, behavior: "instant" })
    }, 120)

    return () => clearTimeout(swap)
  }, [pathname, children])

  return (
    <div
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "translateY(6px)" : "translateY(0)",
        transition: isTransitioning
          ? "opacity 120ms ease-in, transform 120ms ease-in"
          : "opacity 220ms ease-out, transform 220ms ease-out",
        willChange: "opacity, transform",
      }}
    >
      {displayChildren}
    </div>
  )
}
