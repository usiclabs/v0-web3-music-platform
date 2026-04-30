'use client'

import Link from 'next/link'
import { Music, Sparkles as SparklesIcon, Radio, Zap, Mic, Upload, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'

export default function AutonomousArtistPage() {
  const { isConnected } = useAccount()

  const features = [
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: "AI Music Generation",
      description: "Generate unique, original music using advanced AI models trained on diverse genres"
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: "Auto-Upload",
      description: "Automatically upload generated tracks to the platform with metadata"
    },
    {
      icon: <Music className="h-8 w-8" />,
      title: "Style Control",
      description: "Define your musical style, genre preferences, and creative parameters"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Batch Generation",
      description: "Generate multiple tracks in parallel for faster content creation"
    },
    {
      icon: <Mic className="h-8 w-8" />,
      title: "Vocal Synthesis",
      description: "Optional AI vocals to complement your generated instrumental tracks"
    },
    {
      icon: <Radio className="h-8 w-8" />,
      title: "Continuous Creation",
      description: "Schedule regular generation cycles to maintain a growing catalog"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
      {/* Background animated elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-pink-500 opacity-5 blur-3xl rounded-full animate-pulse-slow" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-rose-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-fuchsia-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <div className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/agents" className="text-white/80 hover:text-white transition-colors">
              ← Back to Agents
            </Link>
            <span className="text-sm text-white/60">Autonomous Artist</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 animate-fade-in">
            <Music className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-white/80">Music Creator Agent</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-300 bg-clip-text text-transparent animate-slide-up">
            Autonomous Artist
          </h1>

          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-4 animate-slide-up animation-delay-2000">
            Your AI-powered music producer. Generate unique music and automatically list it on the platform.
          </p>

          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8 animate-slide-up animation-delay-4000">
            Autonomous Artist creates original tracks, manages metadata, and handles uploads automatically - no music production skills required.
          </p>

          {!isConnected && (
            <div className="animate-fade-in animation-delay-6000">
              <Link href="/">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
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
            Creative Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 hover:border-pink-500/50 cursor-pointer"
              >
                <div className="text-pink-400 mb-4 group-hover:scale-110 transition-transform duration-300">
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
            How Autonomous Artist Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                step: "1",
                title: "Define Your Style",
                description: "Set your musical preferences, genres, tempo, mood, and any specific creative parameters"
              },
              {
                step: "2",
                title: "Agent Generates Music",
                description: "Autonomous Artist creates original tracks based on your creative direction"
              },
              {
                step: "3",
                title: "Auto-Upload & Publish",
                description: "Generated tracks are automatically uploaded with metadata and published to the platform"
              },
              {
                step: "4",
                title: "Track & Monetize",
                description: "Monitor your AI-created music's performance and earnings in real-time"
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold">
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
              <div className="text-4xl font-bold text-pink-400 mb-2">AI</div>
              <p className="text-white/60">Powered Creation</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-pink-400 mb-2">∞</div>
              <p className="text-white/60">Unlimited Tracks</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-pink-400 mb-2">Auto</div>
              <p className="text-white/60">Publishing</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20 py-12 rounded-2xl border border-white/10 bg-gradient-to-r from-pink-600/10 to-rose-600/10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Become an AI Music Producer
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Connect your wallet to Autonomous Artist and start generating original music that will be automatically published and monetized.
          </p>
          {!isConnected && (
            <Link href="/">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700">
                Connect Wallet Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {isConnected && (
            <Link href="/dashboard/agent/autonomous-artist">
              <Button size="lg" className="gap-2">
                Open Autonomous Artist
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-white/60">
            <p>Autonomous Artist • Music Creator Agent • Powered by USI Music Protocol</p>
          </div>
        </div>
      </div>
    </div>
  )
}
