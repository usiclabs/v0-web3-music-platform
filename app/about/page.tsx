import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Music,
  Zap,
  Users,
  Globe,
  Heart,
  TrendingUp,
  Coins,
  Lock,
  ArrowRightLeft,
  Sparkles,
  Shield,
  Rocket,
} from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-6xl">
        <div className="mb-16 animate-slide-up text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Future of Music is Here</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent">
            About USIC
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            The world's first Web3 music platform where artists tokenize their profiles, fans stream with micropayments,
            and everyone trades music tokens natively.
          </p>
        </div>

        <div className="space-y-20">
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-4xl font-bold mb-6 text-center">Our Mission</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-lg text-muted-foreground leading-relaxed">
                USIC (myusic.xyz) is revolutionizing the music industry by combining instant micropayments, profile
                tokenization, and native token swaps into one seamless platform. Built on Base blockchain, we use the
                X402 protocol to enable real-time payments—artists get paid the moment someone streams their music.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                No more waiting 90 days for royalties. No more opaque payment structures. No more intermediaries taking
                massive cuts. Just transparent, instant payments powered by blockchain technology, where artists control
                their destiny and fans truly own their relationship with music.
              </p>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-4xl font-bold mb-8 text-center">Platform Features</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl border border-primary/20 p-6 hover:border-primary/40 transition-colors">
                <Coins className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">Profile Tokenization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Artists can tokenize their profile once via Clanker, creating a tradeable token that represents their
                  brand. Market cap displayed on profiles and artist cards.
                </p>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-xl border border-accent/20 p-6 hover:border-accent/40 transition-colors">
                <Lock className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-3">Token-Gated Streaming</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Hold an artist's tokens to stream their music for free. Artists set the required token balance,
                  creating exclusive access for true fans.
                </p>
              </Card>

              <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 backdrop-blur-xl border border-chart-3/20 p-6 hover:border-chart-3/40 transition-colors">
                <ArrowRightLeft className="h-12 w-12 text-chart-3 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Native Uniswap V4 Swaps</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Trade profile and track tokens directly within the platform using Uniswap V4. No external DEX
                  needed—seamless, integrated swaps.
                </p>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-xl border border-primary/20 p-6 hover:border-primary/40 transition-colors">
                <Zap className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-3">X402 Micropayments</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Stream music with instant micropayments. Pay fractions of a cent per chunk, with artists receiving
                  funds immediately in USDC.
                </p>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 backdrop-blur-xl border border-accent/20 p-6 hover:border-accent/40 transition-colors">
                <Music className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-3">Track Tokenization</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tokenize individual tracks as ERC20 or NFTs. Set royalty splits, create liquidity pools, and let fans
                  invest in your music.
                </p>
              </Card>

              <Card className="bg-gradient-to-br from-chart-3/10 to-chart-3/5 backdrop-blur-xl border border-chart-3/20 p-6 hover:border-chart-3/40 transition-colors">
                <TrendingUp className="h-12 w-12 text-chart-3 mb-4" />
                <h3 className="text-xl font-semibold mb-3">Real-Time Analytics</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Track your earnings, plays, and token metrics in real-time. All data is on-chain and verifiable.
                </p>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-4xl font-bold mb-8 text-center">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 hover:border-primary/50 transition-colors">
                <Heart className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-3">Artist First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every decision we make prioritizes the artists who create the music we love. You own your music, your
                  tokens, and your future.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 hover:border-accent/50 transition-colors">
                <Zap className="h-12 w-12 text-accent mb-4" />
                <h3 className="text-2xl font-semibold mb-3">Instant Payments</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Artists deserve to be paid immediately, not months later. Every stream generates instant revenue in
                  your wallet.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 hover:border-chart-3/50 transition-colors">
                <Globe className="h-12 w-12 text-chart-3 mb-4" />
                <h3 className="text-2xl font-semibold mb-3">Open & Transparent</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All payments, royalty splits, and token metrics are on-chain and verifiable by anyone. No hidden fees,
                  no black boxes.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 hover:border-primary/50 transition-colors">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-3">Community Owned</h3>
                <p className="text-muted-foreground leading-relaxed">
                  $USI token holders govern the platform's future through decentralized voting. This is your platform,
                  built by the community.
                </p>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-4xl font-bold mb-8 text-center">How It Works</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-primary mb-4">For Artists</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Connect Your Wallet</h4>
                      <p className="text-sm text-muted-foreground">
                        Use any Web3 wallet to sign in and create your profile.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Upload Your Music</h4>
                      <p className="text-sm text-muted-foreground">
                        Upload tracks with metadata, set X402 pricing, and optionally tokenize.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Tokenize Your Profile</h4>
                      <p className="text-sm text-muted-foreground">
                        Once you have 5 tracks and 10M $USI, deploy your profile token via Clanker.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Get Paid Instantly</h4>
                      <p className="text-sm text-muted-foreground">
                        Earn from streams, token sales, and liquidity pools—all in real-time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-accent mb-4">For Fans</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Connect & Explore</h4>
                      <p className="text-sm text-muted-foreground">
                        Browse artists, discover new music, and check out token metrics.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Stream with Micropayments</h4>
                      <p className="text-sm text-muted-foreground">
                        Pay tiny amounts per stream chunk, or hold tokens for free streaming.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Buy Artist Tokens</h4>
                      <p className="text-sm text-muted-foreground">
                        Swap ETH for profile or track tokens directly in the app using Uniswap V4.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Support Your Favorites</h4>
                      <p className="text-sm text-muted-foreground">
                        Follow artists, hold their tokens, and get exclusive token-gated access.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <h2 className="text-4xl font-bold mb-8 text-center">The Technology</h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <Shield className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Built on Base</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      USIC is built on Base, Coinbase's Layer 2 blockchain, which provides fast, low-cost transactions
                      with the security of Ethereum. Every payment, token swap, and smart contract interaction happens
                      on-chain, ensuring transparency and immutability.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <Zap className="h-10 w-10 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">X402 Protocol</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      We use the X402 protocol for micropayments, allowing fans to pay fractions of a cent per stream
                      chunk. All payments are made in USDC, a stable cryptocurrency, ensuring artists receive
                      predictable value without volatility concerns.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <ArrowRightLeft className="h-10 w-10 text-chart-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Uniswap V4 Integration</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Native Uniswap V4 integration enables seamless token swaps directly within the platform. Trade
                      profile tokens, track tokens, and $USI without leaving the app. Real-time quotes, slippage
                      protection, and instant execution.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <Coins className="h-10 w-10 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Clanker Token Deployment</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Profile tokenization is powered by Clanker, an AI-driven token deployment tool on Base. Artists
                      can deploy their profile token once, creating a tradeable asset that represents their brand and
                      gives fans a way to invest in their success.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <h2 className="text-4xl font-bold mb-8 text-center">The $USI Token</h2>
            <div className="max-w-3xl mx-auto">
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-xl border border-primary/20 p-8">
                <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                  $USI is the native governance and utility token of the USIC platform. Token holders can vote on
                  platform decisions, access exclusive features, and unlock special benefits.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <h4 className="font-semibold mb-1">Governance Rights</h4>
                      <p className="text-sm text-muted-foreground">Vote on platform upgrades and feature proposals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <h4 className="font-semibold mb-1">Profile Tokenization</h4>
                      <p className="text-sm text-muted-foreground">Hold 10M $USI to unlock profile tokenization</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-chart-3 mt-2" />
                    <div>
                      <h4 className="font-semibold mb-1">Reduced Fees</h4>
                      <p className="text-sm text-muted-foreground">Token holders get discounted platform fees</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div>
                      <h4 className="font-semibold mb-1">Exclusive Access</h4>
                      <p className="text-sm text-muted-foreground">Early access to new features and beta programs</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Contract Address:{" "}
                    <code className="text-xs bg-black/30 px-2 py-1 rounded">
                      0xECE5d962d17901ef200Da050C7c74AB45C96Db07
                    </code>
                  </p>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.7s" }}>
            <h2 className="text-4xl font-bold mb-8 text-center">Our Vision</h2>
            <div className="max-w-3xl mx-auto">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <Rocket className="h-12 w-12 text-primary mb-4 mx-auto" />
                <p className="text-lg text-muted-foreground leading-relaxed text-center mb-4">
                  We envision a future where artists have complete control over their music and earnings, where fans can
                  directly support and invest in the artists they love, and where the music industry operates with full
                  transparency on the blockchain.
                </p>
                <p className="text-lg text-muted-foreground leading-relaxed text-center">
                  USIC is more than a streaming platform—it's a movement to democratize music ownership, eliminate
                  intermediaries, and create a fair, sustainable ecosystem for creators and fans alike.
                </p>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.8s" }}>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-4">Join the Revolution</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Whether you're an artist looking to take control of your music or a fan who wants to support creators
                directly, USIC is for you. The future of music is decentralized, transparent, and fair.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-lg px-8">
                  <Link href="/dashboard">
                    <Music className="h-5 w-5 mr-2" />
                    Start as an Artist
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-transparent text-lg px-8">
                  <Link href="/explore">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Explore Music
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
