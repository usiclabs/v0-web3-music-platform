"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Coins,
  Music,
  Shield,
  Zap,
  Play,
  Wallet,
  Sparkles,
  TrendingUp,
  Globe,
  Heart,
  Award,
  BarChart3,
  Lock,
  CheckCircle2,
  Users,
  Twitter,
  MessageCircle,
  Mail,
  ArrowRight,
} from "lucide-react"

export function HomepageSections() {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      {
        // Trigger when 5% of the section enters the viewport, 80px before it arrives
        threshold: 0.05,
        rootMargin: "0px 0px -80px 0px",
      },
    )

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const isVisible = (id: string) => visibleSections.has(id)

  return (
    <>
      {/* How It Works Section */}
      <section
        id="how-it-works"
        ref={(el) => {
          sectionRefs.current["how-it-works"] = el
        }}
        className="py-32 border-t border-border/40 relative overflow-hidden px-4 sm:px-6"
        style={{ contain: "layout style" }}
      >
        <div className="container relative">
          <div
            className={`mx-auto max-w-3xl text-center mb-20 duration-700 ${
              isVisible("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)", willChange: isVisible("how-it-works") ? "auto" : "opacity, transform" }}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-balance">
              How It Works
            </h2>
            <p className="text-xl text-foreground/70">Simple streaming. Instant payments.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {[
              {
                icon: Play,
                number: "1",
                title: "Stream",
                description: "Press play on any track.",
                color: "accent",
                delay: "100ms",
              },
              {
                icon: Zap,
                number: "2",
                title: "Pay",
                description: "Micropayment sent instantly to the artist.",
                color: "accent",
                delay: "200ms",
              },
              {
                icon: Sparkles,
                number: "3",
                title: "Done",
                description: "Artist gets paid. You keep listening.",
                color: "accent",
                delay: "300ms",
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 group ${
                  isVisible("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: step.delay }}
              >
                <div className="relative mb-8">
                  <div
                    className={`w-28 h-28 mx-auto rounded-full bg-card/30 backdrop-blur-2xl border-2 border-${step.color}/50 flex items-center justify-center shadow-2xl shadow-${step.color}/20 group-hover:scale-110 group-hover:shadow-${step.color}/40 group-hover:border-${step.color} transition-all duration-300 relative overflow-hidden`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br from-${step.color}/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                    <step.icon
                      className={`h-12 w-12 text-${step.color} group-hover:scale-110 transition-transform relative z-10`}
                    />
                  </div>
                  <div
                    className={`absolute -top-3 -right-3 w-10 h-10 rounded-full bg-${step.color} text-background flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {step.number}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">{step.title}</h3>
                <p className="text-foreground/70 leading-relaxed text-lg">{step.description}</p>
              </div>
            ))}
          </div>

          <div
            className={`text-center mt-16 transition-all duration-700 delay-400 ${
              isVisible("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-2xl font-semibold text-accent mb-6">
              Every stream is a payment. Every payment is instant.
            </p>
          </div>
        </div>
      </section>

      {/* AI Curator Section - Removed */}

      {/* Artist Value Proposition */}
      <section
        id="for-artists"
        ref={(el) => {
          sectionRefs.current["for-artists"] = el
        }}
        className="py-32 border-t border-border/40 px-4 sm:px-6 relative overflow-hidden"
        style={{ contain: "layout style" }}
      >
        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className={`duration-700 ${
                isVisible("for-artists") ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
              style={{ transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)", willChange: isVisible("for-artists") ? "auto" : "opacity, transform" }}
            >
              <h2 className="text-5xl md:text-7xl font-bold mb-8 text-balance leading-tight">
                Keep 100% of your earnings.
              </h2>

              <div className="space-y-8">
                {[
                  {
                    icon: Zap,
                    title: "Get paid per stream",
                    description: "Instant micropayments. No 90-day holds.",
                    color: "accent",
                  },
                  {
                    icon: BarChart3,
                    title: "Split royalties on-chain",
                    description: "Transparent splits. Every collaborator sees their share.",
                    color: "accent",
                  },
                  {
                    icon: Wallet,
                    title: "Your wallet, your business",
                    description: "No label. No middlemen. Just you and your fans.",
                    color: "accent",
                  },
                  {
                    icon: TrendingUp,
                    title: "Watch earnings in real-time",
                    description: "Live dashboard. Every play, tip, and sale tracked instantly.",
                    color: "accent",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-6 group">
                    <div
                      className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-card/30 backdrop-blur-xl border border-${feature.color}/30 flex items-center justify-center group-hover:scale-110 group-hover:border-${feature.color}/50 group-hover:shadow-lg group-hover:shadow-${feature.color}/20 transition-all duration-300`}
                    >
                      <feature.icon className={`h-7 w-7 text-${feature.color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-foreground/70 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                asChild
                className="mt-10 gap-2 rounded-full px-8 py-6 h-auto text-lg shadow-2xl shadow-accent/20 hover:shadow-accent/40 hover:scale-105 transition-all duration-300 bg-transparent text-[rgba(255,255,255,1)] group relative overflow-hidden"
              >
                <Link href="/dashboard">
                  <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Music className="h-5 w-5 relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="relative z-10">Become a USIC Artist</span>
                </Link>
              </Button>
            </div>

            <div
              className={`transition-all duration-700 delay-200 ${
                isVisible("for-artists") ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <div className="rounded-3xl border border-border/50 bg-card/20 backdrop-blur-2xl p-12 shadow-2xl hover:shadow-accent/10 transition-shadow duration-500 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="aspect-square rounded-2xl bg-transparent flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                  <div className="text-center relative z-10 bg-transparent">
                    <BarChart3 className="h-24 w-24 text-accent mx-auto mb-6 animate-pulse" />
                    <p className="text-foreground/70 text-lg font-medium">Real-time earnings dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fan Experience */}
      <section
        id="for-fans"
        ref={(el) => {
          sectionRefs.current["for-fans"] = el
        }}
        className="py-32 border-t border-border/40 px-4 sm:px-6"
        style={{ contain: "layout style" }}
      >
        <div className="container">
          <div
            className={`mx-auto max-w-3xl text-center mb-20 transition-all duration-700 ${
              isVisible("for-fans") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-balance">Stream music. Pay artists.</h2>
            <p className="text-2xl text-foreground/80 mb-4">Pennies per play. 100% to creators.</p>
            <p className="text-lg text-foreground/60">
              No subscriptions. No ads. Just direct support for the music you love.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Coins,
                title: "Pay as you listen",
                description: "Stream for fractions of a cent. Only pay for what you play.",
                color: "accent",
                delay: "100ms",
              },
              {
                icon: Heart,
                title: "Support artists directly",
                description: "100% goes to creators. Zero platform fees or label cuts.",
                color: "accent",
                delay: "200ms",
              },
              {
                icon: Award,
                title: "Own music as NFTs",
                description: "Collect limited editions. Unlock perks. Resell for value.",
                color: "accent",
                delay: "300ms",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`bg-card/30 backdrop-blur-xl border border-border/50 shadow-xl p-10 rounded-3xl hover:scale-[1.03] hover:shadow-2xl hover:shadow-${feature.color}/10 transition-[transform,box-shadow,opacity] duration-500 ${
                  isVisible("for-fans") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: feature.delay, willChange: isVisible("for-fans") ? "auto" : "transform, opacity" }}
              >
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-${feature.color}/10 border border-${feature.color}/30 mb-8`}
                >
                  <feature.icon className={`h-8 w-8 text-${feature.color}`} />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-foreground/70 leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>

          <div
            className={`text-center mt-16 transition-all duration-700 delay-400 ${
              isVisible("for-fans") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Button
              size="lg"
              asChild
              className="gap-2 rounded-full px-10 py-7 h-auto text-lg shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
            >
              <Link href="/explore">
                <Play className="h-5 w-5" />
                Start Listening
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section
        id="trust"
        ref={(el) => {
          sectionRefs.current["trust"] = el
        }}
        className="py-32 border-t border-border/40 px-4 sm:px-6"
        style={{ contain: "layout style" }}
      >
        <div className="container">
          <div
            className={`mx-auto max-w-3xl text-center mb-20 transition-all duration-700 ${
              isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-balance">Built for the Open Internet</h2>
            <p className="text-2xl text-foreground/70 italic">"Where every creator can earn instantly and globally."</p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { icon: CheckCircle2, label: "Instant USDC Payments", color: "accent", delay: "100ms" },
              { icon: Shield, label: "Smart Contract Verified", color: "accent", delay: "200ms" },
              { icon: Lock, label: "No Custody of Funds", color: "accent", delay: "300ms" },
              { icon: Globe, label: "Global & Permissionless", color: "accent", delay: "400ms" },
            ].map((badge, index) => (
              <div
                key={index}
                className={`bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center hover:scale-[1.03] hover:shadow-xl hover:shadow-${badge.color}/10 transition-[transform,box-shadow,opacity] duration-500 ${
                  isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: badge.delay, willChange: isVisible("trust") ? "auto" : "transform, opacity" }}
              >
                <badge.icon className={`h-10 w-10 text-${badge.color} mx-auto mb-4`} />
                <p className="font-semibold text-sm">{badge.label}</p>
              </div>
            ))}
          </div>

          {/* Partner Logos */}
          <div
            className={`text-center mt-20 transition-all duration-700 delay-500 ${
              isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-sm text-foreground/50 mb-8 uppercase tracking-wider">Powered by</p>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-60">
              <div className="text-3xl font-bold">Base</div>
              <div className="text-3xl font-bold">Coinbase</div>
              <div className="text-3xl font-bold">OpenZeppelin</div>
              <div className="text-3xl font-bold">Zora</div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="community"
        ref={(el) => {
          sectionRefs.current["community"] = el
        }}
        className="py-32 border-t border-border/40 px-4 sm:px-6 relative overflow-hidden"
        style={{ contain: "layout style" }}
      >
        <div className="container relative">
          <div
            className={`max-w-4xl mx-auto text-center transition-all duration-700 ${
              isVisible("community") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6 text-balance">Become Part of the Movement</h2>
            <p className="text-xl text-foreground/70 mb-4">Join the rebellion against outdated streaming economics.</p>
            <p className="text-lg text-foreground/60 mb-12">Be part of the first on-chain music revolution.</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {[
                { icon: Twitter, label: "Follow on X", href: "https://x.com/usic_labs" },
                { icon: MessageCircle, label: "Join Telegram", href: "https://t.me/usicoincommunity" },
                { icon: Users, label: "Join Discord", href: "https://discord.gg/usimusic" },
              ].map((social, index) => (
                <Button
                  key={index}
                  size="lg"
                  variant="outline"
                  asChild
                  className="gap-2 rounded-full bg-transparent hover:bg-card/50 backdrop-blur-xl border-2 hover:border-primary/50 hover:scale-105 transition-all duration-300 group"
                >
                  <a href={social.href} target="_blank" rel="noopener noreferrer">
                    <social.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    {social.label}
                  </a>
                </Button>
              ))}
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-card/30 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl hover:shadow-primary/10 transition-shadow duration-500">
                <h3 className="text-xl font-semibold mb-4">Get Early Access</h3>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 px-4 py-3 rounded-xl bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <Button className="gap-2 rounded-xl hover:scale-105 transition-transform">
                    <Mail className="h-4 w-4" />
                    Join
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/40 py-16 px-4 sm:px-6">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Product */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                {[
                  { label: "Listen", href: "/explore" },
                  { label: "Upload", href: "/dashboard" },
                  { label: "Token", href: "/staking" },
                  { label: "Docs", href: "/docs" },
                ].map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2 group"
                    >
                      <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer">
              <Music className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform" />
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                USI
              </span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              © 2025 USI Labs — Built on Base. Powered by X402.
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
