"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Music,
  Zap,
  BarChart3,
  Shield,
  Coins,
  Users,
  ArrowRight,
  Twitter,
  MessageCircle,
  Mail,
  CheckCircle,
} from "lucide-react"
import { FeaturedArtistsCarousel } from "@/components/featured-artists-carousel"
import { TrendingWidget } from "@/components/trending-widget"

/* ── Intersection-observer hook ────────────────────────────── */
function useVisible(id: string, refs: React.MutableRefObject<Record<string, HTMLElement | null>>) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = refs.current[id]
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [id, refs])
  return visible
}

/* ── Section wrapper ───────────────────────────────────────── */
function Section({
  id,
  children,
  refs,
  className = "",
}: {
  id: string
  children: React.ReactNode
  refs: React.MutableRefObject<Record<string, HTMLElement | null>>
  className?: string
}) {
  return (
    <section
      id={id}
      ref={(el) => { refs.current[id] = el }}
      className={`border-t border-white/5 ${className}`}
    >
      {children}
    </section>
  )
}

/* ── Label chip ────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/5 px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase text-red-400">
      <span className="h-1 w-1 rounded-full bg-red-500" />
      {children}
    </span>
  )
}

/* ── How it works steps ────────────────────────────────────── */
const HOW_STEPS = [
  {
    num: "01",
    title: "Connect Wallet",
    body: "Sign in with your Base wallet in one tap. No email, no password, no third-party accounts.",
    icon: Shield,
  },
  {
    num: "02",
    title: "Stream & Pay",
    body: "Every second you listen, a micropayment flows directly to the artist via X402 protocol.",
    icon: Zap,
  },
  {
    num: "03",
    title: "Own the Moment",
    body: "Buy artist tokens, collect tracks on-chain, and build a portfolio of music you actually own.",
    icon: Coins,
  },
]

/* ── For artists features ──────────────────────────────────── */
const ARTIST_FEATURES = [
  {
    icon: BarChart3,
    title: "Real-time earnings",
    body: "Watch your balance grow with every stream — no 90-day payment cycles.",
  },
  {
    icon: Coins,
    title: "Tokenize your catalog",
    body: "Turn any track into a tradeable on-chain asset. Let fans invest in your success.",
  },
  {
    icon: Users,
    title: "Own your audience",
    body: "Direct fan relationships with no algorithm deciding who sees your work.",
  },
  {
    icon: Shield,
    title: "Zero platform cut",
    body: "100% of streaming revenue goes to you. No label splits, no middlemen.",
  },
]

/* ── Trust badges ──────────────────────────────────────────── */
const TRUST_BADGES = [
  { label: "Non-custodial", icon: Shield },
  { label: "Open source", icon: CheckCircle },
  { label: "Audited contracts", icon: CheckCircle },
  { label: "Base network", icon: Zap },
]

/* ═══════════════════════════════════════════════════════════ */

export function HomepageSections() {
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const [email, setEmail] = useState("")
  const [emailSent, setEmailSent] = useState(false)

  const howVisible = useVisible("how", refs)
  const artistsVisible = useVisible("artists-section", refs)
  const trendingVisible = useVisible("trending-section", refs)
  const trustVisible = useVisible("trust", refs)
  const communityVisible = useVisible("community", refs)

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setEmailSent(true)
  }

  return (
    <>
      {/* ── Featured Artists ─────────────────────────────────── */}
      <Section id="artists-section" refs={refs}>
        <div
          className={`container mx-auto max-w-7xl px-6 py-16 md:py-24 transition-all duration-700 ${
            artistsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <Label>Creators</Label>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                Featured Artists
              </h2>
            </div>
            <Button
              variant="ghost"
              asChild
              className="gap-1.5 text-white/50 hover:text-white text-sm shrink-0"
            >
              <Link href="/artists">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <FeaturedArtistsCarousel />
        </div>
      </Section>

      {/* ── Trending ─────────────────────────────────────────── */}
      <Section id="trending-section" refs={refs}>
        <div
          className={`container mx-auto max-w-7xl px-6 py-16 md:py-24 transition-all duration-700 ${
            trendingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <Label>Charts</Label>
              <h2 className="mt-4 font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
                Trending Now
              </h2>
            </div>
            <Button
              variant="ghost"
              asChild
              className="gap-1.5 text-white/50 hover:text-white text-sm shrink-0"
            >
              <Link href="/trending">
                See more <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          <TrendingWidget />
        </div>
      </Section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <Section id="how" refs={refs} className="bg-white/[0.01]">
        <div className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div
            className={`mb-14 text-center transition-all duration-700 ${
              howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <Label>How it works</Label>
            <h2 className="mt-4 font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-white">
              Three steps.<br />Total ownership.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
            {HOW_STEPS.map(({ num, title, body, icon: Icon }, i) => (
              <div
                key={num}
                className={`relative bg-black p-8 md:p-10 transition-all duration-700 group hover:bg-white/[0.02] ${
                  howVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
                style={{ transitionDelay: `${i * 100 + 100}ms` }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-display text-5xl font-black text-white/5 group-hover:text-red-500/10 transition-colors">
                    {num}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
                    <Icon className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white mb-3">
                  {title}
                </h3>
                <p className="text-sm text-white/45 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── For Artists ──────────────────────────────────────── */}
      <Section id="for-artists" refs={refs}>
        <div className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div
            className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center transition-all duration-700 ${
              artistsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {/* Left column */}
            <div>
              <Label>For artists</Label>
              <h2 className="mt-4 font-display text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Your music.{" "}
                <span className="text-red-500">Your money.</span>{" "}
                Your rules.
              </h2>
              <p className="mt-6 text-base text-white/45 leading-relaxed max-w-md">
                USIC gives independent artists direct access to their fans and their earnings — with no label, no distributor, and no platform taking a cut.
              </p>
              <div className="mt-8 space-y-4">
                {ARTIST_FEATURES.map(({ icon: Icon, title, body }) => (
                  <div key={title} className="flex gap-4 group">
                    <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
                      <Icon className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-sm text-white/40 leading-relaxed mt-0.5">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="lg"
                asChild
                className="mt-10 gap-2 h-12 px-8 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-600/20 transition-all duration-200 hover:scale-[1.02]"
              >
                <Link href="/dashboard">
                  <Music className="h-4 w-4" />
                  Become a USIC Artist
                </Link>
              </Button>
            </div>

            {/* Right column — visual */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-72 h-72">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border border-red-500/10 animate-spin" style={{ animationDuration: "20s" }} />
                <div className="absolute inset-6 rounded-full border border-red-500/15 animate-spin" style={{ animationDuration: "14s", animationDirection: "reverse" }} />
                <div className="absolute inset-12 rounded-full border border-red-500/20 animate-spin" style={{ animationDuration: "8s" }} />
                {/* Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-24 w-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-xl shadow-red-500/20">
                    <Music className="h-10 w-10 text-red-500" />
                  </div>
                </div>
                {/* Orbit dots */}
                {[0, 72, 144, 216, 288].map((deg) => (
                  <div
                    key={deg}
                    className="absolute h-2 w-2 rounded-full bg-red-500/50"
                    style={{
                      top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 120}px - 4px)`,
                      left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 120}px - 4px)`,
                    }}
                  />
                ))}
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-full bg-red-500/5 blur-3xl" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Trust ────────────────────────────────────────────── */}
      <Section id="trust" refs={refs} className="bg-white/[0.01]">
        <div className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              trustVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <Label>Built to last</Label>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
              Security & trust
            </h2>
          </div>

          <div
            className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden mb-16 transition-all duration-700 delay-100 ${
              trustVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {TRUST_BADGES.map(({ label, icon: Icon }) => (
              <div key={label} className="bg-black flex flex-col items-center gap-3 py-10 px-6 hover:bg-white/[0.02] transition-colors">
                <Icon className="h-6 w-6 text-red-500" />
                <p className="text-sm font-semibold text-white/70 text-center">{label}</p>
              </div>
            ))}
          </div>

          <div
            className={`text-center transition-all duration-700 delay-200 ${
              trustVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <p className="text-xs text-white/25 mb-8 uppercase tracking-widest font-bold">Powered by</p>
            <div className="flex flex-wrap justify-center items-center gap-12">
              {["Base", "Coinbase", "OpenZeppelin", "Zora"].map((name) => (
                <span key={name} className="text-xl font-black text-white/20 hover:text-white/40 transition-colors font-display uppercase tracking-wider">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── Community ────────────────────────────────────────── */}
      <Section id="community" refs={refs}>
        <div className="container mx-auto max-w-3xl px-6 py-20 md:py-32 text-center">
          <div
            className={`transition-all duration-700 ${
              communityVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            <Label>Community</Label>
            <h2 className="mt-4 font-display text-4xl md:text-6xl font-black uppercase tracking-tight text-white leading-tight">
              Join the<br />
              <span className="text-red-500">revolution.</span>
            </h2>
            <p className="mt-6 text-base text-white/45 max-w-sm mx-auto leading-relaxed">
              The future of music belongs to artists and fans — not platforms. Be part of it.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {[
                { icon: Twitter, label: "Follow on X", href: "https://x.com/usic_labs" },
                { icon: MessageCircle, label: "Telegram", href: "https://t.me/usicoincommunity" },
                { icon: Users, label: "Discord", href: "https://discord.gg/usimusic" },
              ].map(({ icon: Icon, label, href }) => (
                <Button
                  key={label}
                  variant="outline"
                  asChild
                  className="gap-2 h-11 px-6 rounded-full border-white/10 text-white/60 hover:text-white hover:border-white/25 hover:bg-white/5 transition-all duration-200"
                >
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-4 w-4" />
                    {label}
                  </a>
                </Button>
              ))}
            </div>

            {/* Email capture */}
            <div className="mt-12 mx-auto max-w-sm">
              {emailSent ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-emerald-400 font-semibold">
                  <CheckCircle className="h-4 w-4" />
                  {"You're on the list!"}
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 h-11 px-4 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 transition-all"
                  />
                  <Button
                    type="submit"
                    className="h-11 px-5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold gap-2 transition-all shrink-0"
                  >
                    <Mail className="h-4 w-4" />
                    Join
                  </Button>
                </form>
              )}
              <p className="mt-3 text-xs text-white/25">Get notified when new artists join. No spam.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 bg-black">
        <div className="container mx-auto max-w-7xl px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {[
              {
                heading: "Product",
                links: [
                  { label: "Listen", href: "/explore" },
                  { label: "Upload", href: "/dashboard" },
                  { label: "Token", href: "/staking" },
                  { label: "Artists", href: "/artists" },
                ],
              },
              {
                heading: "Learn",
                links: [
                  { label: "How it works", href: "#how" },
                  { label: "For artists", href: "#for-artists" },
                  { label: "X402 protocol", href: "#" },
                  { label: "Whitepaper", href: "#" },
                ],
              },
              {
                heading: "Community",
                links: [
                  { label: "Discord", href: "https://discord.gg/usimusic" },
                  { label: "Telegram", href: "https://t.me/usicoincommunity" },
                  { label: "X / Twitter", href: "https://x.com/usic_labs" },
                ],
              },
              {
                heading: "Legal",
                links: [
                  { label: "Terms", href: "#" },
                  { label: "Privacy", href: "#" },
                  { label: "Cookie policy", href: "#" },
                ],
              },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">{heading}</p>
                <ul className="space-y-3">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-white/45 hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-red-500" />
              <span className="font-display font-black text-lg uppercase tracking-wide text-white">USIC</span>
            </div>
            <p className="text-xs text-white/25 text-center">
              © 2025 USI Labs — Built on Base. Powered by X402. No platform fees. Ever.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
