"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFriendPresence } from "@/lib/hooks/use-friend-presence"
import { Music, Radio, Circle } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export function FriendActivitySidebar() {
  const { friendsPresence } = useFriendPresence()
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "listening":
        return <Music className="h-3 w-3 text-green-500" />
      case "streaming":
        return <Radio className="h-3 w-3 text-red-500 animate-pulse" />
      case "online":
        return <Circle className="h-3 w-3 text-blue-500 fill-blue-500" />
      default:
        return null
    }
  }

  const getStatusText = (presence: any) => {
    if (presence.status === "listening" && presence.track_title) {
      return (
        <span className="text-xs text-muted-foreground line-clamp-1">
          Listening to <span className="text-green-500 font-medium">{presence.track_title}</span>
        </span>
      )
    }
    if (presence.status === "streaming") {
      return <span className="text-xs text-red-500 font-medium animate-pulse">Live streaming now</span>
    }
    return <span className="text-xs text-muted-foreground">Online</span>
  }

  const handleClick = (presence: any) => {
    if (presence.status === "listening" && presence.current_track_id) {
      router.push(`/track/${presence.current_track_id}`)
    } else if (presence.status === "streaming" && presence.current_stream_id) {
      router.push(`/live/${presence.current_stream_id}`)
    } else {
      router.push(`/artist/${presence.user_address}`)
    }
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Circle className="h-4 w-4 text-green-500 fill-green-500 animate-pulse" />
          Friend Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {friendsPresence.length === 0 ? (
          <Empty className="border-0 py-4">
            <EmptyHeader>
              <EmptyMedia>
                <Circle className="h-8 w-8 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm">No friends online</EmptyTitle>
              <EmptyDescription className="text-xs">Follow artists to see their activity here</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/artists" className="text-xs text-primary hover:underline">
                Discover artists
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {friendsPresence.map((presence) => (
                <div
                  key={presence.user_address}
                  onClick={() => handleClick(presence)}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer group"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border border-border/50">
                      <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${presence.user_address}`} />
                      <AvatarFallback>{presence.artist_name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                      {getStatusIcon(presence.status)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {presence.artist_name ||
                        `${presence.user_address.slice(0, 6)}...${presence.user_address.slice(-4)}`}
                    </p>
                    {getStatusText(presence)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
