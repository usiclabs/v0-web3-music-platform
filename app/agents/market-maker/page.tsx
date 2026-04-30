'use client'

import Link from 'next/link'
import { Zap, TrendingUp, Percent, Zap as LiquidityIcon, BarChart3, Gauge, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAccount } from 'wagmi'

export default function MarketMakerPage() {
  const { isConnected } = useAccount()

  const features = [
    {
      icon: <LiquidityIcon className="h-8 w-8" />,
      title: "Multi-Pool Management",
      description: "Manage liquidity positions across multiple $USI token pools simultaneously"
    },
    {
      icon: <Percent className="h-8 w-8" />,
      title: "Fee Optimization",
      description: "Automatically optimize your positions to maximize trading fee earnings"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "Smart Rebalancing",
      description: "Automatic rebalancing based on market conditions and price movements"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Performance Analytics",
      description: "Track APY, fees earned, and portfolio performance with detailed metrics"
    },
    {
      icon: <Gauge className="h-8 w-8" />,
      title: "Risk Controls",
      description: "Built-in safeguards and parameters to manage exposure and slippage"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Multi-Chain Support",
      description: "Operate across multiple blockchain networks for maximum liquidity"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black overflow-hidden">
      {/* Background animated elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 -left-32 w-96 h-96 bg-blue-500 opacity-5 blur-3xl rounded-full animate-pulse-slow" />
        <div className="absolute top-40 -right-32 w-96 h-96 bg-cyan-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-teal-500 opacity-5 blur-3xl rounded-full animate-pulse-slow animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <div className="border-b border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/agents" className="text-white/80 hover:text-white transition-colors">
              ← Back to Agents
            </Link>
            <span className="text-sm text-white/60">Market Maker</span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="pt-20 px-4 sm:px-6 lg:px-8 mb-16 text-center">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/5 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10 animate-fade-in">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white/80">Liquidity Agent</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent animate-slide-up">
            Market Maker
          </h1>

          <p className="text-xl sm:text-2xl text-white/60 max-w-3xl mx-auto mb-4 animate-slide-up animation-delay-2000">
            Earn passive income by providing liquidity. Automatically optimize your positions for maximum fee earnings.
          </p>

          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-8 animate-slide-up animation-delay-4000">
            Market Maker handles complex liquidity management, rebalancing, and fee optimization across multiple pools without any manual intervention.
          </p>

          {!isConnected && (
            <div className="animate-fade-in animation-delay-6000">
              <Link href="/">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
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
            Advanced Liquidity Features
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 hover:border-blue-500/50 cursor-pointer"
              >
                <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300">
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
            How Market Maker Works
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                step: "1",
                title: "Deposit Capital",
                description: "Provide liquidity to $USI token pools and set your risk parameters"
              },
              {
                step: "2",
                title: "Automatic Optimization",
                description: "Agent continuously monitors markets and rebalances positions for optimal fee earning"
              },
              {
                step: "3",
                title: "Earn Trading Fees",
                description: "Collect trading fees automatically as your liquidity is used by other traders"
              },
              {
                step: "4",
                title: "Monitor & Withdraw",
                description: "Track earnings, yields, and withdraw whenever you want with full transparency"
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
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
              <div className="text-4xl font-bold text-blue-400 mb-2">Multi-Pool</div>
              <p className="text-white/60">Concurrent Management</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-blue-400 mb-2">Auto</div>
              <p className="text-white/60">Rebalancing</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
              <div className="text-4xl font-bold text-blue-400 mb-2">Real-time</div>
              <p className="text-white/60">Fee Tracking</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 mb-20 py-12 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Earning Passive Income
          </h2>
          <p className="text-white/60 mb-8 max-w-2xl mx-auto">
            Connect your wallet to Market Maker and let AI handle your liquidity management while you earn trading fees automatically.
          </p>
          {!isConnected && (
            <Link href="/">
              <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Connect Wallet Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
          {isConnected && (
            <Link href="/dashboard/agent/mm">
              <Button size="lg" className="gap-2">
                Open Market Maker
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 backdrop-blur-xl bg-black/40">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center text-white/60">
            <p>Market Maker • Liquidity Agent • Powered by USI Music Protocol</p>
          </div>
        </div>
      </div>
    </div>
  )
}
