"use client"

import { Zap } from "lucide-react"

export function BlockchainTicker() {
  return (
    <div className="sticky top-14 sm:top-16 z-40 w-full border-b border-border/40 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 backdrop-blur-xl overflow-hidden">
      <div className="relative h-8 flex items-center">
        <div className="animate-scroll-left flex items-center gap-12 whitespace-nowrap px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-xs font-semibold text-foreground">
                Token launching soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
