"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Zap, Music } from "lucide-react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const TICKER_ITEMS = [
  "Stream to Earn",
  "Own Your Masters",
  "On-Chain Music",
  "Artists First",
  "No Middlemen",
  "Tokenize Your Sound",
  "Built on Base",
  "Powered by X402",
]

export function HomepageHero() {
  const [visible, setVisible] = useState(false)
  const [animatedStats, setAnimatedStats] = useState({ tracks: 0, artists: 0, paidOut: 0 })

  const { data: stats } = useSWR("/api/stats/homepage", fetcher, {
    refreshInterval: 30000,
  })

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!stats) return
    const duration = 1800
    const steps = 60
    let step = 0
    const iv = setInterval(() => {
      step++
      const p = step / steps
      setAnimatedStats({
        tracks: Math.floor(stats.tracks.raw * p),
        artists: Math.floor(stats.artists.raw * p),
        paidOut: Math.floor(stats.paidOut.raw * p),
      })
      if (step >= steps) {
        clearInterval(iv)
        setAnimatedStats({
          tracks: stats.tracks.raw,
          artists: stats.artists.raw,
          paidOut: stats.paidOut.raw,
        })
      }
    }, duration / steps)
    return () => clearInterval(iv)
  }, [stats])

  const fmt = (n: number, type: "tracks" | "artists" | "paidOut") => {
    if (type === "paidOut") {
      if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
      if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
      return `$${n.toFixed(2)}`
    }
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return `${n}`
  }

  return (
    <section className="relative overflow-hidden bg-black">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Single centered glow — not mouse-tracking */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-red-600/8 blur-[100px]" />

      {/* ── Hero copy ─────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-6xl px-6 pt-40 pb-28 text-center">
        {/* Eyebrow pill */}
        <div
          className={`mb-10 inline-flex items-center gap-2.5 rounded-full border border-red-500/25 bg-red-500/5 px-5 py-2 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-widest uppercase text-red-400">
            Built on Base · Powered by X402
          </span>
        </div>

        {/* Headline */}
        <h1
          className={`font-display font-black uppercase tracking-tight leading-none text-white transition-all duration-700 delay-100 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <span className="block text-[clamp(3.5rem,11vw,9rem)]">Music that</span>
          <span className="block text-[clamp(3.5rem,11vw,9rem)] text-red-500">
            pays artists.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className={`mx-auto mt-8 max-w-xl text-base md:text-lg text-white/50 leading-relaxed transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          No subscriptions. No platform fees. Stream a song, pay the artist directly — per second, on-chain, every time.
        </p>

        {/* CTAs */}
        <div
          className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700 delay-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Button
            size="lg"
            asChild
            className="gap-2 h-12 px-8 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/25 transition-all duration-200 hover:shadow-red-500/40 hover:scale-[1.02]"
          >
            <Link href="/explore">
              <Play className="h-4 w-4 fill-white" />
              Start Listening
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="gap-2 h-12 px-8 rounded-full border-white/10 text-white/70 hover:text-white hover:border-white/25 hover:bg-white/5 font-semibold transition-all duration-200"
          >
            <Link href="/dashboard">
              Upload Music
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Live stats */}
        <div
          className={`mt-16 mx-auto grid max-w-lg grid-cols-3 divide-x divide-white/5 rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-700 delay-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {[
            { value: fmt(animatedStats.tracks, "tracks"), label: "Tracks", icon: Music },
            { value: fmt(animatedStats.artists, "artists"), label: "Artists", icon: Zap },
            { value: fmt(animatedStats.paidOut, "paidOut"), label: "Paid Out", icon: ArrowRight },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1 py-5 px-4">
              <Icon className="h-3.5 w-3.5 text-red-500 mb-1" />
              <span className="text-2xl font-black text-white font-display tabular-nums">
                {stats ? value : "—"}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-white/35 font-semibold">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrolling ticker ───────────────────────────────────── */}
      <div className="border-t border-white/5 py-4 overflow-hidden">
        <div className="flex animate-scroll-left whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-4 px-6 text-[11px] font-bold tracking-widest uppercase text-white/20"
            >
              {item}
              <span className="text-red-700" aria-hidden>·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
