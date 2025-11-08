"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { createBrowserClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

interface Story {
  id: string
  media_url: string
  media_type: string
  thumbnail_url: string
  caption: string
  is_token_gated: boolean
  required_token_amount: number
  view_count: number
  created_at: string
  expires_at: string
}

export default function StoriesPage() {
  const { address } = useAccount()
  const [myStories, setMyStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (address) {
      loadMyStories()
    }
  }, [address])

  async function loadMyStories() {
    if (!address) return

    try {
      setLoading(true)
      const response = await fetch(`/api/stories?artistAddress=${address}`)
      const data = await response.json()

      if (data.artists && data.artists.length > 0) {
        setMyStories(data.artists[0].stories || [])
      }
    } catch (error) {
      console.error("[Stories Page] Error loading stories:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteStory(storyId: string) {
    if (!confirm("Delete this story?")) return

    try {
      const supabase = createBrowserClient()
      await supabase.from("stories").delete().eq("id", storyId)
      loadMyStories()
    } catch (error) {
      console.error("[Stories Page] Error deleting story:", error)
    }
  }

  const timeRemaining = (expiresAt: string) => {
    const ms = new Date(expiresAt).getTime() - new Date().getTime()
    const hours = Math.floor(ms / 3600000)
    return `${hours}h left`
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 pb-24">
      <Card className="p-12 text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-4">Stories Coming Soon</h2>
        <p className="text-muted-foreground mb-2">We're working on bringing Instagram-style stories to MyUSIC.</p>
        <p className="text-sm text-muted-foreground">
          Share moments with your fans that disappear after 24 hours, with exclusive token-gated content.
        </p>
      </Card>
    </div>
  )
  // </CHANGE>

  /* Commented out original content
  if (!address) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-muted-foreground mb-6">Connect your wallet to view and create stories</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="container px-4 md:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Stories</h1>
          <p className="text-muted-foreground">Share moments with your fans that disappear after 24 hours</p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">Recent Stories</h2>
          <StoriesCarousel />
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Your Stories ({myStories.length})</h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[9/16] bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : myStories.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">You haven't posted any stories yet</p>
              <p className="text-sm text-muted-foreground">
                Stories disappear after 24 hours. Share moments with your fans!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {myStories.map((story) => (
                <Card key={story.id} className="relative group overflow-hidden">
                  <div className="aspect-[9/16] relative">
                    {story.media_type === "video" ? (
                      <video src={story.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img
                        src={story.media_url || "/placeholder.svg"}
                        alt="Story"
                        className="w-full h-full object-cover"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between">
                      <div className="flex gap-1">
                        {story.is_token_gated && (
                          <div className="px-2 py-1 rounded-full bg-amber-500/20 backdrop-blur-xl border border-amber-500/30 flex items-center gap-1">
                            <Lock className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-500">{story.required_token_amount}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Eye className="h-3 w-3" />
                          <span>{story.view_count} views</span>
                        </div>
                        <div className="flex items-center gap-2 text-white text-xs">
                          <Clock className="h-3 w-3" />
                          <span>{timeRemaining(story.expires_at)}</span>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full h-8"
                          onClick={() => deleteStory(story.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
  </CHANGE> */
}
