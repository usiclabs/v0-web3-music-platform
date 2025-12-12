import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Wallet,
  Music,
  Coins,
  TrendingUp,
  Lock,
  Upload,
  DollarSign,
  Users,
  Zap,
  Shield,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Heart,
  Timer,
} from "lucide-react"
import Link from "next/link"

export default function DummiesGuidePage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-5xl">
        {/* Hero Section */}
        <div className="mb-16 animate-slide-up text-center">
          <Badge className="mb-4 bg-rose-500/10 text-rose-500 border-rose-500/20">Complete Beginner's Guide</Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-rose-400 via-red-400 to-orange-400 bg-clip-text text-transparent">
            MyUSIC for Dummies
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know about the future of music streaming—explained like you're five years old.
          </p>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-12">
          <h2 className="text-2xl font-bold mb-4">Quick Navigation</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <a href="#what-is" className="text-sm hover:text-rose-400 transition-colors">
              → What is MyUSIC?
            </a>
            <a href="#why-different" className="text-sm hover:text-rose-400 transition-colors">
              → Why is it different?
            </a>
            <a href="#getting-started" className="text-sm hover:text-rose-400 transition-colors">
              → Getting Started
            </a>
            <a href="#wallet-setup" className="text-sm hover:text-rose-400 transition-colors">
              → Wallet Setup
            </a>
            <a href="#listening" className="text-sm hover:text-rose-400 transition-colors">
              → How to Listen
            </a>
            <a href="#artists" className="text-sm hover:text-rose-400 transition-colors">
              → For Artists
            </a>
            <a href="#tokens" className="text-sm hover:text-rose-400 transition-colors">
              → Understanding Tokens
            </a>
            <a href="#earning" className="text-sm hover:text-rose-400 transition-colors">
              → Earning Money
            </a>
            <a href="#faq" className="text-sm hover:text-rose-400 transition-colors">
              → FAQ
            </a>
          </div>
        </Card>

        <div className="space-y-16">
          {/* Section 1: What is MyUSIC? */}
          <section id="what-is" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Music className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">What is MyUSIC?</h2>
            </div>

            <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 backdrop-blur-xl border border-rose-500/20 p-8 mb-6">
              <p className="text-lg leading-relaxed mb-4">
                <strong>Simple answer:</strong> MyUSIC is like Spotify, but on the blockchain. Artists get paid
                instantly for every stream, and fans can actually invest in their favorite artists' success.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                <strong>Detailed answer:</strong> MyUSIC is a Web3 music streaming platform built on the Base
                blockchain. It uses cutting-edge technology (X402 protocol) to pay artists in real-time, allows artists
                to create their own tokens that fans can trade, and integrates with decentralized exchanges so everyone
                can swap tokens without leaving the platform.
              </p>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  What MyUSIC Has
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Instant payments to artists (not months later)</li>
                  <li>✓ You can invest in artists by buying their tokens</li>
                  <li>✓ Artists keep 100% of streaming revenue</li>
                  <li>✓ All transactions are transparent on the blockchain</li>
                  <li>✓ Stream for free if you hold artist's tokens</li>
                  <li>✓ Trade music tokens like stocks</li>
                </ul>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  What MyUSIC Doesn't Have
                </h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✗ No monthly subscription fees</li>
                  <li>✗ No record labels taking huge cuts</li>
                  <li>✗ No 90-day payment delays for artists</li>
                  <li>✗ No hidden algorithms deciding what you see</li>
                  <li>✗ No middlemen between fans and artists</li>
                  <li>✗ No centralized company controlling everything</li>
                </ul>
              </Card>
            </div>
          </section>

          {/* Section 2: Why is it different? */}
          <section id="why-different" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">Why is MyUSIC Different?</h2>
            </div>

            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-rose-500/20 rounded-full p-3">
                    <Timer className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">Instant Payments (Not 90 Days Later)</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      On Spotify: Artist streams 1,000 songs in January → Gets paid in April (maybe)
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
                      On MyUSIC: Artist streams 1,000 songs → Money appears in wallet immediately
                    </p>
                    <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <p className="text-sm text-green-400">
                        💡 <strong>Why this matters:</strong> Artists can pay bills with their music earnings the same
                        day they're streamed.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-rose-500/20 rounded-full p-3">
                    <Coins className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">Artists Can Create Their Own Tokens</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      Think of it like creating your own stock. Fans can buy your token, and as you become more popular,
                      the token value goes up. Fans profit from supporting you early!
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Example 1:</p>
                        <p className="text-xs text-muted-foreground">
                          DJ Sarah creates $SARAH token at $0.01. She gets famous. Token is now $1.00. Early fans made
                          100x profit.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Example 2:</p>
                        <p className="text-xs text-muted-foreground">
                          Hold 100 $SARAH tokens? Stream her music FREE forever. No X402 payments needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8">
                <div className="flex items-start gap-4">
                  <div className="bg-rose-500/20 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-3">Artists Keep 100% of Stream Revenue</h3>
                    <div className="space-y-3">
                      <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                        <p className="text-sm mb-2">
                          <strong className="text-red-400">Spotify:</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          $1 stream → $0.003 to artist (0.3%) → Rest goes to Spotify, labels, distributors
                        </p>
                      </div>
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-sm mb-2">
                          <strong className="text-green-400">MyUSIC:</strong>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          $0.01 stream → $0.01 to artist (100%) → No middlemen, no cuts, all yours
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Section 3: Getting Started */}
          <section id="getting-started" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">Getting Started (5 Minutes)</h2>
            </div>

            <Card className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 backdrop-blur-xl border border-rose-500/20 p-8 mb-6">
              <p className="text-lg leading-relaxed">
                Don't worry! Setting up MyUSIC is easier than setting up a Netflix account. Here's exactly what you need
                to do:
              </p>
            </Card>

            <div className="space-y-4">
              {[
                {
                  number: 1,
                  title: "Get a Crypto Wallet (2 minutes)",
                  description:
                    "A wallet is like a digital bank account that only you control. No company can freeze it or take your money.",
                  options: [
                    "Coinbase Wallet (easiest for beginners)",
                    "MetaMask (most popular)",
                    "Rainbow Wallet (prettiest interface)",
                  ],
                  tip: "Download the app on your phone or add the browser extension. Write down your secret phrase (12 words) and NEVER share it with anyone!",
                },
                {
                  number: 2,
                  title: "Add USDC to Your Wallet (3 minutes)",
                  description:
                    "USDC is a cryptocurrency that's always worth $1. You'll use it to pay for streams (usually fractions of a cent).",
                  options: [
                    "Buy on Coinbase and transfer to your wallet",
                    "Use a credit card via MoonPay/Transak",
                    "Get some from a friend who's already into crypto",
                  ],
                  tip: "Start with $5-10 USDC. That's enough for hundreds or thousands of streams depending on artist pricing.",
                },
                {
                  number: 3,
                  title: "Connect to MyUSIC (30 seconds)",
                  description: "Click the 'Wallet' button in the top right corner of MyUSIC and choose your wallet.",
                  options: [
                    "Approve the connection request in your wallet",
                    "You won't be charged anything for connecting",
                    "You can disconnect anytime",
                  ],
                  tip: "MyUSIC can't access your funds without your permission. Every transaction requires your approval.",
                },
              ].map((step) => (
                <Card key={step.number} className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-gradient-to-br from-rose-500 to-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 font-bold text-xl">
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <div className="space-y-2 mb-4">
                        {step.options.map((option, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-muted-foreground">{option}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <p className="text-sm text-blue-400">
                          💡 <strong>Pro tip:</strong> {step.tip}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Section 4: Wallet Setup */}
          <section id="wallet-setup" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Wallet className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">Understanding Crypto Wallets</h2>
            </div>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 mb-6">
              <h3 className="text-2xl font-semibold mb-4">What is a wallet?</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Imagine a wallet as a mailbox. Your wallet address (starts with 0x...) is your mailbox address that
                anyone can send money to. Your secret phrase (12 words) is the key to open your mailbox. Only you have
                the key.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <Shield className="h-6 w-6 text-green-500 mb-2" />
                  <h4 className="font-semibold mb-2 text-green-400">Safe Practices</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✓ Write down your secret phrase on paper</li>
                    <li>✓ Store it somewhere safe (not on your computer)</li>
                    <li>✓ Never share it with ANYONE (not even support)</li>
                    <li>✓ Use a hardware wallet for large amounts</li>
                    <li>✓ Double-check addresses before sending</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
                  <h4 className="font-semibold mb-2 text-red-400">Never Do This</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✗ Share your secret phrase with anyone</li>
                    <li>✗ Store it in a screenshot or cloud storage</li>
                    <li>✗ Click random links from strangers</li>
                    <li>✗ Connect to sketchy websites</li>
                    <li>✗ Trust people promising "free crypto"</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4">Recommended Wallets for Beginners</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="bg-blue-500/20 rounded p-2">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Coinbase Wallet</h4>
                    <p className="text-sm text-muted-foreground">
                      Best for total beginners. Easy to buy crypto directly.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="bg-orange-500/20 rounded p-2">
                    <Wallet className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">MetaMask</h4>
                    <p className="text-sm text-muted-foreground">
                      Most popular. Works everywhere. Slight learning curve.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="bg-purple-500/20 rounded p-2">
                    <Wallet className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Rainbow Wallet</h4>
                    <p className="text-sm text-muted-foreground">Prettiest design. Perfect for NFT collectors.</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 5: How to Listen to Music */}
          <section id="listening" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Music className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">How to Listen to Music</h2>
            </div>

            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 backdrop-blur-xl border border-rose-500/20 p-8">
                <h3 className="text-2xl font-semibold mb-4">The Basics</h3>
                <p className="text-lg leading-relaxed mb-4">
                  Listening on MyUSIC is just like any other streaming service, except you pay the artist directly as
                  you stream. Here's how it works:
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-rose-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Browse the Feed</h4>
                      <p className="text-sm text-muted-foreground">
                        Check out trending tracks, discover new artists, or search for specific songs.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-rose-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Click Play</h4>
                      <p className="text-sm text-muted-foreground">
                        When you hit play, you'll see the price per stream (usually $0.001 - $0.05 depending on the
                        artist).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-rose-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Approve Payment</h4>
                      <p className="text-sm text-muted-foreground">
                        A popup appears asking you to approve the X402 payment. Click approve once, and the song starts
                        streaming immediately.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-rose-500/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Enjoy the Music</h4>
                      <p className="text-sm text-muted-foreground">
                        The song plays normally. Every 30 seconds, a tiny micropayment (fractions of a cent) goes
                        directly to the artist. You don't need to approve every chunk—it happens automatically after the
                        first approval.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4">Stream for FREE with Tokens</h3>
                <p className="text-muted-foreground mb-4">
                  If you hold enough of an artist's tokens, you can stream their music completely FREE—no X402 payments
                  required! The artist sets the minimum token balance.
                </p>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-400">
                    <strong>Example:</strong> DJ Alex requires 100 $ALEX tokens for free streaming. If you buy and hold
                    100+ $ALEX tokens, you can listen to all their tracks unlimited times without paying per stream.
                    It's like a lifetime subscription!
                  </p>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4">Typical Pricing</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Unknown/New Artist</span>
                    <span className="font-semibold text-green-400">$0.001 - $0.005 per stream</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Rising Artist</span>
                    <span className="font-semibold text-yellow-400">$0.01 - $0.02 per stream</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Popular Artist</span>
                    <span className="font-semibold text-orange-400">$0.03 - $0.05 per stream</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  💡 With $10 USDC, you can stream 200-10,000 songs depending on artist pricing!
                </p>
              </Card>
            </div>
          </section>

          {/* Section 6: For Artists */}
          <section id="artists" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Upload className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">Guide for Artists</h2>
            </div>

            <Card className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 backdrop-blur-xl border border-rose-500/20 p-8 mb-6">
              <h3 className="text-2xl font-semibold mb-4">Why Choose MyUSIC?</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Get paid instantly (not in 90 days)</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Keep 100% of streaming revenue</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Set your own price per stream</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Create your own tradeable tokens</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Fans can invest in your success</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Full transparency—all earnings on-chain</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-rose-500" />
                  Step 1: Upload Your Music
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>1. Connect your wallet (this becomes your artist identity)</p>
                  <p>2. Go to the Upload page</p>
                  <p>3. Add your audio file (MP3, WAV, or FLAC)</p>
                  <p>4. Upload cover art (3000x3000px recommended)</p>
                  <p>5. Fill in metadata: title, artist name, genre, description</p>
                  <p>6. Set your price per stream (start low to build audience)</p>
                  <p>7. Publish and pay the transaction fee</p>
                </div>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    💡 <strong>Pricing tip:</strong> Start at $0.001-$0.005 to attract listeners. Increase as you gain
                    popularity.
                  </p>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Coins className="h-5 w-5 text-rose-500" />
                  Step 2: Tokenize Your Profile (Optional)
                </h3>
                <p className="text-muted-foreground mb-4">
                  Once you have 5+ tracks and hold 10 million $USI tokens, you can create your own profile token. This
                  is like creating your own stock!
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold mb-1">What is a profile token?</p>
                    <p className="text-sm text-muted-foreground">
                      It's an ERC20 token that represents YOU as an artist. As you get more popular, the token value
                      increases. Early fans who bought your token profit from your success!
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="font-semibold mb-1">How fans benefit:</p>
                    <p className="text-sm text-muted-foreground">
                      They can buy your token at $0.01 when you're unknown, then sell at $1.00 when you're famous.
                      That's 100x profit for believing in you early!
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-rose-500" />
                  Step 3: Enable Token-Gated Streaming (Optional)
                </h3>
                <p className="text-muted-foreground mb-4">
                  Let token holders stream your music for FREE! This incentivizes fans to buy and hold your tokens.
                </p>
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-sm text-green-400 mb-2">
                    <strong>Example strategy:</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Require 100 tokens for free streaming. Your token costs $0.10 = $10 investment for lifetime access.
                    As your token value increases, early supporters profit while enjoying free music!
                  </p>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-rose-500" />
                  Step 4: Track Your Earnings
                </h3>
                <p className="text-muted-foreground mb-4">Go to your dashboard to see real-time analytics:</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Total streams</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Earnings in USDC</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Token market cap</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Growth trends</span>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Section 7: Understanding Tokens */}
          <section id="tokens" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <Coins className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">Understanding Tokens</h2>
            </div>

            <Card className="bg-gradient-to-br from-rose-500/10 to-red-500/10 backdrop-blur-xl border border-rose-500/20 p-8 mb-6">
              <h3 className="text-2xl font-semibold mb-4">What are tokens?</h3>
              <p className="text-lg leading-relaxed mb-4">
                Tokens are like digital stocks. Each artist can create their own token that represents their brand. Fans
                buy tokens to support artists and potentially profit if the artist becomes more popular.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                <strong>Real-world analogy:</strong> It's like buying Apple stock in 1990. You believed in Apple early,
                and now you're rich. On MyUSIC, you can buy an unknown artist's token for pennies, and if they blow up,
                you profit massively!
              </p>
            </Card>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4">$USI Token (Platform Token)</h3>
                <p className="text-muted-foreground mb-4">
                  The main platform token. Used for governance and unlocking premium features.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Vote on platform decisions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Hold 10M $USI to tokenize your profile</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Get reduced platform fees</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Early access to new features</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-4">Artist Tokens (Profile & Track Tokens)</h3>
                <p className="text-muted-foreground mb-4">
                  Tokens created by individual artists. Each artist can have one profile token and multiple track
                  tokens.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Tradeable on Uniswap V4</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Can unlock free streaming</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Value increases with artist popularity</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>Support your favorite artists directly</span>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4">How to Buy & Sell Tokens</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Method 1: Direct on MyUSIC</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Go to an artist's profile → Click "Buy Token" → Enter amount → Approve transaction
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Uses Uniswap V4 under the hood. You don't need to leave MyUSIC!
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Method 2: Uniswap Directly</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Go to Uniswap V4 → Paste token contract address → Swap USDC for tokens
                  </p>
                  <p className="text-xs text-muted-foreground">
                    For advanced users who want more control over slippage.
                  </p>
                </div>

                <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    💡 <strong>Investment tip:</strong> Buy tokens of artists you genuinely like. If they get famous,
                    you profit. If not, you still supported an artist you believe in. Win-win!
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 8: Earning Money */}
          <section id="earning" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">How to Earn Money on MyUSIC</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl border border-green-500/20 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Music className="h-6 w-6 text-green-500" />
                  For Artists
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">1. Stream Revenue (Primary)</h4>
                    <p className="text-sm text-muted-foreground">
                      Earn USDC instantly for every stream. Set your own price. 100% of revenue goes to you.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">2. Token Sales</h4>
                    <p className="text-sm text-muted-foreground">
                      Create and sell your own tokens. Every buy/sell creates liquidity for your brand.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">3. Token Trading</h4>
                    <p className="text-sm text-muted-foreground">
                      As your token value increases, you can sell portions for profit while maintaining ownership.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/20 p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-500" />
                  For Fans & Investors
                </h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-1">1. Buy Low, Sell High</h4>
                    <p className="text-sm text-muted-foreground">
                      Buy artist tokens when they're unknown ($0.01), sell when they're famous ($1.00). 100x gains
                      possible!
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">2. Hold for Benefits</h4>
                    <p className="text-sm text-muted-foreground">
                      Some artists offer free streaming to token holders. Your investment becomes a lifetime
                      subscription.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">3. Liquidity Provision</h4>
                    <p className="text-sm text-muted-foreground">
                      Provide liquidity on Uniswap V4 pools and earn trading fees from every token swap.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4">Real-World Earnings Examples</h3>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">Example 1: Small Artist</h4>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Artist
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Price: $0.005/stream • 100 streams/day • 30 days</p>
                  <p className="text-lg font-semibold text-green-400">= $15 USDC per month (paid daily!)</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    vs Spotify: Same 3,000 streams = $9 paid 90 days later
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">Example 2: Rising Artist</h4>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Artist
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Price: $0.02/stream • 1,000 streams/day • 30 days
                  </p>
                  <p className="text-lg font-semibold text-green-400">= $600 USDC per month</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Plus token market cap of $50,000 from early supporters buying in!
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">Example 3: Early Token Investor</h4>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Fan/Investor
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Bought 10,000 tokens at $0.01 = $100 investment • Artist gets famous • Token now $0.50
                  </p>
                  <p className="text-lg font-semibold text-blue-400">= $5,000 value (50x return!)</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Plus you get to stream all their music for FREE because you hold enough tokens.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Section 9: FAQ */}
          <section id="faq" className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="h-8 w-8 text-rose-500" />
              <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  question: "Do I need to know about crypto to use MyUSIC?",
                  answer:
                    "Nope! If you can use Netflix, you can use MyUSIC. Just get a wallet (like downloading an app) and add some USDC (like adding a credit card). We've made everything as simple as possible.",
                },
                {
                  question: "How much does it cost to listen to music?",
                  answer:
                    "It depends on the artist! Most charge $0.001 to $0.05 per stream. With $10, you can stream hundreds or thousands of songs. Plus, if you hold an artist's tokens, you might stream for FREE!",
                },
                {
                  question: "Is my money safe?",
                  answer:
                    "Yes! Your crypto wallet (like MetaMask or Coinbase Wallet) is controlled only by you. MyUSIC can't access your funds without your permission. Every transaction requires your approval. Just never share your secret phrase!",
                },
                {
                  question: "What if I'm an artist on Spotify? Can I be on both?",
                  answer:
                    "Many artists are on both. MyUSIC is additive—it doesn't replace Spotify, it complements it. You can reach crypto-native audiences and earn way more per stream here.",
                },
                {
                  question: "How do artists get paid?",
                  answer:
                    "Instantly! Every stream sends USDC directly to the artist's wallet in real-time. No waiting 90 days, no minimums, no payment processors. Artists can spend their earnings immediately.",
                },
                {
                  question: "Can I really make money as a fan?",
                  answer:
                    "Yes! If you buy an artist's tokens early and they become popular, your tokens increase in value. You can sell them for profit. It's like being an early investor in a startup, except it's your favorite musician.",
                },
                {
                  question: "What's the catch?",
                  answer:
                    "There isn't one! You do need to learn basic crypto concepts (wallets, tokens, transactions), but once you get it, it's super simple. The only downside is the music catalog is smaller than Spotify (for now).",
                },
                {
                  question: "What if an artist's token crashes?",
                  answer:
                    "Token prices can go up OR down based on supply and demand. Only invest what you can afford to lose. Think of it like supporting a Kickstarter—you're betting on an artist you believe in. If they succeed, you profit. If not, you supported art you love.",
                },
                {
                  question: "How is this legal?",
                  answer:
                    "100% legal! MyUSIC operates on public blockchains (Base/Ethereum). Artists retain all rights to their music. Tokens are utility tokens that provide benefits (like free streaming), not securities. Everything is transparent and on-chain.",
                },
                {
                  question: "What if I lose my wallet password?",
                  answer:
                    "If you lose your secret phrase (12 words), your funds are gone forever. That's why it's CRITICAL to write it down on paper and store it safely. No one—not even MyUSIC—can recover lost wallets. This is the tradeoff for total control.",
                },
              ].map((faq, idx) => (
                <Card
                  key={idx}
                  className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-rose-500/30 transition-colors"
                >
                  <h3 className="text-lg font-semibold mb-3 flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed pl-7">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Call to Action */}
          <section className="animate-slide-up">
            <Card className="bg-gradient-to-br from-rose-500/20 to-orange-500/20 backdrop-blur-xl border border-rose-500/30 p-12 text-center">
              <Heart className="h-16 w-16 text-rose-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">Ready to Join the Music Revolution?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Whether you're an artist looking to earn fairly or a fan wanting to support musicians directly, MyUSIC
                is the future of music streaming.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600"
                  >
                    Start Listening
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/upload">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-rose-500/50 hover:bg-rose-500/10"
                  >
                    Upload Your Music
                    <Upload className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          {/* Additional Resources */}
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-6 text-center">More Resources</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Link href="/docs/getting-started">
                <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-rose-500/30 transition-colors h-full">
                  <h3 className="text-lg font-semibold mb-2">Quick Start Guide</h3>
                  <p className="text-sm text-muted-foreground">Get up and running in 5 minutes</p>
                </Card>
              </Link>
              <Link href="/docs/artist-guide">
                <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-rose-500/30 transition-colors h-full">
                  <h3 className="text-lg font-semibold mb-2">Full Artist Guide</h3>
                  <p className="text-sm text-muted-foreground">Deep dive for musicians and creators</p>
                </Card>
              </Link>
              <Link href="/docs/x402-protocol">
                <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 hover:border-rose-500/30 transition-colors h-full">
                  <h3 className="text-lg font-semibold mb-2">X402 Protocol Docs</h3>
                  <p className="text-sm text-muted-foreground">Technical details for developers</p>
                </Card>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
