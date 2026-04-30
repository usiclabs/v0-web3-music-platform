'use client'

import Link from 'next/link'
import { TrendingUp, Zap, BarChart3, Target, Lightbulb, Shield, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'

export default function BeatScoutPage() {
  const { isConnected } = useAccount()

  const features = [
    {
      icon: <Target className="h-8 w-8" />,
      title: "Smart Filtering",
      description: "Set your investment criteria and let the agent scan for matches"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics Dashboard",
      description: "Real-time tracking of your investments and portfolio performance"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Auto-Invest",
      description: "Automatically invest in tracks matching your parameters 24/7"
    },
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Signal Detection",
      description: "Advanced algorithms identify high-potential music drops"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Risk Management",
      description: "Built-in safeguards to protect your investment capital"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Growth Tracking",
      description: "Monitor returns and portfolio growth over time"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
      {/* Background animated elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-violet-500 opacity-5 blur-3xl rounded-full animate-pulse-slow" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-blue-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <div className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/agents" className="text-white/80 hover:text-white transition-colors">
              ← Back to Agents
            </Link>
            <span className="text-sm text-white/60">Beat Scout</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 animate-fade-in">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-medium text-white/80">Investment Agent</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-violet-400 via-purple-400 to-violet-300 bg-clip-text text-transparent animate-slide-up">
            Beat Scout
          </h1>

          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-4 animate-slide-up animation-delay-2000">
            Your autonomous venture capital for music. Scan, analyze, and automatically invest in promising music drops.
          </p>

          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8 animate-slide-up animation-delay-4000">
            Beat Scout uses advanced algorithms to identify high-potential music tracks and automatically executes investments based on your criteria.
          </p>

          {!isConnected && (
            <div className="animate-fade-in animation-delay-6000">
              <Link href="/">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
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
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 hover:border-violet-500/50 cursor-pointer"
              >
                <div className="text-violet-400 mb-4 group-hover:scale-110 transition-transform duration-300">
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
            How Beat Scout Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                step: "1",
                title: "Define Your Criteria",
                description: "Set investment parameters like genre, artist profile, funding limits, and risk tolerance"
              },
              {
                step: "2",
                title: "Agent Monitors Platform",
                description: "Beat Scout continuously scans new music drops 24/7 against your criteria"
              },
              {
                step: "3",
                title: "Auto-Execute Investments",
                description: "When matches are found, the agent automatically executes investments on your behalf"
              },
              {
                step: "4",
                title: "Track & Optimize",
                description: "Monitor your portfolio performance and returns in real-time with detailed analytics"
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
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
              <div className="text-4xl font-bold text-violet-400 mb-2">24/7</div>
              <p className="text-white/60">Always Monitoring</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-violet-400 mb-2">100%</div>
              <p className="text-white/60">Automated</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-violet-400 mb-2">Real-time</div>
              <p className="text-white/60">Analytics</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20 py-12 rounded-2xl border border-white/10 bg-gradient-to-r from-violet-600/10 to-purple-600/10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Investing Smarter?
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Connect your wallet to access Beat Scout and start building your music investment portfolio with AI-powered insights.
          </p>
          {!isConnected && (
            <Link href="/">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                Connect Wallet Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {isConnected && (
            <Link href="/dashboard/agent">
              <Button size="lg" className="gap-2">
                Open Beat Scout
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-white/60">
            <p>Beat Scout • X402 Investment Agent • Powered by USI Music Protocol</p>
          </div>
        </div>
      </div>
    </div>
  )
}
