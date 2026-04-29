"use client"

import type React from "react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Zap, Shield, TrendingUp } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"

interface WalletConnectPromptProps {
  title: string
  description: string
  icon?: React.ReactNode
}

export function WalletConnectPrompt({ title, description, icon }: WalletConnectPromptProps) {
  const { connect } = useWallet()

  return (
    <div className="flex items-center justify-center px-4 py-12 min-h-[50vh]">
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-xl border border-border/50 p-6 md:p-12 text-center max-w-2xl w-full animate-scale-in">
        {/* Floating background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" style={{ animation: "float 3s ease-in-out infinite" }} />
        <div
          className="absolute bottom-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl"
          style={{ animation: "float 3s ease-in-out infinite", animationDelay: "1s" }}
        />

        {/* Icon with glow effect */}
        <div className="relative mb-6 inline-block">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow" />
          <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
            {icon || <Wallet className="h-10 w-10 md:h-12 md:h-12 text-primary" />}
          </div>
        </div>

        {/* Title with gradient */}
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent" style={{ animation: "slide-up 0.6s ease-out" }}>
          {title}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground text-lg mb-8" style={{ animation: "slide-up 0.6s ease-out", animationDelay: "0.1s", animationFillMode: "both" }}>
          {description}
        </p>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-border/50"
            style={{ animation: "slide-up 0.6s ease-out", animationDelay: "0.2s", animationFillMode: "both" }}
          >
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Instant Access</span>
          </div>
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-border/50"
            style={{ animation: "slide-up 0.6s ease-out", animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <Shield className="h-6 w-6 text-accent" />
            <span className="text-sm font-medium">Secure & Private</span>
          </div>
          <div
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-background/50 border border-border/50"
            style={{ animation: "slide-up 0.6s ease-out", animationDelay: "0.4s", animationFillMode: "both" }}
          >
            <TrendingUp className="h-6 w-6 text-chart-3" />
            <span className="text-sm font-medium">Track Earnings</span>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          size="lg"
          onClick={connect}
          className="hover:scale-105 transition-transform"
          style={{ animation: "slide-up 0.6s ease-out", animationDelay: "0.5s", animationFillMode: "both" }}
        >
          <Wallet className="h-5 w-5 mr-2" />
          Connect Wallet
        </Button>
      </Card>
    </div>
  )
}
