'use client'

import Link from 'next/link'
import { Radio, TrendingUp, BarChart3, Clock, Zap, Eye, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'

export default function AutoStreamPage() {
  const { isConnected } = useAccount()

  const features = [
    {
      icon: <Clock className="h-8 w-8" />,
      title: "24/7 Streaming",
      description: "Generate revenue automatically, even while you sleep"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Revenue Tracking",
      description: "Real-time earnings dashboard showing all stream data and payouts"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics & Insights",
      description: "Detailed analytics on streams, listeners, and earnings patterns"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Smart Queueing",
      description: "Intelligent playlist management to maximize stream revenue"
    },
    {
      icon: <Eye className="h-8 w-8" />,
      title: "Listener Simulation",
      description: "Realistic streaming patterns that boost track visibility"
    },
    {
      icon: <Radio className="h-8 w-8" />,
      title: "Multi-Track Support",
      description: "Stream multiple tracks simultaneously for increased earnings"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
      {/* Background animated elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-green-500 opacity-5 blur-3xl rounded-full animate-pulse-slow" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-emerald-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-teal-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <div className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/agents" className="text-white/80 hover:text-white transition-colors">
              ← Back to Agents
            </Link>
            <span className="text-sm text-white/60">Auto Stream</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 animate-fade-in">
            <Radio className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white/80">Revenue Agent</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 bg-clip-text text-transparent animate-slide-up">
            Auto Stream
          </h1>

          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-4 animate-slide-up animation-delay-2000">
            Generate passive income by streaming music 24/7. Watch your earnings grow automatically.
          </p>

          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8 animate-slide-up animation-delay-4000">
            Auto Stream manages your music queue, optimizes streaming patterns, and tracks all earnings in real-time with detailed analytics.
          </p>

          {!isConnected && (
            <div className="animate-fade-in animation-delay-6000">
              <Link href="/">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  <Sparkles className="w-5 h-5" />
                  Connect Wallet to Start
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Passive Income Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 hover:border-green-500/50 cursor-pointer"
              >
                <div className="text-green-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/60 group-hover:text-white/80 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            How Auto Stream Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                step: "1",
                title: "Upload Your Tracks",
                description: "Add your music to your profile and set up your streaming queue"
              },
              {
                step: "2",
                title: "Agent Streams 24/7",
                description: "Auto Stream automatically streams your tracks with intelligent spacing and patterns"
              },
              {
                step: "3",
                title: "Earn Revenue",
                description: "Collect streaming revenue and royalties from every stream automatically"
              },
              {
                step: "4",
                title: "Track & Optimize",
                description: "Monitor real-time earnings and analytics to understand your revenue streams"
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-white/60">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
              <p className="text-white/60">Non-Stop Streaming</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-green-400 mb-2">100%</div>
              <p className="text-white/60">Passive Income</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-green-400 mb-2">Live</div>
              <p className="text-white/60">Earnings Dashboard</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20 py-12 rounded-2xl border border-white/10 bg-gradient-to-r from-green-600/10 to-emerald-600/10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Earning Passive Income Today
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Connect your wallet to Auto Stream and let the agent handle your music streaming while you earn revenue 24/7.
          </p>
          {!isConnected && (
            <Link href="/">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Connect Wallet Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {isConnected && (
            <Link href="/dashboard/agent/auto-stream">
              <Button size="lg" className="gap-2">
                Open Auto Stream
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-white/60">
            <p>Auto Stream • Revenue Agent • Powered by USI Music Protocol</p>
          </div>
        </div>
      </div>
    </div>
  )
}
