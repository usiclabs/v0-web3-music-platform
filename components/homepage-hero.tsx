"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Music, Sparkles, ArrowDown, Zap } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function HomepageHero() {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const [animatedStats, setAnimatedStats] = useState({
    tracks: 0,
    artists: 0,
    paidOut: 0,
  })

  const { data: stats, isLoading } = useSWR("/api/stats/homepage", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  })

  useEffect(() => {
    setIsVisible(true)

    const handleMouseMove = (e: MouseEvent) => {
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY })
        rafRef.current = null
      })
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    if (!stats) return

    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedStats({
        tracks: Math.floor(stats.tracks.raw * progress),
        artists: Math.floor(stats.artists.raw * progress),
        paidOut: Math.floor(stats.paidOut.raw * progress),
      })

      if (currentStep >= steps) {
        clearInterval(interval)
        setAnimatedStats({
          tracks: stats.tracks.raw,
          artists: stats.artists.raw,
          paidOut: stats.paidOut.raw,
        })
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [stats])

  const formatStat = (value: number, type: "tracks" | "artists" | "paidOut") => {
    if (type === "paidOut") {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
      if (value >= 1) return `$${value.toFixed(0)}`
      return `$${value.toFixed(2)}`
    }
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K+`
    return `${value}+`
  }

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center px-4 sm:px-6">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30 transition-[background] duration-150 ease-out"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(229, 62, 62, 0.15), transparent 50%)`,
            willChange: "background",
          }}
        />
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-3xl animate-float" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float"
        style={{ animationDelay: "2s", animationDuration: "8s" }}
      />

      <div className="container relative py-24 md:py-32 z-10">
        <div className="mx-auto max-w-5xl text-center">
          <div
            className={`mb-8 inline-flex items-center gap-2 rounded-full bg-card/30 backdrop-blur-2xl border border-accent/30 px-6 py-3 text-sm shadow-2xl shadow-accent/10 transition-all duration-700 hover:shadow-accent/30 hover:scale-105 hover:border-accent/50 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className="font-medium text-foreground/80">
              Built on Base • Powered by X402 • $USI Ecosystem
            </span>
            <Zap className="h-4 w-4 text-accent animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>

          <h1
            className={`md:text-8xl lg:text-9xl font-bold mb-8 text-balance leading-[0.95] transition-all duration-700 delay-100 text-5xl ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Music that{" "}
            <span className="text-accent">
              pays artists
            </span>
          </h1>

          <p
            className={`text-2xl md:text-3xl text-foreground/90 mb-6 text-pretty leading-relaxed max-w-3xl mx-auto transition-all duration-700 delay-200 font-medium ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Micropayments that move at the speed of sound.
          </p>

          <p
            className={`text-lg md:text-xl text-foreground/70 mb-12 text-pretty leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            No subscriptions. No platform fees. Artists get 100% of what you pay.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              size="lg"
              asChild
              className="gap-2 text-lg px-10 py-7 h-auto rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 transition-all duration-300 group relative overflow-hidden text-white shadow-2xl shadow-white/10"
            >
              <Link href="/explore">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Play className="h-5 w-5 group-hover:scale-110 transition-transform relative z-10 fill-none stroke-2" />
                <span className="relative z-10 font-semibold">Listen Now</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-2 text-lg px-10 py-7 h-auto rounded-full bg-card/20 hover:bg-card/40 backdrop-blur-2xl border-2 border-border hover:scale-105 hover:border-accent/50 transition-all duration-300 group relative overflow-hidden"
            >
              <Link href="/dashboard">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Music className="h-5 w-5 group-hover:rotate-12 transition-transform relative z-10" />
                <span className="relative z-10">Upload Your Music</span>
              </Link>
            </Button>
          </div>

          <div
            className={`grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto transition-all duration-700 delay-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              {
                value: isLoading ? "..." : formatStat(animatedStats.tracks, "tracks"),
                label: "Tracks",
                color: "accent",
                icon: Music,
              },
              {
                value: isLoading ? "..." : formatStat(animatedStats.artists, "artists"),
                label: "Artists",
                color: "accent",
                icon: Sparkles,
              },
              {
                value: isLoading ? "..." : formatStat(animatedStats.paidOut, "paidOut"),
                label: "Paid Out",
                color: "accent",
                icon: Zap,
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center group cursor-default bg-card/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-border/50 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300"
              >
                <stat.icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color} mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform`}
                />
                <div
                  className={`text-2xl sm:text-3xl md:text-5xl font-bold text-${stat.color} mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300 truncate ${
                    isLoading ? "animate-pulse" : ""
                  }`}
                >
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-foreground/60 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer group">
        <div className="w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2 group-hover:border-accent/50 transition-colors">
          <div className="w-1 h-2 bg-accent/60 rounded-full animate-pulse" />
        </div>
        <ArrowDown className="h-4 w-4 text-foreground/40 group-hover:text-accent/60 mx-auto mt-2 transition-colors" />
      </div>
    </section>
  )
}
