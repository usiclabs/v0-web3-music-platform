"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Particle component for the animated background
function Particle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <div
      className="absolute w-1 h-1 rounded-full bg-[#FF2A2A] opacity-0"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `particle-drift 12s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        ["--drift-x" as string]: `${(Math.random() - 0.5) * 200}px`,
        ["--drift-y" as string]: `${-Math.random() * 300}px`,
      }}
    />
  )
}

// Waveform visualization component
function WaveformVisualizer() {
  return (
    <div className="flex items-end justify-center gap-1 h-16 opacity-40">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-[#FF2A2A]/30 to-[#FF2A2A] rounded-full"
          style={{
            height: `${20 + Math.random() * 80}%`,
            animation: `waveform-pulse ${0.8 + Math.random() * 0.4}s ease-in-out infinite`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

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

  // Generate particles
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    delay: Math.random() * 10,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }))

  return (
    <section className="relative overflow-hidden min-h-screen flex items-center justify-center bg-black">
      {/* Background Layers */}
      <div className="absolute inset-0">
        {/* Radial gradient backdrop */}
        <div className="absolute inset-0 bg-radial-gradient opacity-60" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        
        {/* Mouse-following glow */}
        <div
          className="absolute inset-0 opacity-40 transition-all duration-300 ease-out pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 42, 42, 0.15), transparent 50%)`,
          }}
        />

        {/* Particle field */}
        <div className="particle-field">
          {particles.map((p, i) => (
            <Particle key={i} {...p} />
          ))}
        </div>

        {/* Bottom waveform accent */}
        <div className="absolute bottom-0 left-0 right-0 h-32">
          <WaveformVisualizer />
        </div>
      </div>

      {/* Central Energy Core - Refined and subtle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
        {/* Single subtle rotating ring */}
        <div className="absolute -inset-32 md:-inset-48">
          <div className="w-full h-full rounded-full border border-[#FF2A2A]/10 ring-rotate" />
        </div>
        
        {/* Core glow - subtle */}
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-[#FF2A2A]/5 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="container relative z-10 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge - Minimal */}
          <div
            className={`mb-10 inline-flex items-center gap-2 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="text-xs font-medium tracking-[0.2em] text-white/40 uppercase">
              AI-Powered Music Platform
            </span>
          </div>

          {/* Main Headline */}
          <h1
            className={`text-6xl sm:text-7xl md:text-8xl lg:text-[10rem] font-bold mb-6 tracking-[-0.04em] leading-[0.85] transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="block text-white">CREATE.</span>
            <span className="block text-[#FF2A2A]">OWN.</span>
            <span className="block text-white">EARN.</span>
          </h1>

          {/* Subtext - Single line, minimal */}
          <p
            className={`text-lg sm:text-xl text-white/50 mb-12 max-w-md mx-auto transition-all duration-700 delay-200 font-light ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            The new music economy starts here.
          </p>

          {/* CTA Buttons - Clean and minimal */}
          <div
            className={`flex flex-col sm:flex-row gap-4 justify-center mb-20 transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Button
              size="lg"
              asChild
              className="h-12 px-8 text-base font-medium"
            >
              <Link href="/create">
                Start Creating
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 px-8 text-base font-medium"
            >
              <Link href="/explore">
                Explore
              </Link>
            </Button>
          </div>

          {/* Stats - Clean grid */}
          <div
            className={`grid grid-cols-3 gap-8 max-w-2xl mx-auto transition-all duration-700 delay-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {[
              {
                value: isLoading ? "..." : formatStat(animatedStats.tracks, "tracks"),
                label: "Tracks",
              },
              {
                value: isLoading ? "..." : formatStat(animatedStats.artists, "artists"),
                label: "Artists",
              },
              {
                value: isLoading ? "..." : formatStat(animatedStats.paidOut, "paidOut"),
                label: "Paid Out",
              },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 tracking-wide uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-60 transition-opacity cursor-pointer">
          <span className="text-xs tracking-widest text-white/60">SCROLL</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#FF2A2A] to-transparent" />
        </div>
      </div>
    </section>
  )
}
