"use client"

import { Zap, ChevronRight } from "lucide-react"

export function TokenBanner() {
  return (
    <div className="mt-16 px-6 mb-6">
      <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-red-900/40 to-black/60 border border-red-500/30 p-4 backdrop-blur-xl">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-50" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-sm font-semibold text-white">Token launching soon</span>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  )
}
