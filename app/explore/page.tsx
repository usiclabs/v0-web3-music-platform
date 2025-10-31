"use client"

import { TrackCard } from "@/components/track-card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, DollarSign, Clock, Heart, Sparkles, X } from "lucide-react"
import type { TrackWithArtist } from "@/types/database"
import { useEffect, useState, useRef } from "react"
import { SkeletonCard } from "@/components/skeleton-loader"

type SortOption = "newest" | "most_played" | "most_sales" | "most_liked"

type TrackWithStats = TrackWithArtist & {
  total_earned?: number
  play_count?: number
  like_count?: number
}

export default function ExplorePage() {
  const [tracks, setTracks] = useState<TrackWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [searchQuery, setSearchQuery] = useState("")

  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set())
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"))
          if (entry.isIntersecting) {
            setVisibleCards((prev) => new Set(prev).add(index))
          }
        })
      },
      { threshold: 0.1, rootMargin: "50px" },
    )

    return () => observerRef.current?.disconnect()
  }, [])

  useEffect(() => {
    loadTracks()
  }, [sortBy])

  async function loadTracks() {
    setLoading(true)
    try {
      const supabase = createBrowserClient()

      // Fetch tracks with artist information
      let query = supabase
        .from("tracks")
        .select(`
          *,
          artist:profiles!tracks_artist_id_fkey(*)
        `)
        .eq("is_active", true)
        .or("is_hidden.is.null,is_hidden.eq.false")

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false })
      }

      const { data: tracksData } = await query.limit(100)

      if (!tracksData) {
        setTracks([])
        setLoading(false)
        return
      }

      // Fetch aggregated stats for each track
      const trackIds = tracksData.map((t) => t.id)

      // Get play counts and earnings from streams
      const { data: streams } = await supabase
        .from("streams")
        .select("track_id, chunks_played, total_paid")
        .in("track_id", trackIds)

      // Get like counts
      const { data: likes } = await supabase.from("likes").select("track_id").in("track_id", trackIds)

      // Aggregate stats
      const statsMap = new Map<string, { total_earned: number; play_count: number; like_count: number }>()

      trackIds.forEach((id) => {
        statsMap.set(id, { total_earned: 0, play_count: 0, like_count: 0 })
      })

      streams?.forEach((stream) => {
        const stats = statsMap.get(stream.track_id)!
        stats.total_earned += Number(stream.total_paid)
        stats.play_count += stream.chunks_played
      })

      likes?.forEach((like) => {
        const stats = statsMap.get(like.track_id)!
        stats.like_count += 1
      })

      // Merge stats with tracks
      const tracksWithStats: TrackWithStats[] = tracksData.map((track) => ({
        ...track,
        ...statsMap.get(track.id),
      }))

      // Apply client-side sorting for aggregated fields
      if (sortBy === "most_played") {
        tracksWithStats.sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      } else if (sortBy === "most_sales") {
        tracksWithStats.sort((a, b) => (b.total_earned || 0) - (a.total_earned || 0))
      } else if (sortBy === "most_liked") {
        tracksWithStats.sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      }

      setTracks(tracksWithStats)
    } catch (error) {
      console.error("Failed to load tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTracks = tracks.filter(
    (track) =>
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-black pb-32">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      <main className="container relative z-10 py-12 px-4 sm:px-6">
        <div className="mb-12 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent animate-gradient">
              Explore Music
            </h1>
          </div>
          <p className="text-muted-foreground text-lg mb-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            Discover tracks from artists around the world
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="relative flex-1 max-w-xl group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search tracks, artists..."
                className="pl-10 bg-card/50 backdrop-blur-xl border border-border/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <Button
              variant={sortBy === "newest" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("newest")}
              className="gap-2 hover:scale-105 transition-all"
            >
              <Clock className="h-4 w-4" />
              Newest
            </Button>
            <Button
              variant={sortBy === "most_played" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("most_played")}
              className="gap-2 hover:scale-105 transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              Most Played
            </Button>
            <Button
              variant={sortBy === "most_sales" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("most_sales")}
              className="gap-2 hover:scale-105 transition-all"
            >
              <DollarSign className="h-4 w-4" />
              Most Sales
            </Button>
            <Button
              variant={sortBy === "most_liked" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("most_liked")}
              className="gap-2 hover:scale-105 transition-all"
            >
              <Heart className="h-4 w-4" />
              Most Liked
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredTracks && filteredTracks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredTracks.map((track, index) => (
              <div
                key={track.id}
                data-index={index}
                ref={(el) => {
                  if (el && observerRef.current) {
                    observerRef.current.observe(el)
                  }
                }}
                className={`transition-all duration-500 ${
                  visibleCards.has(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${(index % 12) * 50}ms` }}
              >
                <TrackCard track={track} queue={filteredTracks} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-12 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6 animate-pulse">
              <Search className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{searchQuery ? "No tracks found" : "No tracks available yet"}</h3>
            <p className="text-muted-foreground text-lg mb-6">
              {searchQuery ? "Try adjusting your search or filters" : "Be the first to upload music to the platform!"}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery("")} variant="outline" className="hover:scale-105 transition-all">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
