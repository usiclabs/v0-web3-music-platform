import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function WalletSetupPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Wallet Setup</h1>
          <p className="text-xl text-muted-foreground">
            Learn how to set up your Web3 wallet and connect to USIC on the Base network.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Supported Wallets</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">MetaMask</h3>
                <p className="text-sm text-muted-foreground mb-4">Most popular browser extension wallet</p>
                <Button variant="outline" size="sm" className="bg-transparent w-full" asChild>
                  <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">
                    Get MetaMask <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">Coinbase Wallet</h3>
                <p className="text-sm text-muted-foreground mb-4">Easy onboarding from Coinbase</p>
                <Button variant="outline" size="sm" className="bg-transparent w-full" asChild>
                  <a href="https://www.coinbase.com/wallet" target="_blank" rel="noopener noreferrer">
                    Get Coinbase <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">WalletConnect</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect any mobile wallet</p>
                <Button variant="outline" size="sm" className="bg-transparent w-full" asChild>
                  <a href="https://walletconnect.com" target="_blank" rel="noopener noreferrer">
                    Learn More <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">Adding Base Network</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-4">
              <p className="text-muted-foreground mb-4">
                USIC runs on Base, an Ethereum Layer 2 network. You'll need to add Base to your wallet to use the
                platform.
              </p>

              <div className="bg-muted/10 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-3">Base Network Details</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Name:</span>
                    <span>Base</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">RPC URL:</span>
                    <span>https://mainnet.base.org</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chain ID:</span>
                    <span>8453</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <span>ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Block Explorer:</span>
                    <span>https://basescan.org</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="bg-transparent" asChild>
                <a href="https://chainlist.org/chain/8453" target="_blank" rel="noopener noreferrer">
                  Add Base Automatically <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </Card>

            <Card className="bg-primary/10 backdrop-blur-xl border border-primary/50 p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold mb-1">Automatic Network Switching</h4>
                  <p className="text-sm text-muted-foreground">
                    When you connect to USIC, we'll automatically prompt you to switch to Base if you're on a different
                    network.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Getting USDC</h2>
            <p className="text-muted-foreground mb-6">
              You'll need USDC on Base to pay for streams. Here are several ways to get USDC:
            </p>

            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">1. Bridge from Ethereum</h3>
                <p className="text-muted-foreground mb-3">
                  If you have USDC on Ethereum mainnet, you can bridge it to Base using the official Base bridge.
                </p>
                <Button variant="outline" size="sm" className="bg-transparent" asChild>
                  <a href="https://bridge.base.org" target="_blank" rel="noopener noreferrer">
                    Base Bridge <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">2. Buy on Coinbase</h3>
                <p className="text-muted-foreground mb-3">
                  Purchase USDC on Coinbase and withdraw directly to Base network (lowest fees).
                </p>
                <Button variant="outline" size="sm" className="bg-transparent" asChild>
                  <a href="https://www.coinbase.com" target="_blank" rel="noopener noreferrer">
                    Coinbase <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">3. Native Token Swaps</h3>
                <p className="text-muted-foreground mb-3">
                  If you have ETH on Base, use our native Uniswap V4 integration to swap for USDC. USIC features
                  built-in swap functionality for all profile and track tokens.
                </p>
                <Link href="/tokens">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    View Tokens
                  </Button>
                </Link>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-2">4. External DEX</h3>
                <p className="text-muted-foreground mb-3">
                  Use external decentralized exchanges like Uniswap to swap other tokens for USDC on Base.
                </p>
                <Button variant="outline" size="sm" className="bg-transparent" asChild>
                  <a href="https://app.uniswap.org" target="_blank" rel="noopener noreferrer">
                    Uniswap <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Connecting to USIC</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Click "Wallet" Button</h4>
                    <p className="text-sm text-muted-foreground">
                      Find the red "Wallet" button in the top right corner of any page.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Choose Your Wallet</h4>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred wallet from the connection modal.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Approve Connection</h4>
                    <p className="text-sm text-muted-foreground">
                      Approve the connection request in your wallet. USIC will never ask for your private keys.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Switch to Base</h4>
                    <p className="text-sm text-muted-foreground">
                      If prompted, approve the network switch to Base. You're now ready to use USIC!
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Need Help?</h2>
              <p className="text-muted-foreground mb-6">
                If you're having trouble connecting your wallet, join our community for support.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button>Join Discord</Button>
                <Button variant="outline" className="bg-transparent">
                  Join Telegram
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
