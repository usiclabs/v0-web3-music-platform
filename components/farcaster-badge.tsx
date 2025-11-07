"use client"

import { useFarcaster } from "@/lib/farcaster-provider"
import { Users } from "lucide-react"

export function FarcasterBadge() {
  const { isFarcaster, user } = useFarcaster()

  if (!isFarcaster) return null

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1.5 backdrop-blur-sm">
      <Users className="w-4 h-4 text-purple-400" />
      <span className="text-xs font-medium text-purple-300">
        {user?.displayName || user?.username || "Farcaster User"}
      </span>
    </div>
  )
}
