"use client"

import type React from "react"
import { useAudioPlayer } from "@/lib/audio-player-context"

import { TrackCard } from "@/components/track-card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FriendActivitySidebar } from "@/components/friend-activity-sidebar"
import { ChevronRight, ChevronLeft, Music, Zap, Heart, TrendingUp, Sparkles, AlertCircle } from "lucide-react"
import type { TrackWithArtist } from "@/types/database"
import { useEffect, useState, useRef } from "react"
import { SkeletonCard } from "@/components/skeleton-loader"
import Link from "next/link"
import { WallpaperCarousel } from "@/components/wallpaper-carousel"

type TrackWithStats = TrackWithArtist & {
  total_earned?: number
  play_count?: number
  like_count?: number
}

interface Category {
  id: string
  name: string
  icon: React.ReactNode
  gradient: string
  description: string
  href: string
}

export default function DiscoverPage() {
  const [featuredTracks, setFeaturedTracks] = useState<TrackWithStats[]>([])
  const [newReleases, setNewReleases] = useState<TrackWithStats[]>([])
  const [trending, setTrending] = useState<TrackWithStats[]>([])
  const [forYou, setForYou] = useState<TrackWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { playTrack } = useAudioPlayer() // Use the imported hook
  const [carouselApi, setCarouselApi] = useState<any>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [parallax, setParallax] = useState({ x: 0, y: 0 })

  const categories: Category[] = [
    {
      id: "new",
      name: "New Releases",
      icon: <Sparkles className="h-6 w-6" />,
      gradient: "from-purple-500 to-pink-500",
      description: "Fresh tracks just dropped",
      href: "/explore?sort=newest",
    },
    {
      id: "trending",
      name: "Trending Now",
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: "from-orange-500 to-red-500",
      description: "What everyone's listening to",
      href: "/trending",
    },
    {
      id: "top",
      name: "Top Charts",
      icon: <Zap className="h-6 w-6" />,
      gradient: "from-yellow-500 to-orange-500",
      description: "Most played tracks",
      href: "/explore?sort=popular",
    },
    {
      id: "liked",
      name: "Most Loved",
      icon: <Heart className="h-6 w-6" />,
      gradient: "from-red-500 to-pink-500",
      description: "Fan favorites",
      href: "/explore?sort=liked",
    },
  ]

  useEffect(() => {
    loadAllContent()
  }, [])

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    }

    carouselApi.on("select", onSelect)
    onSelect()

    return () => {
      carouselApi.off("select", onSelect)
    }
  }, [carouselApi])

  async function loadAllContent() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createBrowserClient()

      const { data: featuredData, error: featuredError } = await supabase
        .from("tracks")
        .select(`
          *,
          artist:profiles!tracks_artist_id_fkey(*)
        `)
        .eq("is_featured", true)
        .eq("is_active", true)
        .or("is_hidden.is.null,is_hidden.eq.false")
        .order("created_at", { ascending: false })
        .limit(5)

      if (featuredError) {
        console.error("[v0] Error loading featured tracks:", featuredError)
      }

      const { data: tracksData, error: tracksError } = await supabase
        .from("tracks")
        .select(`
          *,
          artist:profiles!tracks_artist_id_fkey(*)
        `)
        .eq("is_active", true)
        .or("is_hidden.is.null,is_hidden.eq.false")
        .order("created_at", { ascending: false })
        .limit(50)

      if (tracksError) {
        throw new Error("Failed to load tracks")
      }

      if (!tracksData || tracksData.length === 0) {
        setLoading(false)
        return
      }

      const trackIds = tracksData.map((t) => t.id)

      const { data: streams } = await supabase
        .from("streams")
        .select("track_id, chunks_played, total_paid")
        .in("track_id", trackIds)

      const { data: likes } = await supabase.from("likes").select("track_id").in("track_id", trackIds)

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

      const tracksWithStats: TrackWithStats[] = tracksData.map((track) => ({
        ...track,
        ...statsMap.get(track.id),
      }))

      if (featuredData && featuredData.length > 0) {
        const featuredWithStats: TrackWithStats[] = featuredData.map((track) => ({
          ...track,
          ...statsMap.get(track.id),
        }))
        setFeaturedTracks(featuredWithStats)
      } else {
        const topTracks = [...tracksWithStats].sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        setFeaturedTracks(topTracks.slice(0, 1))
      }

      setNewReleases(tracksWithStats.slice(0, 12))

      const trendingTracks = [...tracksWithStats].sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
      setTrending(trendingTracks.slice(0, 12))

      const shuffled = [...tracksWithStats].sort(() => Math.random() - 0.5)
      setForYou(shuffled.slice(0, 12))
    } catch (error) {
      console.error("Failed to load content:", error)
      setError("Failed to load content. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const newReleasesRef = useRef<HTMLDivElement>(null)
  const trendingRef = useRef<HTMLDivElement>(null)
  const forYouRef = useRef<HTMLDivElement>(null)

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -400 : 400
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  const [sectionsVisible, setSectionsVisible] = useState({
    categories: true,
    newReleases: true,
    trending: false,
    forYou: false,
  })

  const categoriesRef = useRef<HTMLDivElement>(null)
  const newReleasesSectionRef = useRef<HTMLDivElement>(null)
  const trendingSectionRef = useRef<HTMLDivElement>(null)
  const forYouSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section")
            if (id) {
              setSectionsVisible((prev) => ({ ...prev, [id]: true }))
            }
          }
        })
      },
      { threshold: 0.1 },
    )

    const refs = [
      { ref: categoriesRef, id: "categories" },
      { ref: newReleasesSectionRef, id: "newReleases" },
      { ref: trendingSectionRef, id: "trending" },
      { ref: forYouSectionRef, id: "forYou" },
    ]

    refs.forEach(({ ref }) => {
      if (ref.current) observer.observe(ref.current)
    })

    return () => observer.disconnect()
  }, [loading])

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Music className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-2xl font-bold mb-2">No tracks yet</h3>
      <p className="text-foreground/70 mb-6">Be the first to upload a track!</p>
      <Link href="/dashboard">
        <Button size="lg" className="rounded-full">
          Upload Track
        </Button>
      </Link>
    </div>
  )

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mb-4" />
      <h3 className="text-2xl font-bold mb-2">Something went wrong</h3>
      <p className="text-foreground/70 mb-6">{error}</p>
      <Button size="lg" className="rounded-full" onClick={loadAllContent}>
        Try Again
      </Button>
    </div>
  )

  const handleParallaxMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    let clientX: number
    let clientY: number

    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left) / rect.width - 0.5
    const y = (clientY - rect.top) / rect.height - 0.5

    setParallax({ x: x * 20, y: y * 20 })
  }

  const handleParallaxLeave = () => {
    setParallax({ x: 0, y: 0 })
  }

  return (
    <div className="min-h-screen bg-black pb-24 md:pb-32">
      {!loading && !error && featuredTracks.length > 0 && <WallpaperCarousel tracks={featuredTracks} />}

      <div className="flex gap-6 container px-4 md:px-6">
        <main className="flex-1 py-6 md:py-8 space-y-8 md:space-y-12 min-w-0">
          {!loading && !error && <section className="animate-fade-in">{/* <StoriesCarousel /> */}</section>}

          {error && <ErrorState />}

          {!loading && !error && newReleases.length === 0 && <EmptyState />}

          {!loading && !error && newReleases.length > 0 && (
            <section ref={categoriesRef} data-section="categories" className="space-y-4 md:space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl md:text-3xl font-bold">Browse All</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {categories.map((category, index) => (
                  <Link key={category.id} href={category.href}>
                    <Card
                      className={`relative overflow-hidden bg-gradient-to-br ${category.gradient} border-0 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 active:scale-95`}
                      style={{
                        animation: `fade-in 0.5s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <div className="p-4 md:p-6 h-32 md:h-40 flex flex-col justify-between">
                        <div className="space-y-1 md:space-y-2">
                          <div className="text-white transform group-hover:scale-110 transition-transform">
                            {category.icon}
                          </div>
                          <h3 className="text-base md:text-xl font-bold text-white">{category.name}</h3>
                          <p className="text-xs md:text-sm text-white/80 line-clamp-2">{category.description}</p>
                        </div>
                      </div>
                      <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                        <Music className="h-24 w-24 md:h-32 md:w-32 text-white" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {!loading && !error && newReleases.length > 0 && (
            <section
              ref={newReleasesSectionRef}
              data-section="newReleases"
              className="space-y-4 md:space-y-6 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">New Releases</h2>
                  <p className="text-sm md:text-base text-foreground/70 mt-1">Fresh tracks just dropped</p>
                </div>
                <Link href="/explore?sort=newest">
                  <Button variant="ghost" className="gap-2 hover:text-primary text-sm md:text-base">
                    See all
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                  onClick={() => scroll(newReleasesRef, "left")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div
                  ref={newReleasesRef}
                  className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                >
                  {newReleases.map((track) => (
                    <div key={track.id} className="flex-none w-[140px] sm:w-[160px] md:w-[200px]">
                      <TrackCard track={track} queue={newReleases} />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                  onClick={() => scroll(newReleasesRef, "right")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </section>
          )}

          {!loading && !error && trending.length > 0 && (
            <section
              ref={trendingSectionRef}
              data-section="trending"
              className={`space-y-4 md:space-y-6 transition-all duration-700 ${
                sectionsVisible.trending ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
                  <p className="text-sm md:text-base text-foreground/70 mt-1">What everyone's listening to</p>
                </div>
                <Link href="/trending">
                  <Button variant="ghost" className="gap-2 hover:text-primary text-sm md:text-base">
                    See all
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                  onClick={() => scroll(trendingRef, "left")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div
                  ref={trendingRef}
                  className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                >
                  {trending.map((track) => (
                    <div key={track.id} className="flex-none w-[140px] sm:w-[160px] md:w-[200px]">
                      <TrackCard track={track} queue={trending} />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                  onClick={() => scroll(trendingRef, "right")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </section>
          )}

          {!loading && !error && forYou.length > 0 && (
            <section
              ref={forYouSectionRef}
              data-section="forYou"
              className={`space-y-4 md:space-y-6 transition-all duration-700 ${
                sectionsVisible.forYou ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">Made For You</h2>
                  <p className="text-sm md:text-base text-foreground/70 mt-1">Personalized picks just for you</p>
                </div>
              </div>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                  onClick={() => scroll(forYouRef, "left")}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <div
                  ref={forYouRef}
                  className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-4 px-4 md:mx-0 md:px-0"
                >
                  {forYou.map((track) => (
                    <div key={track.id} className="flex-none w-[140px] sm:w-[160px] md:w-[200px]">
                      <TrackCard track={track} queue={forYou} />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                  onClick={() => scroll(forYouRef, "right")}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </div>
            </section>
          )}

          {loading && (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-40 bg-card/50 rounded-xl animate-pulse" />
                ))}
              </div>
              {[1, 2, 3].map((section) => (
                <div key={section} className="space-y-4">
                  <div className="h-8 w-48 bg-card/50 rounded animate-pulse" />
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex-none w-[180px]">
                        <SkeletonCard />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        <aside className="hidden xl:block w-80 flex-shrink-0 py-12 sticky top-20 self-start">
          <FriendActivitySidebar />
        </aside>
      </div>
    </div>
  )
}
