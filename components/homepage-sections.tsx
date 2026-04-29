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
        className="py-24 md:py-32 relative overflow-hidden px-4 sm:px-6 bg-black"
        style={{ contain: "layout style" }}
      >
        <div className="container relative max-w-4xl mx-auto">
          <div
            className={`text-center mb-16 duration-700 ${
              isVisible("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)", willChange: isVisible("how-it-works") ? "auto" : "opacity, transform" }}
          >
            <p className="text-xs tracking-[0.2em] text-white/30 uppercase mb-4">Process</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: Play,
                number: "01",
                title: "Stream",
                description: "Press play on any track.",
                delay: "100ms",
              },
              {
                icon: Zap,
                number: "02",
                title: "Pay",
                description: "Micropayment sent instantly.",
                delay: "200ms",
              },
              {
                icon: Sparkles,
                number: "03",
                title: "Done",
                description: "Artist gets paid.",
                delay: "300ms",
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`text-center transition-all duration-700 ${
                  isVisible("how-it-works") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: step.delay }}
              >
                <div className="relative mb-5 inline-block">
                  <div className="w-14 h-14 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                    <step.icon className="h-6 w-6 text-[#FF2A2A]/80" />
                  </div>
                  <span className="absolute -top-1 -right-3 text-[10px] font-mono text-white/20">{step.number}</span>
                </div>
                <h3 className="text-base font-medium mb-1.5 text-white/90">{step.title}</h3>
                <p className="text-sm text-white/30">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Artist Value Proposition */}
      <section
        id="for-artists"
        ref={(el) => {
          sectionRefs.current["for-artists"] = el
        }}
        className="py-24 md:py-32 border-t border-white/[0.04] px-4 sm:px-6 relative overflow-hidden"
        style={{ contain: "layout style" }}
      >
        <div className="container relative max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div
              className={`duration-700 ${
                isVisible("for-artists") ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
              }`}
              style={{ transition: "opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)", willChange: isVisible("for-artists") ? "auto" : "opacity, transform" }}
            >
              <p className="text-xs tracking-[0.2em] text-white/30 uppercase mb-3">For Artists</p>
              <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight">
                Keep 100% of your earnings.
              </h2>

              <div className="space-y-6">
                {[
                  {
                    icon: Zap,
                    title: "Instant payments",
                    description: "Get paid per stream. No 90-day holds.",
                  },
                  {
                    icon: BarChart3,
                    title: "On-chain royalties",
                    description: "Transparent splits for every collaborator.",
                  },
                  {
                    icon: Wallet,
                    title: "Your wallet, your rules",
                    description: "No label. No middlemen.",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex gap-4 group">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-[#FF2A2A]/70" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-0.5 text-white/80">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-white/30">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button size="default" asChild className="mt-8">
                <Link href="/dashboard">Start Earning</Link>
              </Button>
            </div>

            <div
              className={`transition-all duration-700 delay-200 ${
                isVisible("for-artists") ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
              }`}
            >
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 relative overflow-hidden">
                <div className="aspect-square rounded-xl bg-white/[0.02] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-[#FF2A2A]/40 mx-auto mb-4" />
                    <p className="text-sm text-white/30">Real-time earnings</p>
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
        className="py-24 md:py-32 border-t border-white/[0.04] px-4 sm:px-6"
        style={{ contain: "layout style" }}
      >
        <div className="container max-w-4xl mx-auto">
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible("for-fans") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-xs tracking-[0.2em] text-white/30 uppercase mb-4">For Fans</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Stream music. Pay artists.</h2>
            <p className="text-base text-white/40 max-w-md mx-auto">
              No subscriptions. No ads. Just direct support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Coins,
                title: "Pay as you listen",
                description: "Only pay for what you play.",
                delay: "100ms",
              },
              {
                icon: Heart,
                title: "Support directly",
                description: "100% goes to creators.",
                delay: "200ms",
              },
              {
                icon: Award,
                title: "Own music NFTs",
                description: "Collect and resell editions.",
                delay: "300ms",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`bg-white/[0.02] border border-white/[0.06] p-6 rounded-xl transition-all duration-500 hover:border-white/10 ${
                  isVisible("for-fans") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: feature.delay, willChange: isVisible("for-fans") ? "auto" : "transform, opacity" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06] mb-4">
                  <feature.icon className="h-5 w-5 text-[#FF2A2A]/70" />
                </div>
                <h3 className="text-base font-medium mb-1 text-white/80">{feature.title}</h3>
                <p className="text-sm text-white/30">{feature.description}</p>
              </div>
            ))}
          </div>

          <div
            className={`text-center mt-12 transition-all duration-700 delay-400 ${
              isVisible("for-fans") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Button size="default" asChild>
              <Link href="/explore">Start Listening</Link>
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
        className="py-32 border-t border-white/5 px-4 sm:px-6 bg-black"
        style={{ contain: "layout style" }}
      >
        <div className="container">
          <div
            className={`mx-auto max-w-3xl text-center mb-16 transition-all duration-700 ${
              isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Built for the Open Internet</h2>
            <p className="text-base text-white/40">Every creator can earn instantly and globally.</p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: CheckCircle2, label: "Instant Payments", delay: "100ms" },
              { icon: Shield, label: "Verified Contracts", delay: "200ms" },
              { icon: Lock, label: "Non-Custodial", delay: "300ms" },
              { icon: Globe, label: "Permissionless", delay: "400ms" },
            ].map((badge, index) => (
              <div
                key={index}
                className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-6 text-center transition-all duration-500 hover:border-white/10 ${
                  isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: badge.delay, willChange: isVisible("trust") ? "auto" : "transform, opacity" }}
              >
                <badge.icon className="h-6 w-6 text-[#FF2A2A]/60 mx-auto mb-3" />
                <p className="text-sm text-white/60">{badge.label}</p>
              </div>
            ))}
          </div>

          {/* Partner Logos */}
          <div
            className={`text-center mt-16 transition-all duration-700 delay-500 ${
              isVisible("trust") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <p className="text-xs text-white/30 mb-6 uppercase tracking-[0.2em]">Powered by</p>
            <div className="flex flex-wrap justify-center gap-10 items-center">
              <span className="text-xl font-semibold text-white/20">Base</span>
              <span className="text-xl font-semibold text-white/20">Coinbase</span>
              <span className="text-xl font-semibold text-white/20">OpenZeppelin</span>
              <span className="text-xl font-semibold text-white/20">Zora</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="community"
        ref={(el) => {
          sectionRefs.current["community"] = el
        }}
        className="py-32 border-t border-white/5 px-4 sm:px-6 bg-black"
        style={{ contain: "layout style" }}
      >
        <div className="container">
          <div
            className={`max-w-2xl mx-auto text-center transition-all duration-700 ${
              isVisible("community") ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Join the Movement</h2>
            <p className="text-base text-white/40 mb-10">Be part of the on-chain music revolution.</p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              {[
                { icon: Twitter, label: "X", href: "https://x.com/usic_labs" },
                { icon: MessageCircle, label: "Telegram", href: "https://t.me/usicoincommunity" },
                { icon: Users, label: "Discord", href: "https://discord.gg/usimusic" },
              ].map((social, index) => (
                <Button
                  key={index}
                  size="default"
                  variant="outline"
                  asChild
                >
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <social.icon className="h-4 w-4" />
                    {social.label}
                  </a>
                </Button>
              ))}
            </div>

            <div className="max-w-sm mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-sm focus:outline-none focus:border-[#FF2A2A]/50 transition-colors"
                />
                <Button size="default">
                  Join
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 bg-black">
        <div className="container max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-[#FF2A2A]" />
              <span className="font-semibold">USI</span>
            </div>
            <div className="flex gap-6">
              {[
                { label: "Explore", href: "/explore" },
                { label: "Create", href: "/create" },
                { label: "Docs", href: "/docs" },
              ].map((link, index) => (
                <Link key={index} href={link.href} className="text-sm text-white/40 hover:text-white transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-xs text-white/30">
              Built on Base
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
