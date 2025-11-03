import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Coins, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Getting Started</h1>
          <p className="text-xl text-muted-foreground">
            Welcome to USIC, the decentralized music streaming platform powered by Web3 technology.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">What is USIC?</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                USIC is a revolutionary Web3 music platform that uses blockchain technology to ensure artists get paid
                fairly and instantly for every stream. Built on Base (Ethereum L2), USIC leverages the X402 micropayment
                protocol for real-time streaming payments, native Uniswap V4 integration for token swaps, and Clanker
                for profile tokenization.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Coins className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Instant Payments</h4>
                    <p className="text-sm text-muted-foreground">Artists earn $0.01 USDC per stream, paid instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Fair Revenue</h4>
                    <p className="text-sm text-muted-foreground">100% of streaming fees go directly to artists</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">Quick Start for Listeners</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground mb-3">
                      Click the "Wallet" button in the top right corner and connect your Web3 wallet (MetaMask, Coinbase
                      Wallet, or WalletConnect).
                    </p>
                    <Link href="/docs/wallet-setup">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Wallet Setup Guide →
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fund Your Wallet</h3>
                    <p className="text-muted-foreground">
                      Add USDC to your wallet on the Base network. You'll need USDC to pay for streams ($0.01 per
                      stream). You can get USDC from exchanges like Coinbase or use the built-in swap feature.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Start Streaming</h3>
                    <p className="text-muted-foreground">
                      Browse the trending feed, discover new artists, and start streaming! Each stream costs $0.01 USDC
                      and goes directly to the artist.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Quick Start for Artists</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
                    <p className="text-muted-foreground">
                      Connect your Web3 wallet to receive payments. This wallet address will be your artist identity on
                      the platform.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Upload Your Music</h3>
                    <p className="text-muted-foreground mb-3">
                      Go to the Upload page and add your tracks. Include metadata like title, genre, and cover art. Your
                      music is stored on IPFS for decentralized access.
                    </p>
                    <Link href="/docs/artist-guide">
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Artist Guide →
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-accent/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Earn from Streams</h3>
                    <p className="text-muted-foreground">
                      Every time someone streams your track, you earn $0.01 USDC instantly. Track your earnings in
                      real-time on your dashboard.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Key Concepts</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">$USI Token</h3>
                <p className="text-muted-foreground">
                  The native platform token used for governance and token gating. Hold 10M $USI to unlock profile
                  tokenization and other premium features.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">X402 Protocol</h3>
                <p className="text-muted-foreground">
                  Our custom micropayment protocol that enables instant, low-cost payments for each stream without
                  requiring a transaction per stream.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">Profile Tokens</h3>
                <p className="text-muted-foreground">
                  Artists can tokenize their profile once using Clanker, creating a tradeable token that represents
                  their brand. Requires 10M $USI and 5+ tracks.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">Token-Gated Streaming</h3>
                <p className="text-muted-foreground">
                  Artists can enable free streaming for token holders. Fans who hold enough track tokens can bypass X402
                  payments and stream for free.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">Track Tokens</h3>
                <p className="text-muted-foreground">
                  Each track can be tokenized as ERC20 or NFT. Fans can collect tokens, trade them on Uniswap V4, and
                  potentially unlock exclusive benefits.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">Base Network</h3>
                <p className="text-muted-foreground">
                  USIC is built on Base, Coinbase's Ethereum L2, offering fast transactions and low fees perfect for
                  micropayments and token trading.
                </p>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet and start exploring the future of music streaming.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/">
                  <Button size="lg">Explore Music</Button>
                </Link>
                <Link href="/upload">
                  <Button size="lg" variant="outline" className="bg-transparent">
                    Upload Your Music
                  </Button>
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
