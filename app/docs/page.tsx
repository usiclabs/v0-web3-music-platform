import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Code, Zap, Music, Wallet, Shield } from "lucide-react"
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-6xl">
        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Documentation</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about building on USIC and using the X402 protocol.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/docs/getting-started">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full">
              <Zap className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Getting Started</h3>
              <p className="text-muted-foreground mb-4">
                Learn about USIC's tokenization features, streaming payments, and how to get started.
              </p>
              <Button variant="link" className="p-0">
                Read Guide →
              </Button>
            </Card>
          </Link>

          <Link href="/docs/artist-guide">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.1s" }}
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

          <Link href="/docs/x402-protocol">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.3s" }}
            >
              <Code className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">X402 Protocol</h3>
              <p className="text-muted-foreground mb-4">Technical documentation for the X402 micropayment protocol.</p>
              <Button variant="link" className="p-0">
                Read Docs →
              </Button>
            </Card>
          </Link>

          <Link href="/docs/smart-contracts">
            <Card
              className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover-lift animate-slide-up cursor-pointer h-full"
              style={{ animationDelay: "0.4s" }}
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
              style={{ animationDelay: "0.5s" }}
            >
              <BookOpen className="h-10 w-10 text-chart-3 mb-4" />
              <h3 className="text-xl font-semibold mb-2">API Reference</h3>
              <p className="text-muted-foreground mb-4">Build integrations with the USIC API.</p>
              <Button variant="link" className="p-0">
                View API →
              </Button>
            </Card>
          </Link>
        </div>

        <div className="mt-16 animate-slide-up" style={{ animationDelay: "0.6s" }}>
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
