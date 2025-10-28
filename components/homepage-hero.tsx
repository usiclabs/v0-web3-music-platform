"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Play, Music, Sparkles, ArrowDown, Zap, TrendingUp } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function HomepageHero() {
  const [isVisible, setIsVisible] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
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
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
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
          className="absolute inset-0 opacity-60 transition-all duration-500 ease-out"
          style={{
            background: `radial-gradient(circle 1000px at ${mousePosition.x}px ${mousePosition.y}px, rgba(229, 62, 62, 0.2), transparent 60%)`,
          }}
        />
        <div className="absolute inset-0 bg-mesh-gradient animate-aurora" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,62,62,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(220,38,38,0.1),transparent_50%)]" />
      </div>

      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float animate-morph" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float animate-morph"
        style={{ animationDelay: "2s", animationDuration: "8s" }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 bg-chart-3/15 rounded-full blur-3xl animate-float animate-morph"
        style={{ animationDelay: "4s", animationDuration: "10s" }}
      />
      <div
        className="absolute top-1/3 right-1/3 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float animate-morph"
        style={{ animationDelay: "1s", animationDuration: "12s" }}
      />

      <div className="container relative py-24 md:py-32 z-10">
        <div className="mx-auto max-w-5xl text-center">
          <div
            className={`mb-8 inline-flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-ultra border border-accent/50 px-6 py-3 text-sm shadow-2xl shadow-accent/30 transition-all duration-700 hover:shadow-accent/50 hover:scale-105 hover:border-accent/70 hover:bg-black/60 animate-glow-pulse ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Sparkles className="h-4 w-4 text-accent animate-pulse" />
            <span className="font-semibold bg-gradient-to-r from-white via-white/90 to-white/80 bg-clip-text text-transparent">
              Built on Base • Powered by X402 • $USI Ecosystem
            </span>
            <Zap className="h-4 w-4 text-accent animate-pulse" style={{ animationDelay: "0.5s" }} />
          </div>

          <h1
            className={`text-6xl md:text-8xl lg:text-9xl font-bold mb-8 text-balance leading-[0.95] transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Music without{" "}
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] animate-gradient blur-3xl opacity-60" />
              <span className="relative bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent text-glow">
                middlemen
              </span>
            </span>
          </h1>

          <p
            className={`text-2xl md:text-3xl text-foreground/90 mb-6 text-pretty leading-relaxed max-w-3xl mx-auto transition-all duration-700 delay-200 font-semibold ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Powered by payments that move at the speed of sound.
          </p>

          <p
            className={`text-lg md:text-xl text-foreground/70 mb-12 text-pretty leading-relaxed max-w-2xl mx-auto transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Stream any song. Pay creators directly. Earn as you listen.
          </p>

          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              size="lg"
              asChild
              className="gap-2 text-lg px-10 py-7 h-auto rounded-full bg-white hover:bg-white/90 text-black hover:scale-110 hover-glow-intense transition-all duration-300 group relative overflow-hidden shadow-2xl shadow-white/30 hover:shadow-white/50 font-semibold"
            >
              <Link href="/explore">
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 animate-ripple opacity-0 group-hover:opacity-20 bg-white rounded-full" />
                <Play className="h-5 w-5 group-hover:scale-125 transition-transform relative z-10 fill-current" />
                <span className="relative z-10">Listen Now</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="gap-2 text-lg px-10 py-7 h-auto rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-ultra border-2 border-white/20 hover:border-accent/60 hover:scale-110 hover-glow-intense transition-all duration-300 group relative overflow-hidden font-semibold"
            >
              <Link href="/dashboard">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Music className="h-5 w-5 group-hover:rotate-12 group-hover:scale-110 transition-transform relative z-10" />
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
                color: "primary",
                icon: Sparkles,
              },
              {
                value: isLoading ? "..." : formatStat(animatedStats.paidOut, "paidOut"),
                label: "Paid Out",
                color: "chart-3",
                icon: TrendingUp,
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="text-center group cursor-default bg-black/50 backdrop-blur-ultra rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/30 transition-all duration-300 hover-3d hover-glow-intense hover:bg-black/60"
              >
                <stat.icon
                  className={`h-5 w-5 sm:h-6 sm:w-6 text-${stat.color} mx-auto mb-2 sm:mb-3 group-hover:scale-125 transition-transform duration-300`}
                />
                <div
                  className={`text-2xl sm:text-3xl md:text-5xl font-bold text-${stat.color} mb-1 sm:mb-2 group-hover:scale-110 transition-transform duration-300 truncate ${
                    isLoading ? "animate-pulse" : "animate-count-up"
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
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl animate-ping-large" />
          <div className="relative w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2 group-hover:border-accent/60 transition-colors backdrop-blur-sm bg-black/20">
            <div className="w-1 h-2 bg-accent/80 rounded-full animate-pulse" />
          </div>
        </div>
        <ArrowDown className="h-4 w-4 text-foreground/40 group-hover:text-accent/80 mx-auto mt-2 transition-colors" />
      </div>
    </section>
  )
}
