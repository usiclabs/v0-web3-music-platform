"use client"

import { Badge } from "@/components/ui/badge"
import { useFriendPresence } from "@/lib/hooks/use-friend-presence"
import { Circle } from "lucide-react"

interface FriendActivityBadgeProps {
  userAddress: string
}

export function FriendActivityBadge({ userAddress }: FriendActivityBadgeProps) {
  const { onlineFriends } = useFriendPresence()

  if (!onlineFriends.includes(userAddress.toLowerCase())) {
    return null
  }

  return (
    <Badge variant="outline" className="gap-1 bg-green-500/10 border-green-500/30 text-green-500">
      <Circle className="h-2 w-2 fill-green-500 animate-pulse" />
      <span className="text-xs">Online</span>
    </Badge>
  )
}
