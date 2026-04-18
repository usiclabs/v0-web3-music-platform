"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Scroll to top instantly on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" })
  }, [pathname])

  return (
    // key forces a fresh mount on each route, triggering the CSS animation
    <div key={pathname} className="page-transition-enter">
      {children}
    </div>
  )
}
