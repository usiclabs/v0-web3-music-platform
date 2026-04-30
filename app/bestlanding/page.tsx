'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Music, Zap, Shield, Users, TrendingUp, Github, Twitter, Linkedin, Mail } from 'lucide-react'
import { useState } from 'react'

// Hero Section
function HeroSection() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-20">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#ff3b30]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[600px] h-[600px] bg-[#ff3b30]/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(255,59,48,0.1)] border border-[#ff3b30]/20"
            >
              <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
              <span className="text-xs text-[#9ca3af] font-medium">Now Live: Agent-Powered Music Economy</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-white text-balance leading-tight"
            >
              The future of music
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ef2b24]">
                is autonomous.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-[#9ca3af] max-w-md leading-relaxed"
            >
              Meet OpenClaw: autonomous agents powering creation, distribution, and monetization for the next generation of artists. Own your music economy.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <button className="group px-8 py-4 bg-[#ff3b30] text-white rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff3b30]/30 hover:scale-105">
                Get Started
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="px-8 py-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg font-semibold text-base hover:bg-[rgba(255,255,255,0.12)] transition-all duration-300">
                Watch Demo
              </button>
            </motion.div>

            {/* Trust Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex items-center gap-4 pt-4"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ef2b24] border-2 border-[#0a0a0a] flex items-center justify-center text-white text-xs font-bold"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="text-white font-semibold">Trusted by 5000+ artists</p>
                <p className="text-[#9ca3af] text-xs">Building the future together</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] md:h-[600px] hidden lg:flex items-center justify-center"
          >
            {/* Animated gradient card */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ff3b30]/10 via-transparent to-[#ff3b30]/5 border border-[rgba(255,59,48,0.1)]" />

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-20 left-1/4 w-32 h-32 bg-[#ff3b30]/10 rounded-2xl blur-xl"
            />
            <motion.div
              animate={{ y: [0, 20, 0], x: [0, 10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute bottom-20 right-1/4 w-40 h-40 bg-[#ff3b30]/5 rounded-3xl blur-2xl"
            />

            {/* Central content */}
            <div className="relative z-10 text-center space-y-6 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff3b30] to-[#ef2b24] text-white mb-4">
                <Music className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">Agent Activity Dashboard</h3>
              <p className="text-sm text-[#9ca3af]">Real-time autonomous agent coordination</p>
            </div>
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
      title: 'Lightning Fast Distribution',
      description: 'Deploy your music across 100+ platforms instantly with autonomous agents handling all logistics.',
      color: '#ff3b30'
    },
    {
      icon: Shield,
      title: 'True Ownership',
      description: 'Maintain 100% control of your music with blockchain-verified ownership and transparent royalty tracking.',
      color: '#22c55e'
    },
    {
      icon: TrendingUp,
      title: 'Intelligent Monetization',
      description: 'Autonomous agents optimize your revenue streams across streaming, licensing, and direct fan support.',
      color: '#3b82f6'
    },
    {
      icon: Users,
      title: 'Community Powered',
      description: 'Engage directly with fans through tokenized communities and real-time collaboration tools.',
      color: '#f59e0b'
    },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Powerful features for modern artists
          </h2>
          <p className="text-lg text-[#9ca3af] max-w-2xl mx-auto">
            Everything you need to build a sustainable music career in the age of AI
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative p-8 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)]"
            >
              {/* Glow effect */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none -z-10"
                style={{ backgroundColor: `${feature.color}20` }}
              />

              {/* Icon */}
              <div
                className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-6 transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: `${feature.color}20` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "MyUSIC revolutionized how I distribute my music. The autonomy and control are unmatched.",
      author: "Alex Chen",
      role: "Independent Producer",
      avatar: "AC"
    },
    {
      quote: "Finally, a platform built by artists for artists. The transparency is refreshing.",
      author: "Sarah Williams",
      role: "Singer-Songwriter",
      avatar: "SW"
    },
    {
      quote: "The agent system handles everything. I focus on creating, not admin work.",
      author: "Marcus Johnson",
      role: "Electronic Artist",
      avatar: "MJ"
    },
  ]

  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-balance">
            Loved by artists worldwide
          </h2>
          <p className="text-lg text-[#9ca3af]">
            See what musicians are saying about their MyUSIC experience
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)]"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="text-[#ff3b30]">★</div>
                ))}
              </div>

              {/* Quote */}
              <p className="text-white mb-6 leading-relaxed">"{testimonial.quote}"</p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ef2b24] flex items-center justify-center text-white text-sm font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{testimonial.author}</p>
                  <p className="text-xs text-[#9ca3af]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 md:py-32 border-t border-[rgba(255,255,255,0.05)]">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="relative rounded-3xl p-12 md:p-16 bg-gradient-to-r from-[#ff3b30]/10 via-transparent to-[#ff3b30]/5 border border-[rgba(255,59,48,0.2)]"
        >
          {/* Animated background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff3b30]/5 rounded-full blur-3xl -z-10" />

          <div className="text-center max-w-2xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 text-balance">
              Ready to take control?
            </h2>
            <p className="text-lg text-[#9ca3af] mb-8">
              Join thousands of artists already building their future with MyUSIC and OpenClaw agents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-8 py-4 bg-[#ff3b30] text-white rounded-lg font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff3b30]/30 hover:scale-105">
                Start Your Journey
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button className="px-8 py-4 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] text-white rounded-lg font-semibold text-base hover:bg-[rgba(255,255,255,0.12)] transition-all duration-300">
                Schedule Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Footer
function Footer() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Security', 'Enterprise'],
    Company: ['About', 'Blog', 'Careers', 'Press'],
    Resources: ['Documentation', 'API Docs', 'Community', 'Support'],
    Legal: ['Privacy', 'Terms', 'Cookie Policy', 'Compliance'],
  }

  const socialLinks = [
    { icon: Twitter, href: '#' },
    { icon: Github, href: '#' },
    { icon: Linkedin, href: '#' },
    { icon: Mail, href: '#' },
  ]

  return (
    <footer className="border-t border-[rgba(255,255,255,0.05)] bg-[rgba(10,10,10,0.3)]">
      <div className="container mx-auto px-4 py-16">
        {/* Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-bold text-white mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-xs text-[#9ca3af] hover:text-white transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[rgba(255,255,255,0.05)] pt-8 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Copyright */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold text-white mb-1">MyUSIC</h3>
            <p className="text-xs text-[#9ca3af]">© 2026 MyUSIC. All rights reserved.</p>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ icon: Icon, href }, index) => (
              <a
                key={index}
                href={href}
                className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[#9ca3af] hover:text-white hover:border-[rgba(255,255,255,0.15)] transition-all duration-300"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
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
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  )
}
