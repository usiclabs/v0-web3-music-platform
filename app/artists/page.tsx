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
  totalStreams: number
  profile_token_address?: string | null
  marketCap?: number
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("marketcap-high")
  const [minEarnings, setMinEarnings] = useState(0)
  const [minTracks, setMinTracks] = useState(0)

  useEffect(() => {
    async function loadArtists() {
      const supabase = createBrowserClient()

      console.log("[v0] Starting artist data load...")

      const { data: artistsData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .not("artist_name", "is", null)

      if (profilesError) {
        console.error("[v0] Error loading profiles:", profilesError)
        setLoading(false)
        return
      }

      if (!artistsData || artistsData.length === 0) {
        console.log("[v0] No artists found")
        setLoading(false)
        return
      }

      console.log(`[v0] Loaded ${artistsData.length} artist profiles`)

      const artistAddresses = artistsData.map((a) => a.wallet_address.toLowerCase())

      const { data: tracksData } = await supabase.from("tracks").select("artist_id").in("artist_id", artistAddresses)

      const trackCounts = new Map<string, number>()
      tracksData?.forEach((track) => {
        const addr = track.artist_id.toLowerCase()
        trackCounts.set(addr, (trackCounts.get(addr) || 0) + 1)
      })
      console.log("[v0] Loaded track counts")

      const { data: earningsData } = await supabase
        .from("streams")
        .select("total_paid, tracks!inner(artist_id)")
        .in("tracks.artist_id", artistAddresses)

      const earningsMap = new Map<string, number>()
      earningsData?.forEach((stream) => {
        const addr = stream.tracks?.artist_id?.toLowerCase()
        if (addr) {
          earningsMap.set(addr, (earningsMap.get(addr) || 0) + (stream.total_paid || 0))
        }
      })
      console.log("[v0] Loaded earnings data")

      const { data: streamsData } = await supabase
        .from("streams")
        .select("tracks!inner(artist_id)")
        .in("tracks.artist_id", artistAddresses)

      const streamCounts = new Map<string, number>()
      streamsData?.forEach((stream) => {
        const addr = stream.tracks?.artist_id?.toLowerCase()
        if (addr) {
          streamCounts.set(addr, (streamCounts.get(addr) || 0) + 1)
        }
      })
      console.log("[v0] Loaded stream counts")

      const { data: followsData } = await supabase
        .from("follows")
        .select("following_address")
        .in(
          "following_address",
          artistsData.map((a) => a.wallet_address),
        )

      const followerCounts = new Map<string, number>()
      followsData?.forEach((follow) => {
        const addr = follow.following_address.toLowerCase()
        followerCounts.set(addr, (followerCounts.get(addr) || 0) + 1)
      })
      console.log("[v0] Loaded follower counts")

      const artistsWithData: Artist[] = artistsData.map((artist) => {
        const addr = artist.wallet_address.toLowerCase()
        return {
          ...artist,
          totalEarned: earningsMap.get(addr) || 0,
          trackCount: trackCounts.get(addr) || 0,
          followerCount: followerCounts.get(addr) || 0,
          totalStreams: streamCounts.get(addr) || 0,
          marketCap: 0, // Will fetch below for artists with tokens
        }
      })

      const artistsWithTokens = artistsWithData.filter((a) => a.profile_token_address)
      console.log(`[v0] Fetching market caps for ${artistsWithTokens.length} artists with tokens...`)

      await Promise.all(
        artistsWithTokens.map(async (artist) => {
          try {
            const res = await fetch(`/api/token/metrics/${artist.profile_token_address}`)
            if (res.ok) {
              const metrics = await res.json()
              artist.marketCap = metrics.marketCap || 0
            }
          } catch (error) {
            console.error(`[v0] Failed to fetch market cap for ${artist.wallet_address}:`, error)
          }
        }),
      )

      console.log("[v0] Artist data load complete")
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
        case "streams-high":
          return b.totalStreams - a.totalStreams
        case "streams-low":
          return a.totalStreams - b.totalStreams
        case "marketcap-high":
          if (a.profile_token_address && !b.profile_token_address) return -1
          if (!a.profile_token_address && b.profile_token_address) return 1
          return (b.marketCap || 0) - (a.marketCap || 0)
        case "marketcap-low":
          if (a.profile_token_address && !b.profile_token_address) return -1
          if (!a.profile_token_address && b.profile_token_address) return 1
          return (a.marketCap || 0) - (b.marketCap || 0)
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
    <div className="min-h-screen bg-background">
      <Button
        onClick={() => setShowFilters(!showFilters)}
        className="fixed top-20 right-4 z-50 h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 hover:from-primary/30 hover:to-accent/30 hover:scale-110 active:scale-95 backdrop-blur-xl border border-primary/20 shadow-2xl transition-all duration-300 md:hidden"
        aria-label={showFilters ? "Close filters" : "Open filters"}
      >
        {showFilters ? <X className="h-5 w-5 text-white" /> : <SlidersHorizontal className="h-5 w-5 text-white" />}
      </Button>

      {showFilters && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute top-0 right-0 w-full max-w-sm h-full bg-gradient-to-b from-background via-background/98 to-background/95 border-l border-border shadow-2xl overflow-y-auto p-6 animate-slide-in-right">
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

      <div className="hidden md:block fixed left-0 top-16 bottom-0 w-96 bg-gradient-to-b from-background via-background/98 to-background/95 backdrop-blur-xl border-r border-border/50 overflow-y-auto p-8 z-30 shadow-xl">
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

      <div className="md:ml-96">
        <ArtistsFeed artists={filteredArtists} />
      </div>
    </div>
  )
}
