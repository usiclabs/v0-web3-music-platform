"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { Plus, Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StoriesViewer } from "@/components/stories-viewer"
import { CreateStoryModal } from "@/components/create-story-modal"

interface Story {
  id: string
  artist_address: string
  media_url: string
  media_type: string
  thumbnail_url: string
  duration: number
  caption: string
  link_url: string
  link_text: string
  is_token_gated: boolean
  required_token_address: string
  required_token_amount: number
  view_count: number
  created_at: string
}

interface ArtistWithStories {
  artist: {
    wallet_address: string
    artist_name: string
    avatar_url: string
    profile_token_address: string
  }
  stories: Story[]
  hasUnviewed: boolean
}

export function StoriesCarousel() {
  const { address } = useAccount()
  const [artists, setArtists] = useState<ArtistWithStories[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithStories | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadStories()
  }, [address])

  async function loadStories() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (address) params.set("viewerAddress", address)

      const response = await fetch(`/api/stories?${params}`)
      const data = await response.json()

      setArtists(data.artists || [])
    } catch (error) {
      console.error("[Stories Carousel] Error loading stories:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 md:px-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 animate-pulse" />
            <div className="h-3 w-12 bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  if (artists.length === 0 && !address) {
    return null
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-4 md:px-0 -mx-4 md:mx-0 pl-4">
        {/* Add Story Button */}
        {address && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-full bg-gradient-to-tr from-gray-800 to-gray-700 flex items-center justify-center border-2 border-dashed border-gray-600 group-hover:border-primary transition-colors">
              <Plus className="h-6 w-6 md:h-8 md:w-8 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-xs text-foreground/70 max-w-[64px] md:max-w-[80px] truncate">Your Story</span>
          </button>
        )}

        {/* Artist Stories */}
        {artists.map((artist) => (
          <button
            key={artist.artist.wallet_address}
            onClick={() => setSelectedArtist(artist)}
            className="flex flex-col items-center gap-2 flex-shrink-0 group"
          >
            <div
              className={`relative p-[2px] rounded-full ${
                artist.hasUnviewed
                  ? "bg-gradient-to-tr from-pink-500 via-purple-500 to-orange-500"
                  : "bg-gradient-to-tr from-gray-700 to-gray-600"
              }`}
            >
              <div className="bg-black rounded-full p-[2px]">
                <Avatar className="h-14 w-14 md:h-[72px] md:w-[72px]">
                  <AvatarImage src={artist.artist.avatar_url || "/placeholder.svg"} alt={artist.artist.artist_name} />
                  <AvatarFallback>{artist.artist.artist_name?.[0] || "?"}</AvatarFallback>
                </Avatar>
              </div>
              {artist.stories.some((s) => s.is_token_gated) && (
                <div className="absolute -bottom-1 -right-1 h-5 w-5 md:h-6 md:w-6 rounded-full bg-amber-500 flex items-center justify-center border-2 border-black">
                  <Lock className="h-2.5 w-2.5 md:h-3 md:w-3 text-black" />
                </div>
              )}
            </div>
            <span className="text-xs text-foreground/70 max-w-[64px] md:max-w-[80px] truncate">
              {artist.artist.artist_name || `${artist.artist.wallet_address.slice(0, 6)}...`}
            </span>
          </button>
        ))}
      </div>

      {selectedArtist && (
        <StoriesViewer
          artist={selectedArtist}
          allArtists={artists}
          onClose={() => setSelectedArtist(null)}
          onStoryChange={loadStories}
        />
      )}

      {showCreateModal && <CreateStoryModal onClose={() => setShowCreateModal(false)} onSuccess={loadStories} />}
    </>
  )
}
