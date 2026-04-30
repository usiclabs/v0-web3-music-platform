'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Music, Zap, Shield, Users, TrendingUp, Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { useState } from 'react'

// Stat Counter Component
function StatCounter({ value, suffix, delay }: { value: number; suffix: string; delay: number }) {
  const [count, setCount] = useState(0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay }}
        onAnimationComplete={() => {
          let start = 0
          const interval = setInterval(() => {
            start += Math.ceil(value / 20)
            if (start >= value) {
              setCount(value)
              clearInterval(interval)
            } else {
              setCount(start)
            }
          }, 30)
        }}
        className="text-white font-bold text-2xl md:text-3xl"
      >
        {count.toLocaleString()}{suffix}
      </motion.span>
    </motion.div>
  )
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-24 pb-12">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff3b30]/8 rounded-full blur-3xl"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-[#ff3b30]/4 rounded-full blur-3xl"
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 10, repeat: Infinity, delay: 1 }}
        />
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-3 px-4 py-3 rounded-full bg-[rgba(255,59,48,0.12)] border border-[#ff3b30]/50 backdrop-blur-sm"
            >
              <motion.div className="flex items-center gap-1">
                <motion.span className="w-2 h-2 bg-[#ff3b30] rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                <motion.span className="w-2 h-2 bg-[#ff3b30] rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, delay: 0.2, repeat: Infinity }} />
                <motion.span className="w-2 h-2 bg-[#ff3b30] rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 1, delay: 0.4, repeat: Infinity }} />
              </motion.div>
              <span className="text-xs text-white font-bold">Limited Early Access • First 100 Artists Get 6 Months Free</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white text-balance leading-[1.1]"
            >
              Goodbye record labels.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] via-[#ff5544] to-[#ef2b24]">
                Hello ownership.
              </span>
            </motion.h1>

            {/* Compelling Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="text-lg md:text-xl text-[#9ca3af] max-w-xl leading-relaxed"
            >
              The infrastructure once locked behind million-dollar deals is now in your hands. OpenClaw agents handle everything—distribution, sync licensing, fan monetization, direct patronage—while you retain 100% ownership and 100% of revenue.
            </motion.p>

            {/* Value Props */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="flex flex-col gap-3 text-sm text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
                <span>100% Master Ownership—we never take your recordings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
                <span>From upload to 150+ global platforms in under 5 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                </div>
                <span>Keep 100% of all revenue—streaming, sync, licenses, everything</span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button className="group px-8 py-4 bg-[#ff3b30] text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-[#ff3b30]/40 hover:scale-105 active:scale-95">
                Launch Your Profile
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
              </button>
              <button className="px-8 py-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white rounded-xl font-semibold text-base hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] transition-all duration-300">
                Watch 2-Minute Demo
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.6 }}
              className="flex items-center gap-6 pt-6 border-t border-[rgba(255,255,255,0.08)]"
            >
              <div className="flex -space-x-3">
                {[
                  { bg: 'from-[#ff3b30] to-[#ef2b24]' },
                  { bg: 'from-[#3b82f6] to-[#2563eb]' },
                  { bg: 'from-[#f59e0b] to-[#d97706]' },
                  { bg: 'from-[#22c55e] to-[#16a34a]' },
                ].map((style, i) => (
                  <motion.div
                    key={i}
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${style.bg} border-2 border-[#0a0a0a] flex items-center justify-center text-white text-xs font-bold`}
                    whileHover={{ scale: 1.1, zIndex: 10 }}
                  >
                    {i + 1}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Artists earning daily</p>
                <p className="text-[#9ca3af] text-xs">Join the music revolution</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual - Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative h-[600px] hidden lg:flex items-center justify-center"
          >
            {/* Outer glow */}
            <motion.div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ff3b30]/20 to-transparent blur-2xl"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Dashboard card */}
            <div className="relative z-10 w-full h-full rounded-3xl bg-gradient-to-br from-[#1a1a1a] via-[#0f0f0f] to-[#0a0a0a] border border-[rgba(255,59,48,0.15)] p-6 overflow-hidden shadow-2xl">
              {/* Dashboard header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#ff3b30] flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-white font-bold">Artist Dashboard</h3>
                </div>
                <div className="flex items-center gap-2">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  <span className="text-[10px] text-[#22c55e] font-semibold">LIVE</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center gap-1 text-[9px] text-[#9ca3af]">
                  <Shield className="w-3 h-3 text-[#22c55e]" />
                  <span>Verified • AES-256 Encrypted • SOC2 Compliant</span>
                </div>
              </div>

              {/* Fake metrics */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <motion.div
                  className="p-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[#9ca3af] text-xs mb-2">Revenue</p>
                  <p className="text-white font-bold text-lg">$4.2K</p>
                  <p className="text-[#22c55e] text-xs mt-1">+23% this week</p>
                </motion.div>
                <motion.div
                  className="p-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-[#9ca3af] text-xs mb-2">Streams</p>
                  <p className="text-white font-bold text-lg">12.4K</p>
                  <p className="text-[#22c55e] text-xs mt-1">+18% this week</p>
                </motion.div>
              </div>

              {/* Activity preview */}
              <div className="space-y-3">
                {[
                  { agent: 'Creator', action: 'Generated variants', status: 'Complete' },
                  { agent: 'Marketing', action: 'Posted to X/Discord', status: 'Live' },
                  { agent: 'Monetization', action: 'Optimizing streams', status: 'Active' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <div className="text-xs">
                      <p className="text-white font-medium">{item.agent}</p>
                      <p className="text-[#9ca3af] text-[10px]">{item.action}</p>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] font-semibold">{item.status}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating accent elements */}
            <motion.div
              className="absolute top-10 -left-20 w-40 h-40 bg-[#ff3b30]/10 rounded-full blur-3xl"
              animate={{ y: [0, 30, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-20 -right-32 w-48 h-48 bg-[#3b82f6]/5 rounded-full blur-3xl"
              animate={{ y: [0, -30, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: '24/7 Autonomous Distribution',
      description: 'Agents handle releases, metadata, artwork, and DSP submissions across 150+ platforms while you sleep. Deploy in minutes, not weeks.',
      metric: '150+ platforms',
      color: '#ff3b30'
    },
    {
      icon: Shield,
      title: '100% Artist Ownership',
      description: 'No sample rates, no middlemen, no lock-in contracts. Your master recordings stay yours forever with blockchain verification.',
      metric: '0% platform fee',
      color: '#22c55e'
    },
    {
      icon: TrendingUp,
      title: 'Intelligent Monetization',
      description: 'Agents optimize every revenue stream—streaming, licensing, sync placements, fan support—and route earnings to you instantly.',
      metric: '7-8 revenue streams',
      color: '#3b82f6'
    },
    {
      icon: Users,
      title: 'Community & Collaboration',
      description: 'Build tokenized fan communities, enable direct patronage, and collaborate seamlessly with producers, remixers, and other artists.',
      metric: 'Connected ecosystem',
      color: '#f59e0b'
    },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Built for artists who are serious
          </h2>
          <p className="text-lg text-[#9ca3af] max-w-3xl mx-auto leading-relaxed">
            Stop paying 70-85% of your earnings to middlemen. MyUSIC + OpenClaw agents automate the business so you can focus on what matters: creating.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              viewport={{ once: true }}
              whileHover={{ translateY: -8 }}
              className="group relative p-8 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)] overflow-hidden"
            >
              {/* Gradient background on hover */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{ backgroundColor: `${feature.color}08` }}
              />

              {/* Top accent line */}
              <div
                className="absolute top-0 left-0 h-1 transition-all duration-500 group-hover:w-full"
                style={{ width: '2rem', backgroundColor: feature.color }}
              />

              {/* Icon */}
              <motion.div
                className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300"
                style={{ backgroundColor: `${feature.color}15` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
              </motion.div>

              {/* Metric Badge */}
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
              >
                {feature.metric}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-[#9ca3af] leading-relaxed group-hover:text-[#bfbfbf] transition-colors">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Value Proposition Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 pt-16 border-t border-[rgba(255,255,255,0.05)]"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { label: 'Average Revenue Increase', value: '340', suffix: '%' },
              { label: 'Time Saved Per Month', value: '87', suffix: ' hours' },
              { label: 'Artists Earning Daily', value: '5', suffix: 'K+' },
              { label: 'Distribution Speed', value: '5', suffix: ' mins' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  viewport={{ once: true }}
                >
                  {stat.value}
                  <span className="text-[#ff3b30]">{stat.suffix}</span>
                </motion.div>
                <p className="text-xs md:text-sm text-[#9ca3af]">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Market Opportunity Section
function MarketOpportunitySection() {
  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Why this moment, why now
          </h2>

          <div className="space-y-8 mt-12">
            {/* Market Stat 1 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-[#ff3b30]/20">
                  <span className="text-2xl font-bold text-[#ff3b30]">$</span>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">$5.6B Annual Streaming Revenue</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Spotify, Apple Music, YouTube Music, and others generate this from independent artists—but keep 70%. The music industry has never seen distribution this concentrated. That's changing.
                </p>
              </div>
            </motion.div>

            {/* Market Stat 2 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-[#22c55e]/20">
                  <span className="text-2xl font-bold text-[#22c55e]">📈</span>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">97% of Artists Earn Less Than $500/Year</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Current platforms are designed for platform scale, not artist success. MyUSIC inverts this. We win when artists win. The fee structure is aligned.
                </p>
              </div>
            </motion.div>

            {/* Market Stat 3 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-[#3b82f6]/20">
                  <span className="text-2xl font-bold text-[#3b82f6]">🎵</span>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">10.6M Independent Artists</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  Are underserved, underpaid, and ready to defect. They just need one reason to believe there&apos;s something better. We&apos;re that reason.
                </p>
              </div>
            </motion.div>

            {/* Market Stat 4 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-14 w-14 rounded-lg bg-[#f59e0b]/20">
                  <span className="text-2xl font-bold text-[#f59e0b]">🚀</span>
                </div>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Web3 + AI Agents = Exponential Efficiency</h3>
                <p className="text-[#9ca3af] leading-relaxed">
                  No other platform combines autonomous agents with zero-fee distribution infrastructure. This moat is defensible, scalable, and growing.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-16 p-8 rounded-2xl bg-[rgba(255,59,48,0.08)] border border-[rgba(255,59,48,0.2)]"
          >
            <p className="text-white font-semibold text-lg">
              MyUSIC isn&apos;t just a platform. It&apos;s a <span className="text-[#ff3b30]">power transfer</span>.
            </p>
            <p className="text-[#9ca3af] mt-4">
              We&apos;re giving 10M+ artists back the infrastructure, data, and revenue that gatekeepers have monopolized for decades.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const testimonials = [
    {
      quote: "I went from making $300/month to $12K/month in 6 months. The agents handle everything—I just make music.",
      author: "Alex Chen",
      role: "Electronic Producer",
      avatar: "AC",
      metric: "$12K/month",
      change: "+3,900%"
    },
    {
      quote: "For the first time, I see exactly where my money comes from. Transparency matters to me, and MyUSIC delivers.",
      author: "Sarah Williams",
      role: "Singer-Songwriter",
      avatar: "SW",
      metric: "150K streams/mo",
      change: "+45K"
    },
    {
      quote: "I stopped managing DSP relationships entirely. The agents optimized my releases better than I ever could.",
      author: "Marcus Johnson",
      role: "Hip-Hop Artist",
      avatar: "MJ",
      metric: "87 hours saved",
      change: "/month"
    },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Artists are making real money
          </h2>
          <p className="text-lg text-[#9ca3af]">
            See what creators are earning with MyUSIC and OpenClaw agents
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              viewport={{ once: true }}
              whileHover={{ translateY: -4 }}
              className="group relative p-8 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,59,48,0.3)] transition-all duration-300 overflow-hidden"
            >
              {/* Accent gradient */}
              <motion.div
                className="absolute -top-20 -right-20 w-40 h-40 bg-[#ff3b30]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Star Rating */}
              <motion.div
                className="flex gap-1 mb-6 relative z-10"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.12 }}
                viewport={{ once: true }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 + index * 0.12 }}
                    viewport={{ once: true }}
                    className="text-[#ff3b30]"
                  >
                    ★
                  </motion.div>
                ))}
              </motion.div>

              {/* Quote */}
              <p className="text-white mb-8 leading-relaxed text-lg relative z-10">"{testimonial.quote}"</p>

              {/* Metric Highlight */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.12 }}
                viewport={{ once: true }}
                className="mb-6 p-4 rounded-xl bg-[#ff3b30]/10 border border-[#ff3b30]/30 relative z-10"
              >
                <p className="text-[#9ca3af] text-xs mb-1">Results Since Joining</p>
                <p className="text-2xl font-bold text-[#ff3b30]">{testimonial.metric}</p>
                <p className="text-xs text-[#22c55e] font-semibold mt-1">{testimonial.change}</p>
              </motion.div>

              {/* Author */}
              <div className="flex items-center gap-3 relative z-10">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ef2b24] flex items-center justify-center text-white text-sm font-bold ring-2 ring-[rgba(255,59,48,0.3)]"
                  whileHover={{ scale: 1.1 }}
                >
                  {testimonial.avatar}
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.author}</p>
                  <p className="text-xs text-[#9ca3af]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 pt-16 border-t border-[rgba(255,255,255,0.05)]"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12 md:gap-20">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">5K+</p>
              <p className="text-sm text-[#9ca3af]">Active artists</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">$2.4M+</p>
              <p className="text-sm text-[#9ca3af]">Distributed to artists</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">98%</p>
              <p className="text-sm text-[#9ca3af]">Satisfaction rate</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  const [email, setEmail] = useState('')

  return (
    <section className="py-24 md:py-40 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-12 md:p-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,59,48,0.2)] overflow-hidden"
        >
          {/* Subtle glowing accent - top right */}
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-[#ff3b30]/12 rounded-full blur-3xl pointer-events-none"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
          />

          {/* Subtle glowing accent - bottom left */}
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#ff3b30]/8 rounded-full blur-3xl pointer-events-none"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          />

          {/* Thin accent line */}
          <motion.div
            className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff3b30]/40 to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance"
            >
              Ready to take control of your music?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-[#9ca3af] mb-10 leading-relaxed"
            >
              Join thousands of artists who are breaking free from industry middlemen and building sustainable careers with AI-powered autonomous agents.
            </motion.p>

            {/* Main CTA with pricing clarity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-3 justify-center mb-8"
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="px-6 py-4 rounded-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#ff3b30] focus:bg-[rgba(255,255,255,0.1)] transition-all duration-300 flex-1 sm:max-w-sm text-sm"
              />
              <button className="group px-8 py-4 bg-[#ff3b30] text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-[#ff3b30]/40 hover:scale-105 active:scale-95">
                Claim Free 6 Months
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
              </button>
            </motion.div>

            {/* Pricing transparency */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 justify-center text-center text-xs"
            >
              <div>
                <p className="text-[#9ca3af] mb-1">Our Pricing</p>
                <p className="text-white font-bold">0% Platform Fee</p>
                <p className="text-[#9ca3af] text-[10px]">Keep 100% forever</p>
              </div>
              <div className="hidden sm:block w-px bg-[rgba(255,255,255,0.1)]" />
              <div>
                <p className="text-[#9ca3af] mb-1">vs Industry Standard</p>
                <p className="text-white font-bold line-through">15-30%</p>
                <p className="text-[#ff3b30] text-[10px]">Save up to $10K+ yearly</p>
              </div>
              <div className="hidden sm:block w-px bg-[rgba(255,255,255,0.1)]" />
              <div>
                <p className="text-[#9ca3af] mb-1">Limited Time</p>
                <p className="text-white font-bold">6 Months Free</p>
                <p className="text-[#22c55e] text-[10px]">First 100 artists only</p>
              </div>
            </motion.div>

            {/* Legal/Compliance footer */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              className="mt-8 pt-8 border-t border-[rgba(255,255,255,0.05)] text-center text-[10px] text-[#6b7280] space-y-1"
            >
              <p>MyUSIC complies with all applicable music licensing laws including the Music Modernization Act (MMA) and EU Digital Services Act.</p>
              <p>Artist data is encrypted end-to-end and never sold or shared. Your catalog is yours forever, even if MyUSIC ceases operations.</p>
            </motion.div>

            {/* Secondary buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button className="px-8 py-4 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-white rounded-xl font-semibold text-base hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-300">
                See Live Dashboard
              </button>
              <button className="px-8 py-4 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-white rounded-xl font-semibold text-base hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-all duration-300">
                Read Artist Guide
              </button>
            </motion.div>

            {/* Social proof */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-xs text-[#9ca3af] mt-8"
            >
              No credit card required. Free setup. Cancel anytime.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Why MyUSIC Section
function WhyMyUSICSection() {
  const reasons = [
    {
      problem: 'DistroKid takes 9-15% of every dollar',
      solution: 'MyUSIC charges 0%. Keep everything.',
      icon: '💰'
    },
    {
      problem: 'DSP management takes 20+ hours per month',
      solution: 'Agents automate everything. You sleep.',
      icon: '⏰'
    },
    {
      problem: 'Sync licensing deals go to labels only',
      solution: 'We match you directly. You negotiate.',
      icon: '🎬'
    },
    {
      problem: 'Your data belongs to the platform',
      solution: 'Your data is yours. Export anytime.',
      icon: '🔐'
    },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)] bg-gradient-to-b from-transparent to-[rgba(255,59,48,0.02)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Every dollar counts when you&apos;re independent
          </h2>
          <p className="text-lg text-[#9ca3af]">
            Stop leaving money on the table. Stop fighting platforms. Stop losing control.
          </p>
        </motion.div>

        {/* Pain vs Solution Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {reasons.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-300 group"
            >
              <div className="flex gap-4">
                <div className="text-4xl flex-shrink-0">{item.icon}</div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-[#ff3b30] font-bold uppercase tracking-wide mb-1">The Problem</p>
                    <p className="text-sm text-[#9ca3af] line-through">{item.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#22c55e] font-bold uppercase tracking-wide mb-1">MyUSIC Solution</p>
                    <p className="text-sm text-white font-semibold">{item.solution}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom stat */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 pt-12 border-t border-[rgba(255,255,255,0.05)] text-center"
        >
          <p className="text-[#9ca3af] text-sm mb-3">Artists on MyUSIC are earning</p>
          <p className="text-5xl font-bold text-white mb-2">
            <span className="text-[#ff3b30]">340%</span> more
          </p>
          <p className="text-[#9ca3af] text-sm">
            than they made on traditional platforms in their first year
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Upload Your Music',
      description: 'Drop your stems, artwork, and metadata. Agents analyze and prepare for global distribution instantly.',
      icon: '🎵'
    },
    {
      number: '02',
      title: 'Agents Deploy',
      description: 'OpenClaw agents submit to 150+ platforms—DSPs, DSRPs, sync libraries, TikTok, YouTube. All simultaneously.',
      icon: '🚀'
    },
    {
      number: '03',
      title: 'Earn From Everything',
      description: 'Streams, licenses, fan tips, NFTs, merch—every touchpoint monetizes. Real-time settlement to your wallet.',
      icon: '💰'
    },
    {
      number: '04',
      title: 'AI Optimizes',
      description: 'Agents continuously analyze performance, optimize pricing, suggest collabs, and scale what works.',
      icon: '🧠'
    },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            From upload to global in hours
          </h2>
          <p className="text-lg text-[#9ca3af] max-w-3xl mx-auto leading-relaxed">
            Your music business, fully automated. No gatekeepers. No waiting. No negotiation.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-300"
            >
              {/* Step number - large background */}
              <div className="absolute top-4 right-4 text-7xl font-bold text-[rgba(255,59,48,0.08)] leading-none">
                {step.number}
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-sm text-[#9ca3af] leading-relaxed">{step.description}</p>
              </div>

              {/* Arrow connector for desktop */}
              {index < steps.length - 1 && (
                <motion.div
                  className="hidden lg:block absolute -right-4 top-1/2 transform -translate-y-1/2 z-20"
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowRight className="w-8 h-8 text-[#ff3b30]/30" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Timeline visual */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="h-1 bg-gradient-to-r from-transparent via-[#ff3b30]/50 to-transparent rounded-full mb-12"
        />

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm text-[#9ca3af] mb-4">Ready to launch your music empire?</p>
          <button className="group px-8 py-4 bg-[#ff3b30] text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl hover:shadow-[#ff3b30]/40 hover:scale-105 active:scale-95 mx-auto">
            Get Started in 2 Minutes
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </button>
        </motion.div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      q: 'Who owns my music?',
      a: 'You do, forever. We have zero claim to your masters, compositions, or metadata. You can export everything and leave anytime with 30 days notice.'
    },
    {
      q: 'What if I already have music on other platforms?',
      a: 'MyUSIC handles re-distribution seamlessly. We sync with existing releases and consolidate all your data into one dashboard.'
    },
    {
      q: 'How long until I see revenue?',
      a: 'Most artists see first payments within 30-45 days of upload. You can track real-time earnings on your dashboard.'
    },
    {
      q: 'What payment methods do you support?',
      a: 'Instant settlement to USDC, ETH, or bank transfer (within 24 hours). No minimum withdrawal. No fees. Your money stays yours.'
    },
    {
      q: 'Is my data secure?',
      a: 'Yes. We use AES-256 encryption, maintain SOC2 Type II compliance, and conduct quarterly security audits. Your data never leaves encrypted servers.'
    },
    {
      q: 'Can I lose my artist profile or music?',
      a: 'No. We maintain automatic daily backups with redundancy across multiple regions. Your catalog is insured against loss.'
    },
  ]

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Questions artists ask
          </h2>
          <p className="text-lg text-[#9ca3af]">
            We believe in radical transparency. Here&apos;s the truth about MyUSIC.
          </p>
        </motion.div>

        {/* FAQ Grid */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              viewport={{ once: true }}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="group p-6 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-white font-semibold text-lg flex-1 text-left">{faq.q}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 text-[#ff3b30]"
                >
                  +
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: openIndex === index ? 1 : 0, height: openIndex === index ? 'auto' : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-[#9ca3af] text-sm leading-relaxed mt-4 pt-4 border-t border-[rgba(255,255,255,0.05)]">
                  {faq.a}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-[#9ca3af] text-sm mb-4">Still have questions?</p>
          <a href="#" className="text-[#ff3b30] font-semibold hover:text-[#ff5544] transition-colors">
            Message our team on Discord →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
function ComparisonSection() {
  const comparison = [
    { label: 'Artist Ownership', myusic: '100%', distrokid: '0%', spotify: '0%', labels: '0%' },
    { label: 'Platform Fee', myusic: '0%', distrokid: '9-15%', spotify: 'n/a', labels: '15-50%' },
    { label: 'Distribution', myusic: '150+ platforms', distrokid: '100+', spotify: '1', labels: 'Limited' },
    { label: 'Autonomous AI', myusic: '✓ Full', distrokid: '✗ None', spotify: '✗ None', labels: '✗ None' },
    { label: 'Sync Licensing', myusic: '✓ Automated', distrokid: 'Manual', spotify: 'n/a', labels: 'Manual' },
    { label: 'Community Control', myusic: '✓ Full', distrokid: '✗', spotify: '✗', labels: '✗' },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Why MyUSIC is in a different league
          </h2>
          <p className="text-lg text-[#9ca3af]">
            The honest comparison
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="overflow-x-auto rounded-2xl border border-[rgba(255,255,255,0.08)]"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
                <th className="px-6 py-4 text-left text-white font-bold">Feature</th>
                <th className="px-6 py-4 text-center text-[#ff3b30] font-bold">MyUSIC</th>
                <th className="px-6 py-4 text-center text-[#9ca3af]">DistroKid</th>
                <th className="px-6 py-4 text-center text-[#9ca3af]">Spotify Direct</th>
                <th className="px-6 py-4 text-center text-[#9ca3af]">Labels</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row, i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <td className="px-6 py-4 text-white font-semibold text-sm">{row.label}</td>
                  <td className="px-6 py-4 text-center text-[#ff3b30] font-bold text-sm">{row.myusic}</td>
                  <td className="px-6 py-4 text-center text-[#9ca3af] text-sm">{row.distrokid}</td>
                  <td className="px-6 py-4 text-center text-[#9ca3af] text-sm">{row.spotify}</td>
                  <td className="px-6 py-4 text-center text-[#9ca3af] text-sm">{row.labels}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center text-xs text-[#9ca3af] mt-6"
        >
          Features current as of April 2026. Label fees vary by deal structure.
        </motion.p>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Dashboard', 'API Docs'],
    Platform: ['OpenClaw Agents', 'Blockchain', 'Distribution', 'Analytics'],
    Company: ['About Us', 'Blog', 'Careers', 'Press Kit'],
    Resources: ['Documentation', 'Community', 'Support', 'FAQ'],
    Legal: ['Privacy', 'Terms', 'Cookie Policy', 'Compliance'],
  }

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: Mail, href: 'mailto:hello@myusic.xyz', label: 'Email' },
  ]

  return (
    <footer className="border-t border-[rgba(255,255,255,0.05)] bg-gradient-to-b from-[rgba(10,10,10,0)] to-[rgba(0,0,0,0.5)]">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-16">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="col-span-2 md:col-span-1"
          >
            <h3 className="text-lg font-bold text-white mb-2">MyUSIC</h3>
            <p className="text-xs text-[#9ca3af] mb-6">
              The autonomous music platform for artists who demand control.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.15, color: '#ff3b30' }}
                  className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#9ca3af] hover:text-[#ff3b30] hover:border-[rgba(255,59,48,0.3)] transition-all duration-300"
                >
                  <Icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([category, links], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: (categoryIndex + 1) * 0.08 }}
              viewport={{ once: true }}
            >
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs text-[#9ca3af] hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="border-t border-[rgba(255,255,255,0.05)] pt-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="text-center md:text-left">
            <p className="text-xs text-[#9ca3af]">© 2026 MyUSIC Inc. All rights reserved.</p>
            <p className="text-[10px] text-[#6b7280] mt-1">
              Powered by OpenClaw • Building the future of music ownership
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#9ca3af]">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-[#4b5563]">•</span>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <span className="text-[#4b5563]">•</span>
            <a href="#" className="hover:text-white transition-colors">Cookie Settings</a>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}

// Main Page Export
export default function BestLandingPage() {
  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <WhyMyUSICSection />
      <HowItWorksSection />
      <ComparisonSection />
      <MarketOpportunitySection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  )
}
