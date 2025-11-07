import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Code, Zap, Music, Wallet, Shield, Bot, Droplets, TrendingUp, Sparkles } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-6xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Documentation</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about building on MyUSIC and using our protocol suite.
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-muted-foreground/60 uppercase tracking-wider mb-4">Getting Started</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/docs/getting-started">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
              <p className="text-muted-foreground mb-4">
                Learn about MyUSIC's tokenization features, streaming payments, and how to get started.
              </p>
              <Button variant="link" className="p-0">
                Read Guide →
              </Button>
            </Card>
          </Link>

          <Link href="/onboarding">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.1s" }}
            >
              <Sparkles className="h-10 w-10 text-pink-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Platform Onboarding</h3>
              <p className="text-muted-foreground mb-4">Interactive walkthrough of MyUSIC features and capabilities.</p>
              <Button variant="link" className="p-0">
                Start Tour →
              </Button>
            </Card>
          </Link>

          <Link href="/docs/wallet-setup">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.2s" }}
            >
              <Wallet className="h-10 w-10 text-chart-3 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Wallet Setup</h3>
              <p className="text-muted-foreground mb-4">Connect your wallet and fund it with USDC on Base.</p>
              <Button variant="link" className="p-0">
                Read Guide →
              </Button>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-muted-foreground/60 uppercase tracking-wider mb-4">For Artists</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/docs/artist-guide">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.3s" }}
            >
              <Music className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Artist Guide</h3>
              <p className="text-muted-foreground mb-4">
                Upload music, tokenize tracks and profiles, set royalty splits, and manage earnings.
              </p>
              <Button variant="link" className="p-0">
                Read Guide →
              </Button>
            </Card>
          </Link>

          <Link href="/docs/live-streaming">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.4s" }}
            >
              <div className="h-10 w-10 text-red-500 mb-4 flex items-center justify-center">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Streaming</h3>
              <p className="text-muted-foreground mb-4">
                Stream live performances with real-time monetization via Livepeer.
              </p>
              <Button variant="link" className="p-0">
                Read Guide →
              </Button>
            </Card>
          </Link>

          <Link href="/docs/cdp-integration">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.5s" }}
            >
              <TrendingUp className="h-10 w-10 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Automated Payouts</h3>
              <p className="text-muted-foreground mb-4">
                Set up automated earnings distribution with Coinbase Developer Platform.
              </p>
              <Button variant="link" className="p-0">
                Read Guide →
              </Button>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-muted-foreground/60 uppercase tracking-wider mb-4">
            DeFi & Liquidity
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/lp-manager">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.6s" }}
            >
              <Droplets className="h-10 w-10 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">LP Manager</h3>
              <p className="text-muted-foreground mb-4">
                Provide liquidity for artist tokens and $USI, earn fees, and manage positions.
              </p>
              <Button variant="link" className="p-0">
                Open LP Manager →
              </Button>
            </Card>
          </Link>

          <Link href="/auto-invest">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.7s" }}
            >
              <TrendingUp className="h-10 w-10 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Auto-Investment</h3>
              <p className="text-muted-foreground mb-4">
                Dollar-cost average into artist tokens automatically with EIP-3009.
              </p>
              <Button variant="link" className="p-0">
                Learn More →
              </Button>
            </Card>
          </Link>

          <Link href="/staking">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.8s" }}
            >
              <div className="h-10 w-10 text-yellow-500 mb-4">💎</div>
              <h3 className="text-xl font-semibold mb-2">Staking</h3>
              <p className="text-muted-foreground mb-4">
                Stake $USI to earn platform revenue share and governance rights.
              </p>
              <Button variant="link" className="p-0">
                Start Staking →
              </Button>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-muted-foreground/60 uppercase tracking-wider mb-4">Protocols & AI</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/docs/x402-protocol">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.9s" }}
            >
              <Code className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">X402 Protocol</h3>
              <p className="text-muted-foreground mb-4">Technical documentation for the X402 micropayment protocol.</p>
              <Button variant="link" className="p-0">
                Read Docs →
              </Button>
            </Card>
          </Link>

          <Link href="/community-update">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "1.0s" }}
            >
              <Bot className="h-10 w-10 text-cyan-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">ERC-8004 AI Agents</h3>
              <p className="text-muted-foreground mb-4">
                Verifiable AI agents for music curation, playlist creation, and commerce.
              </p>
              <Button variant="link" className="p-0">
                Learn About Agents →
              </Button>
            </Card>
          </Link>

          <Link href="/agents">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "1.1s" }}
            >
              <Bot className="h-10 w-10 text-orange-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Browse Agents</h3>
              <p className="text-muted-foreground mb-4">Discover and interact with AI agents on the MyUSIC platform.</p>
              <Button variant="link" className="p-0">
                View Agents →
              </Button>
            </Card>
          </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-muted-foreground/60 uppercase tracking-wider mb-4">
            Developer Resources
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <Link href="/docs/smart-contracts">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "1.2s" }}
            >
              <Shield className="h-10 w-10 text-accent mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Contracts</h3>
              <p className="text-muted-foreground mb-4">Explore our audited smart contracts on Base.</p>
              <Button variant="link" className="p-0">
                View Contracts →
              </Button>
            </Card>
          </Link>

          <Link href="/docs/api-reference">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "1.3s" }}
            >
              <BookOpen className="h-10 w-10 text-chart-3 mb-4" />
              <h3 className="text-xl font-semibold mb-2">API Reference</h3>
              <p className="text-muted-foreground mb-4">Build integrations with the MyUSIC API.</p>
              <Button variant="link" className="p-0">
                View API →
              </Button>
            </Card>
          </Link>

          <Link href="/changelog">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "1.4s" }}
            >
              <BookOpen className="h-10 w-10 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Changelog</h3>
              <p className="text-muted-foreground mb-4">Track platform updates, new features, and improvements.</p>
              <Button variant="link" className="p-0">
                View Changes →
              </Button>
            </Card>
          </Link>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: "1.5s" }}>
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
            <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Join our community on Discord or Telegram for support and discussions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild>
                <Link href="#">Join Discord</Link>
              </Button>
              <Button variant="outline" asChild className="bg-transparent">
                <Link href="#">Join Telegram</Link>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
