import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Music, Zap, Users, Globe, Heart, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About USI</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're building the future of music streaming—where artists get paid instantly and fans own what they love.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              USI is a decentralized music streaming platform built on Base blockchain. We use the X402 protocol to
              enable instant micropayments, ensuring artists get paid the moment someone streams their music.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              No more waiting 90 days for royalties. No more opaque payment structures. Just transparent, instant
              payments powered by blockchain technology.
            </p>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-6">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Heart className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Artist First</h3>
                <p className="text-muted-foreground">
                  Every decision we make prioritizes the artists who create the music we love.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Zap className="h-10 w-10 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">Instant Payments</h3>
                <p className="text-muted-foreground">
                  Artists deserve to be paid immediately, not months later. We make that possible.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Globe className="h-10 w-10 text-chart-3 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Open & Transparent</h3>
                <p className="text-muted-foreground">
                  All payments and royalty splits are on-chain and verifiable by anyone.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Users className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community Owned</h3>
                <p className="text-muted-foreground">
                  $USI token holders govern the platform's future through decentralized voting.
                </p>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">The Technology</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              USI is built on Base, Coinbase's Layer 2 blockchain, which provides fast, low-cost transactions. We use
              the X402 protocol for micropayments, allowing fans to pay fractions of a cent per stream.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              All payments are made in USDC, a stable cryptocurrency, ensuring artists receive predictable value. Smart
              contracts handle royalty splits automatically, eliminating disputes and delays.
            </p>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Whether you're an artist looking to take control of your music or a fan who wants to support creators
              directly, USI is for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  <Music className="h-5 w-5 mr-2" />
                  Start as an Artist
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent">
                <Link href="/explore">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Explore Music
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
