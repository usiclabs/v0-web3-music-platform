"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { ArtistsFilter, type SortOption } from "@/components/artists-filter"
import { ArtistsFeed } from "@/components/artists-feed"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, X } from "lucide-react"

type Artist = {
  wallet_address: string
  artist_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  totalEarned: number
  trackCount: number
  followerCount: number
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [minEarnings, setMinEarnings] = useState(0)
  const [minTracks, setMinTracks] = useState(0)

  useEffect(() => {
    async function loadArtists() {
      const supabase = createBrowserClient()

      const { data: artistsData } = await supabase.from("profiles").select("*").not("artist_name", "is", null)

      if (!artistsData) {
        setLoading(false)
        return
      }

      const artistsWithData = await Promise.all(
        artistsData.map(async (artist) => {
          const { count: trackCount } = await supabase
            .from("tracks")
            .select("*", { count: "exact", head: true })
            .eq("artist_id", artist.wallet_address.toLowerCase())

          const { data: earnings } = await supabase
            .from("streams")
            .select("total_paid, tracks!inner(artist_id)")
            .eq("tracks.artist_id", artist.wallet_address.toLowerCase())

          const totalEarned = earnings?.reduce((sum, stream) => sum + (stream.total_paid || 0), 0) || 0

          const { count: followerCount } = await supabase
            .from("follows")
            .select("*", { count: "exact", head: true })
            .eq("following_address", artist.wallet_address)

          return {
            ...artist,
            totalEarned,
            trackCount: trackCount || 0,
            followerCount: followerCount || 0,
          }
        }),
      )

      setArtists(artistsWithData)
      setLoading(false)
    }

    loadArtists()
  }, [])

  useEffect(() => {
    let result = [...artists]

    result = result.filter((artist) => artist.trackCount > 0)

    if (searchQuery) {
      result = result.filter((artist) => artist.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    if (minEarnings > 0) {
      result = result.filter((artist) => artist.totalEarned >= minEarnings)
    }

    if (minTracks > 0) {
      result = result.filter((artist) => artist.trackCount >= minTracks)
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "earnings-high":
          return b.totalEarned - a.totalEarned
        case "earnings-low":
          return a.totalEarned - b.totalEarned
        case "tracks-high":
          return b.trackCount - a.trackCount
        case "tracks-low":
          return a.trackCount - b.trackCount
        case "name-asc":
          return (a.artist_name || "").localeCompare(b.artist_name || "")
        case "name-desc":
          return (b.artist_name || "").localeCompare(a.artist_name || "")
        case "followers-high":
          return b.followerCount - a.followerCount
        case "followers-low":
          return a.followerCount - b.followerCount
        default:
          return 0
      }
    })

    setFilteredArtists(result)
  }, [artists, searchQuery, sortBy, minEarnings, minTracks])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative inline-block">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-primary opacity-20" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold">Loading artists...</p>
            <p className="text-sm text-muted-foreground">Discovering amazing talent</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed top-24 right-6 z-50 h-10 w-10 rounded-full bg-primary/90 hover:bg-primary hover:scale-110 active:scale-95 backdrop-blur-xl shadow-2xl shadow-primary/50 transition-all duration-300 md:hidden"
        aria-label={showFilters ? "Close filters" : "Open filters"}
      >
        {showFilters ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
      </Button>

      {showFilters && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden animate-fade-in">
          <div className="absolute top-0 right-0 w-full max-w-md h-full bg-background border-l border-border overflow-y-auto p-6 animate-slide-in-right">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Filters</h2>
              <p className="text-muted-foreground">Refine your artist search</p>
            </div>
            <ArtistsFilter
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              minEarnings={minEarnings}
              onMinEarningsChange={setMinEarnings}
              minTracks={minTracks}
              onMinTracksChange={setMinTracks}
              totalResults={filteredArtists.length}
            />
          </div>
        </div>
      )}

      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-80 bg-background/95 backdrop-blur-xl border-r border-border overflow-y-auto p-6 z-30">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            Filters
          </h2>
          <p className="text-muted-foreground">Refine your artist search</p>
        </div>
        <ArtistsFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          minEarnings={minEarnings}
          onMinEarningsChange={setMinEarnings}
          minTracks={minTracks}
          onMinTracksChange={setMinTracks}
          totalResults={filteredArtists.length}
        />
      </div>

      <div className="md:ml-80">
        <ArtistsFeed artists={filteredArtists} />
      </div>
    </div>
  )
}
