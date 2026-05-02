"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Wallet, Music, TrendingUp, Gift, Shield, Zap } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"

interface EmptyStateWalletConnectProps {
  title?: string
  description?: string
  ctaText?: string
  features?: Array<{
    icon: React.ReactNode
    title: string
    description: string
  }>
}

export function EmptyStateWalletConnect({
  title = "Connect Your Wallet",
  description = "Connect your wallet to start staking $USI tokens and earn rewards from platform fees.",
  ctaText = "Connect Wallet",
  features = [
    {
      icon: <Shield className="h-5 w-5 text-accent" />,
      title: "Secure",
      description: "Your assets stay protected",
    },
    {
      icon: <Zap className="h-5 w-5 text-accent" />,
      title: "Fast",
      description: "Quick connection in seconds",
    },
    {
      icon: <Gift className="h-5 w-5 text-accent" />,
      title: "Rewards",
      description: "Earn $USI and exclusive perks",
    },
  ],
}: EmptyStateWalletConnectProps) {
  const { connect } = useWallet()

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-background overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse-slow" style={{ animationDelay: "1s" }} />

      <div className="w-full max-w-2xl">
        {/* 3D Wallet Illustration Container */}
        <div className="relative flex items-center justify-center mb-12 h-80">
          {/* Glow background circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-80 h-80 bg-gradient-to-b from-accent/20 to-transparent rounded-full blur-3xl animate-pulse-glow" />
          </div>

          {/* Main wallet illustration (simplified SVG-like element) */}
          <div className="relative z-10 flex items-center justify-center">
            {/* Wallet shadow/glow */}
            <div className="absolute w-48 h-48 bg-accent/30 rounded-3xl blur-2xl animate-pulse-glow" style={{ animationDelay: "0.5s" }} />

            {/* Wallet body */}
            <div className="relative w-48 h-32 bg-gradient-to-br from-foreground to-foreground/80 rounded-2xl border-2 border-accent/40 shadow-2xl shadow-accent/50 flex items-center justify-center group">
              {/* Wallet shine effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Wallet icon inside */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/80 shadow-lg shadow-accent/50">
                <Wallet className="h-6 w-6 text-white" />
              </div>
            </div>

            {/* Floating icons around wallet */}
            {/* Music note icon */}
            <div className="absolute -top-12 -left-16 animate-float" style={{ animationDelay: "0s" }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-accent/60 shadow-lg shadow-accent/30">
                <Music className="h-7 w-7 text-accent" />
              </div>
            </div>

            {/* Dollar sign icon */}
            <div className="absolute -top-8 -right-20 animate-float" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-accent/60 shadow-lg shadow-accent/30">
                <span className="text-2xl font-bold text-accent">$</span>
              </div>
            </div>

            {/* Trending up icon */}
            <div className="absolute -bottom-4 -left-20 animate-float" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-accent/60 shadow-lg shadow-accent/30">
                <TrendingUp className="h-7 w-7 text-accent" />
              </div>
            </div>

            {/* Gift icon */}
            <div className="absolute -bottom-8 -right-16 animate-float" style={{ animationDelay: "0.9s" }}>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background border-2 border-accent/60 shadow-lg shadow-accent/30">
                <Gift className="h-7 w-7 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="text-center space-y-6 animate-slide-up">
          {/* Title with color accent */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-2">
              <span className="text-foreground">Connect Your </span>
              <span className="bg-gradient-to-r from-accent via-accent to-accent/80 bg-clip-text text-transparent">Wallet</span>
            </h2>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 my-8 px-4 md:px-0">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-2 p-4 md:p-6 rounded-xl bg-card/40 border border-accent/20 backdrop-blur-sm hover:bg-card/60 transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 group animate-slide-up"
                style={{ animationDelay: `${(index + 1) * 0.1}s` }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/20 group-hover:bg-accent/30 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-sm md:text-base">{feature.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Button
              size="lg"
              onClick={connect}
              className="w-full md:w-auto bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent text-white border border-accent/50 shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:shadow-xl gap-2 font-semibold text-base md:text-lg px-8 py-6 md:py-7 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Wallet className="h-5 w-5 md:h-6 md:w-6" />
              {ctaText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
