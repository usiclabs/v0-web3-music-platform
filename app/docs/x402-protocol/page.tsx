import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Shield, Code, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function X402ProtocolPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">X402 Protocol</h1>
          <p className="text-xl text-muted-foreground">
            Technical documentation for the X402 micropayment protocol powering USIC's streaming payments.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Overview</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                X402 is a custom micropayment protocol designed specifically for streaming media. It enables instant,
                low-cost payments without requiring a blockchain transaction for every stream.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Instant Payments</h4>
                    <p className="text-sm text-muted-foreground">Payments settle in real-time as content streams</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Secure</h4>
                    <p className="text-sm text-muted-foreground">Cryptographic signatures prevent fraud</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Code className="h-6 w-6 text-chart-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Efficient</h4>
                    <p className="text-sm text-muted-foreground">Batch multiple payments into one transaction</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3">1. Payment Channel Opening</h3>
                <p className="text-muted-foreground mb-4">
                  When a listener starts streaming, they open a payment channel by signing a message authorizing
                  payments up to a certain amount.
                </p>
                <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono">
                    {`{
  "listener": "0x1234...",
  "maxAmount": "1000000", // 1 USDC
  "nonce": 1,
  "signature": "0xabcd..."
}`}
                  </pre>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3">2. Streaming & Payment Chunks</h3>
                <p className="text-muted-foreground mb-4">
                  As the track plays, the client sends signed payment chunks to the server. Each chunk represents a
                  portion of the stream (e.g., 10 seconds = $0.01).
                </p>
                <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono">
                    {`{
  "trackId": "abc123",
  "chunkIndex": 5,
  "amount": "10000", // 0.01 USDC
  "timestamp": 1234567890,
  "signature": "0xdef..."
}`}
                  </pre>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3">3. Settlement</h3>
                <p className="text-muted-foreground mb-4">
                  When the stream ends or the payment channel closes, the server submits the final signed payment to the
                  smart contract for settlement.
                </p>
                <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono">
                    {`function settlePayment(
  address listener,
  address artist,
  uint256 amount,
  uint256 nonce,
  bytes signature
) external`}
                  </pre>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Security Features</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold mb-2">Signature Verification</h3>
                <p className="text-sm text-muted-foreground">
                  All payment messages are signed by the listener's wallet. The smart contract verifies signatures
                  on-chain to prevent fraud.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold mb-2">Nonce Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Each payment channel has a unique nonce to prevent replay attacks. Used nonces are tracked on-chain.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold mb-2">Amount Limits</h3>
                <p className="text-sm text-muted-foreground">
                  Payment channels have maximum amounts to limit potential losses if a signature is compromised.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold mb-2">Timeout Protection</h3>
                <p className="text-sm text-muted-foreground">
                  Payment channels expire after a set time period, requiring renewal for continued streaming.
                </p>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">API Integration</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-4">
              <h3 className="text-xl font-semibold mb-3">Client-Side Flow</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">1. Initialize Payment Channel</h4>
                  <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm font-mono">
                      {`const signature = await wallet.signMessage({
  message: JSON.stringify({
    listener: address,
    maxAmount: parseUnits("1", 6), // 1 USDC
    nonce: Date.now()
  })
})`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Send Payment Chunks</h4>
                  <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm font-mono">
                      {`const response = await fetch('/api/x402/chunk', {
  method: 'POST',
  body: JSON.stringify({
    trackId,
    chunkIndex,
    amount: parseUnits("0.01", 6),
    signature
  })
})`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Close Channel</h4>
                  <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm font-mono">
                      {`await fetch('/api/x402/settle', {
  method: 'POST',
  body: JSON.stringify({
    trackId,
    finalSignature
  })
})`}
                    </pre>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-accent/10 backdrop-blur-xl border border-accent/50 p-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Code className="h-5 w-5 text-accent" />
                Full Implementation
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                For a complete implementation example, check out our GitHub repository.
              </p>
              <Button variant="outline" size="sm" className="bg-transparent" asChild>
                <a href="https://github.com/usic/x402-protocol" target="_blank" rel="noopener noreferrer">
                  View on GitHub <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Build with X402</h2>
              <p className="text-muted-foreground mb-6">
                Integrate X402 into your own streaming platform or build new applications on top of the protocol.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/docs/api-reference">
                  <Button size="lg">API Reference</Button>
                </Link>
                <Link href="/docs/smart-contracts">
                  <Button size="lg" variant="outline" className="bg-transparent">
                    Smart Contracts
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
