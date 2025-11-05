"use client"

import type React from "react"

import { TrackCard } from "@/components/track-card"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Play, ChevronRight, ChevronLeft, Music, Zap, Heart, TrendingUp, Sparkles, AlertCircle } from "lucide-react"
import type { TrackWithArtist } from "@/types/database"
import { useEffect, useState, useRef } from "react"
import { SkeletonCard } from "@/components/skeleton-loader"
import Link from "next/link"
import Image from "next/image"
import { useAudioPlayer } from "@/lib/audio-player-context"

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
  const { playTrack } = useAudioPlayer()
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
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
    <div className="min-h-screen bg-black pb-32">
      {!loading && !error && featuredTracks.length > 0 && (
        <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
          <Carousel
            setApi={setCarouselApi}
            opts={{
              loop: true,
              duration: 30,
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: true,
              }),
            ]}
            className="h-full"
          >
            <CarouselContent className="h-full ml-0">
              {featuredTracks.map((track) => (
                <CarouselItem key={track.id} className="pl-0 h-full">
                  <div
                    className="relative h-full"
                    onMouseMove={handleParallaxMove}
                    onMouseLeave={handleParallaxLeave}
                    onTouchMove={handleParallaxMove}
                    onTouchEnd={handleParallaxLeave}
                    style={{
                      perspective: "1000px",
                    }}
                  >
                    <div
                      className="absolute inset-0 transition-transform duration-300 ease-out"
                      style={{
                        transform: `translate(${parallax.x * 0.3}px, ${parallax.y * 0.3}px) scale(1.1)`,
                      }}
                    >
                      <Image
                        src={track.cover_url || "/placeholder.svg?height=800&width=1600&query=music hero"}
                        alt={track.title}
                        fill
                        className="object-cover"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent" />
                    </div>

                    <div
                      className="relative container h-full flex items-end pb-12 px-4 sm:px-6 transition-transform duration-300 ease-out"
                      style={{
                        transform: `translate(${parallax.x * 0.8}px, ${parallax.y * 0.8}px) rotateX(${-parallax.y * 0.3}deg) rotateY(${parallax.x * 0.3}deg)`,
                        transformStyle: "preserve-3d",
                      }}
                    >
                      <div className="max-w-2xl space-y-6 animate-fade-in">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-semibold text-primary">Featured Track</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-bold text-white text-balance leading-tight">
                          {track.title}
                        </h1>
                        <Link href={`/artist/${track.artist_id}`}>
                          <p className="text-xl md:text-2xl text-white/90 hover:text-primary transition-colors">
                            {track.artist?.artist_name ||
                              `${track.artist_id.slice(0, 6)}...${track.artist_id.slice(-4)}`}
                          </p>
                        </Link>
                        <div className="flex items-center gap-4 text-white/70">
                          {track.play_count && track.play_count > 0 && (
                            <span className="flex items-center gap-2">
                              <Play className="h-4 w-4" />
                              {track.play_count} plays
                            </span>
                          )}
                          {track.like_count && track.like_count > 0 && (
                            <span className="flex items-center gap-2">
                              <Heart className="h-4 w-4" />
                              {track.like_count} likes
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            size="lg"
                            className="rounded-full px-8 h-14 text-lg font-semibold shadow-2xl shadow-primary/50 hover:scale-105 transition-transform"
                            onClick={() => playTrack(track, featuredTracks)}
                          >
                            <Play className="h-5 w-5 mr-2 fill-current" />
                            Play Now
                          </Button>
                          <Link href={`/track/${track.id}`}>
                            <Button
                              size="lg"
                              variant="outline"
                              className="rounded-full px-8 h-14 text-lg font-semibold bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20"
                            >
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {featuredTracks.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {featuredTracks.map((_, index) => (
                <button
                  key={index}
                  onClick={() => carouselApi?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <main className="container py-12 px-4 sm:px-6 space-y-12">
        {error && <ErrorState />}

        {!loading && !error && newReleases.length === 0 && <EmptyState />}

        {!loading && !error && newReleases.length > 0 && (
          <section ref={categoriesRef} data-section="categories" className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Browse All</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <Link key={category.id} href={category.href}>
                  <Card
                    className={`relative overflow-hidden bg-gradient-to-br ${category.gradient} border-0 cursor-pointer group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30 active:scale-95`}
                    style={{
                      animation: `fade-in 0.5s ease-out ${index * 0.1}s both`,
                    }}
                  >
                    <div className="p-6 h-40 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-white transform group-hover:scale-110 transition-transform">
                          {category.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white">{category.name}</h3>
                        <p className="text-sm text-white/80 line-clamp-2">{category.description}</p>
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 opacity-20 group-hover:opacity-30 transition-opacity">
                      <Music className="h-32 w-32 text-white" />
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
            className="space-y-6 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">New Releases</h2>
                <p className="text-foreground/70 mt-1">Fresh tracks just dropped</p>
              </div>
              <Link href="/explore?sort=newest">
                <Button variant="ghost" className="gap-2 hover:text-primary">
                  See all
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                onClick={() => scroll(newReleasesRef, "left")}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div ref={newReleasesRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
                {newReleases.map((track) => (
                  <div key={track.id} className="flex-none w-[180px] md:w-[200px]">
                    <TrackCard track={track} queue={newReleases} />
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
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
            className={`space-y-6 transition-all duration-700 ${
              sectionsVisible.trending ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Trending Now</h2>
                <p className="text-foreground/70 mt-1">What everyone's listening to</p>
              </div>
              <Link href="/trending">
                <Button variant="ghost" className="gap-2 hover:text-primary">
                  See all
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                onClick={() => scroll(trendingRef, "left")}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div ref={trendingRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
                {trending.map((track) => (
                  <div key={track.id} className="flex-none w-[180px] md:w-[200px]">
                    <TrackCard track={track} queue={trending} />
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
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
            className={`space-y-6 transition-all duration-700 ${
              sectionsVisible.forYou ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Made For You</h2>
                <p className="text-foreground/70 mt-1">Personalized picks just for you</p>
              </div>
            </div>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
                onClick={() => scroll(forYouRef, "left")}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <div ref={forYouRef} className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
                {forYou.map((track) => (
                  <div key={track.id} className="flex-none w-[180px]">
                    <TrackCard track={track} queue={forYou} />
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/80 backdrop-blur-xl border border-white/10 opacity-0 hover:opacity-100 transition-opacity hover:bg-black/90 hover:scale-110"
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
    </div>
  )
}
