import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import Link from "next/link"

interface FollowingListProps {
  following: any[]
}

export function FollowingList({ following }: FollowingListProps) {
  if (following.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Not following anyone</h3>
        <p className="text-muted-foreground">This user isn't following any artists yet</p>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Following</h2>
        <p className="text-muted-foreground">
          {following.length} {following.length === 1 ? "artist" : "artists"}
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {following.map((follow: any) => (
          <Link key={follow.following_address} href={`/artist/${follow.following_address}`}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4 hover:scale-[1.02] transition-all hover:shadow-2xl hover:shadow-primary/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-primary/30">
                  <AvatarImage src={follow.following?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {follow.following?.artist_name?.[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{follow.following?.artist_name || "Anonymous Artist"}</h3>
                  <p className="text-sm text-muted-foreground truncate">{formatAddress(follow.following_address)}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
