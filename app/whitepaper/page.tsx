import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Music,
  Coins,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Lock,
  Repeat,
  ArrowRight,
  Download,
  CheckCircle2,
  Globe,
  BarChart3,
} from "lucide-react"

export default function WhitepaperPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-background to-muted/20 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-3 py-1.5 text-xs backdrop-blur-sm sm:px-4 sm:py-2 sm:text-sm">
            <Zap className="h-3 w-3 text-primary sm:h-4 sm:w-4" />
            <span className="font-medium">USIC Protocol Whitepaper v1.0</span>
          </div>
          <h1 className="mb-6 text-balance text-3xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            The Future of Music
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {" "}
              Streaming & Ownership
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg lg:text-xl">
            A comprehensive technical overview of USIC: the Web3 music platform revolutionizing how artists monetize and
            fans engage with music through blockchain technology, instant micropayments, and tokenized ownership.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="#introduction">
                Read Whitepaper
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
              <a href="/whitepaper.pdf" download>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="border-b bg-muted/30 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-xl font-bold sm:mb-6 sm:text-2xl">Table of Contents</h2>
          <nav className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "#introduction", title: "1. Executive Summary" },
              { href: "#problem", title: "2. Problem Statement" },
              { href: "#solution", title: "3. The USIC Solution" },
              { href: "#features", title: "4. Platform Features" },
              { href: "#technology", title: "5. Technology Stack" },
              { href: "#tokenomics", title: "6. Tokenomics" },
              { href: "#architecture", title: "7. Technical Architecture" },
              { href: "#market", title: "8. Market Opportunity" },
              { href: "#roadmap", title: "9. Roadmap" },
              { href: "#conclusion", title: "10. Conclusion" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border bg-background p-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Executive Summary */}
        <section id="introduction" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">1. Executive Summary</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              USIC (myusic.xyz) is a revolutionary Web3 music streaming platform built on Base blockchain that
              fundamentally reimagines how artists monetize their work and how fans engage with music. By leveraging the
              X402 protocol for instant micropayments, Uniswap V4 for native token swaps, and Clanker for profile
              tokenization, USIC creates a fair, transparent, and artist-first ecosystem where creators earn 100% of
              streaming revenue and fans can invest in their favorite artists through tokenized ownership.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Unlike traditional streaming platforms that pay artists fractions of a cent per stream, USIC enables
              direct artist-to-fan payments with zero intermediaries. Artists set their own streaming prices, tokenize
              their tracks and profiles, and build sustainable careers through multiple revenue streams including
              streaming royalties, token appreciation, and token-gated exclusive content.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-3">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <Music className="mb-2 h-6 w-6 text-primary sm:mb-3 sm:h-8 sm:w-8" />
                <div className="text-2xl font-bold sm:text-3xl">100%</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Artist Revenue Share</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <Zap className="mb-2 h-6 w-6 text-primary sm:mb-3 sm:h-8 sm:w-8" />
                <div className="text-2xl font-bold sm:text-3xl">Instant</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Micropayments via X402</div>
              </CardContent>
            </Card>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <Coins className="mb-2 h-6 w-6 text-primary sm:mb-3 sm:h-8 sm:w-8" />
                <div className="text-2xl font-bold sm:text-3xl">Tokenized</div>
                <div className="text-xs text-muted-foreground sm:text-sm">Tracks & Profiles</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Problem Statement */}
        <section id="problem" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">2. Problem Statement</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              The music streaming industry is fundamentally broken for artists:
            </p>
          </div>

          <div className="mt-6 space-y-4 sm:mt-8">
            {[
              {
                title: "Unfair Revenue Distribution",
                description:
                  "Spotify pays $0.003-0.005 per stream. Artists need 250,000+ streams monthly to earn minimum wage. Major labels and intermediaries capture 70%+ of revenue.",
              },
              {
                title: "Delayed Payments",
                description:
                  "Artists wait 3-6 months for royalty payments. Complex accounting systems obscure actual earnings. No real-time visibility into revenue.",
              },
              {
                title: "Lack of Ownership",
                description:
                  "Fans can't invest in artists they believe in. No mechanism for early supporters to benefit from artist success. Artists can't leverage their fanbase for capital.",
              },
              {
                title: "Platform Lock-in",
                description:
                  "Artists depend on centralized platforms. Algorithm changes can destroy careers overnight. No portability of audience or content.",
              },
            ].map((problem, index) => (
              <Card key={index}>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="mb-2 text-lg font-semibold sm:text-xl">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground sm:text-base">{problem.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Solution */}
        <section id="solution" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">3. The USIC Solution</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              USIC solves these problems through a comprehensive Web3 architecture that puts artists first:
            </p>
          </div>

          <div className="mt-6 grid gap-6 sm:mt-8 md:grid-cols-2">
            {[
              {
                icon: Zap,
                title: "Instant Micropayments",
                description:
                  "X402 protocol enables sub-cent payments per second of streaming. Artists receive 100% of revenue instantly with zero intermediaries.",
              },
              {
                icon: Coins,
                title: "Track Tokenization",
                description:
                  "Artists tokenize tracks as ERC20 or NFTs. Fans buy tokens to stream for free. Token holders benefit from track popularity growth.",
              },
              {
                icon: Users,
                title: "Profile Tokenization",
                description:
                  "One-time profile tokenization via Clanker. Fans invest in artist careers. Market cap reflects artist value and growth.",
              },
              {
                icon: Lock,
                title: "Token-Gated Content",
                description:
                  "Token holders bypass X402 payments. Exclusive access for supporters. Creates sustainable fan communities.",
              },
              {
                icon: Repeat,
                title: "Native Uniswap V4 Swaps",
                description:
                  "In-app token trading with deep liquidity. Real-time price discovery. Seamless ETH ↔ Token exchanges.",
              },
              {
                icon: Shield,
                title: "Transparent & Decentralized",
                description:
                  "All transactions on-chain and verifiable. No platform can censor or deplatform. Artists own their content and audience.",
              },
            ].map((solution, index) => (
              <Card key={index} className="border-primary/10">
                <CardContent className="p-4 sm:p-6">
                  <solution.icon className="mb-3 h-8 w-8 text-primary sm:mb-4 sm:h-10 sm:w-10" />
                  <h3 className="mb-1 text-lg font-semibold sm:mb-2 sm:text-xl">{solution.title}</h3>
                  <p className="text-sm text-muted-foreground sm:text-base">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Platform Features */}
        <section id="features" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">4. Platform Features</h2>

          <div className="space-y-12">
            {/* X402 Streaming */}
            <div>
              <h3 className="mb-3 text-2xl font-semibold sm:mb-4">4.1 X402 Micropayment Streaming</h3>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground sm:mb-4 sm:text-base">
                    The X402 protocol enables real-time micropayments for music streaming. Instead of subscription fees
                    or ad-supported models, listeners pay directly per second of audio consumed.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Pay-per-second model:</strong> Listeners only pay for what they actually listen to
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Instant settlement:</strong> Artists receive payments in real-time as tracks play
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Artist-set pricing:</strong> Creators control their own streaming rates
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Zero platform fees:</strong> 100% of streaming revenue goes to artists
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Track Tokenization */}
            <div>
              <h3 className="mb-3 text-2xl font-semibold sm:mb-4">4.2 Track Tokenization</h3>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground sm:mb-4 sm:text-base">
                    Artists can tokenize individual tracks as ERC20 tokens or NFTs, creating new revenue streams and
                    enabling fans to invest in specific songs.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>ERC20 or NFT options:</strong> Fungible tokens for liquidity or unique NFTs for
                        exclusivity
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Token-gated streaming:</strong> Token holders stream for free, bypassing X402 payments
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Royalty splits:</strong> Automatic revenue distribution to collaborators
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Tradeable on Uniswap V4:</strong> Native in-app swaps with deep liquidity
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Profile Tokenization */}
            <div>
              <h3 className="mb-3 text-2xl font-semibold sm:mb-4">4.3 Profile Tokenization</h3>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground sm:mb-4 sm:text-base">
                    Artists can tokenize their entire profile once via Clanker, creating a tradeable asset that
                    represents their career value and growth potential.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>One-time tokenization:</strong> Requires 10M $USI + 5 uploaded tracks
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Clanker integration:</strong> Automated deployment via Clanker protocol
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Market cap tracking:</strong> Real-time valuation via DexScreener
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Fan investment:</strong> Early supporters benefit from artist success
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Native Swaps */}
            <div>
              <h3 className="mb-3 text-2xl font-semibold sm:mb-4">4.4 Native Uniswap V4 Swaps</h3>
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground sm:mb-4 sm:text-base">
                    USIC integrates Uniswap V4 directly into the platform, enabling seamless token trading without
                    leaving the app.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>In-app swaps:</strong> Trade ETH for track/profile tokens without external DEXs
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Real-time quotes:</strong> Live pricing from Uniswap V4 pools
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Slippage protection:</strong> Configurable slippage tolerance for safe trades
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                      <div className="text-sm text-muted-foreground sm:text-base">
                        <strong>Deep liquidity:</strong> Access to Uniswap's massive liquidity pools
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section id="technology" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">5. Technology Stack</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              USIC is built on cutting-edge Web3 infrastructure, combining multiple protocols and technologies to create
              a seamless user experience.
            </p>
          </div>

          <div className="mt-6 space-y-6 sm:mt-8">
            {[
              {
                title: "Base Blockchain",
                description:
                  "Built on Coinbase's L2 for fast, cheap transactions. EVM-compatible for easy integration. Inherits Ethereum security with L2 scalability.",
                tech: "Layer 2 Blockchain",
              },
              {
                title: "X402 Protocol",
                description:
                  "HTTP 402 Payment Required standard for micropayments. Enables pay-per-second streaming model. Real-time settlement with minimal gas fees.",
                tech: "Payment Protocol",
              },
              {
                title: "Uniswap V4",
                description:
                  "Latest Uniswap protocol with hooks and singleton architecture. Native integration for in-app token swaps. Deep liquidity and efficient routing.",
                tech: "DEX Protocol",
              },
              {
                title: "Clanker",
                description:
                  "Automated token deployment protocol. One-time profile tokenization. Standardized token contracts and liquidity bootstrapping.",
                tech: "Token Deployment",
              },
              {
                title: "Livepeer",
                description:
                  "Decentralized video transcoding and streaming. Efficient video processing and delivery. Cost-effective alternative to centralized CDNs.",
                tech: "Video Infrastructure",
              },
              {
                title: "Supabase",
                description:
                  "PostgreSQL database for off-chain data. Real-time subscriptions and authentication. Scalable backend infrastructure.",
                tech: "Database",
              },
            ].map((tech, index) => (
              <Card key={index}>
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold sm:text-xl">{tech.title}</h3>
                    <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      {tech.tech}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground sm:text-base">{tech.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Tokenomics */}
        <section id="tokenomics" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">6. Tokenomics</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              The $USI token is the native utility token of the USIC platform, powering the entire ecosystem and
              aligning incentives between artists, fans, and the platform.
            </p>
          </div>

          <div className="mt-6 sm:mt-8">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center">
                  <Coins className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold sm:text-2xl">$USI Token</h3>
                    <p className="break-all text-xs text-muted-foreground sm:text-sm">
                      Contract: 0xECE5d962d17901ef200Da050C7c74AB45C96Db07
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-2 text-lg font-semibold sm:mb-3">Token Utility</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <div className="text-sm text-muted-foreground sm:text-base">
                          <strong>Profile Tokenization:</strong> 10M $USI required to tokenize artist profiles
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <div className="text-sm text-muted-foreground sm:text-base">
                          <strong>Platform Governance:</strong> Vote on protocol upgrades and parameter changes
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <div className="text-sm text-muted-foreground sm:text-base">
                          <strong>Staking Rewards:</strong> Earn yield by staking $USI tokens
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <div className="text-sm text-muted-foreground sm:text-base">
                          <strong>Fee Discounts:</strong> Reduced platform fees for $USI holders
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <div className="text-sm text-muted-foreground sm:text-base">
                          <strong>Exclusive Access:</strong> Premium features and early access to new releases
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-lg font-semibold sm:mb-3">Value Accrual</h4>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      $USI captures value from platform growth through multiple mechanisms: profile tokenization burns
                      (deflationary), staking rewards from platform fees, and increased demand as the platform scales.
                      As more artists tokenize profiles and more fans engage with the platform, $USI becomes
                      increasingly valuable.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Technical Architecture */}
        <section id="architecture" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">7. Technical Architecture</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              USIC's architecture combines on-chain and off-chain components to deliver a seamless user experience while
              maintaining decentralization and transparency.
            </p>
          </div>

          <div className="mt-6 space-y-6 sm:mt-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 text-xl font-semibold sm:mb-4">Smart Contract Layer</h3>
                <div className="space-y-3">
                  <div>
                    <strong className="text-primary">ERC20 Token Contracts:</strong>
                    <p className="text-sm text-muted-foreground">
                      Standard ERC20 implementation for track and profile tokens. Includes transfer restrictions,
                      royalty splits, and token-gating logic.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">NFT Contracts (ERC721):</strong>
                    <p className="text-sm text-muted-foreground">
                      Unique track ownership with metadata storage. Supports royalty standards (EIP-2981) for secondary
                      sales.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">Uniswap V4 Integration:</strong>
                    <p className="text-sm text-muted-foreground">
                      Direct integration with PoolManager and StateView contracts. Custom hooks for token-specific
                      trading logic.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">X402 Payment Channels:</strong>
                    <p className="text-sm text-muted-foreground">
                      State channels for micropayment streaming. Batch settlement to minimize gas costs.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 text-xl font-semibold sm:mb-4">Application Layer</h3>
                <div className="space-y-3">
                  <div>
                    <strong className="text-primary">Next.js Frontend:</strong>
                    <p className="text-sm text-muted-foreground">
                      Server-side rendering for SEO and performance. React Server Components for optimal data fetching.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">Wallet Integration:</strong>
                    <p className="text-sm text-muted-foreground">
                      WalletConnect v2 for multi-wallet support. Smart wallet integration for gasless transactions.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">Audio/Video Streaming:</strong>
                    <p className="text-sm text-muted-foreground">
                      Livepeer for video transcoding and delivery. Chunk-based audio streaming with X402 payment gates.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="mb-3 text-xl font-semibold sm:mb-4">Data Layer</h3>
                <div className="space-y-3">
                  <div>
                    <strong className="text-primary">Supabase PostgreSQL:</strong>
                    <p className="text-sm text-muted-foreground">
                      User profiles, track metadata, and analytics. Real-time subscriptions for live updates.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">IPFS Storage:</strong>
                    <p className="text-sm text-muted-foreground">
                      Decentralized storage for audio files and metadata. Content addressing for immutability.
                    </p>
                  </div>
                  <div>
                    <strong className="text-primary">The Graph Indexing:</strong>
                    <p className="text-sm text-muted-foreground">
                      Efficient querying of on-chain data. Real-time indexing of token transfers and swaps.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Market Opportunity */}
        <section id="market" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">8. Market Opportunity</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              The global music streaming market represents a massive opportunity for disruption through Web3 technology
              and fair artist compensation.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:mt-8 sm:gap-6 md:grid-cols-3">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <Globe className="mb-3 h-8 w-8 text-primary sm:mb-4 sm:h-10 sm:w-10" />
                <div className="mb-2 text-2xl font-bold sm:text-3xl">$38.6B</div>
                <div className="mb-2 text-xs font-medium sm:text-sm">Total Addressable Market (TAM)</div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Global music streaming market size in 2024, growing at 14.7% CAGR
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <TrendingUp className="mb-3 h-8 w-8 text-primary sm:mb-4 sm:h-10 sm:w-10" />
                <div className="mb-2 text-2xl font-bold sm:text-3xl">$5.2B</div>
                <div className="mb-2 text-xs font-medium sm:text-sm">Serviceable Addressable Market (SAM)</div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Web3-native music platforms and crypto-enabled streaming services
                </p>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 sm:p-6">
                <BarChart3 className="mb-3 h-8 w-8 text-primary sm:mb-4 sm:h-10 sm:w-10" />
                <div className="mb-2 text-2xl font-bold sm:text-3xl">$520M</div>
                <div className="mb-2 text-xs font-medium sm:text-sm">Serviceable Obtainable Market (SOM)</div>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Realistic 3-year target capturing 10% of Web3 music market
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 sm:mt-8">
            <CardContent className="p-4 sm:p-6">
              <h3 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">Competitive Advantages</h3>
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="text-sm sm:text-base">
                    <strong>100% artist revenue share</strong> vs 30% on traditional platforms
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="text-sm sm:text-base">
                    <strong>Instant payments</strong> vs 3-6 month delays
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="text-sm sm:text-base">
                    <strong>Tokenized ownership</strong> enabling fan investment
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="text-sm sm:text-base">
                    <strong>Native DEX integration</strong> for seamless trading
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="text-sm sm:text-base">
                    <strong>Decentralized infrastructure</strong> preventing platform lock-in
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                  <div className="text-sm sm:text-base">
                    <strong>Transparent on-chain accounting</strong> for all transactions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Roadmap */}
        <section id="roadmap" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">9. Roadmap</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              USIC's development roadmap focuses on progressive decentralization, feature expansion, and ecosystem
              growth.
            </p>
          </div>

          <div className="mt-6 space-y-6 sm:mt-8">
            {[
              {
                phase: "Phase 1: Foundation (Q3 2025)",
                status: "Completed",
                items: [
                  "Core platform launch with X402 streaming",
                  "Track tokenization (ERC20 & NFT)",
                  "Basic artist profiles and discovery",
                  "Wallet integration and authentication",
                ],
              },
              {
                phase: "Phase 2: Tokenization (Q4 2025)",
                status: "In Progress",
                items: [
                  "Profile tokenization via Clanker",
                  "Native Uniswap V4 swap integration",
                  "Token-gated streaming functionality",
                  "Market cap tracking and analytics",
                ],
              },
              {
                phase: "Phase 3: Ecosystem Growth (Q1 2026)",
                status: "Planned",
                items: [
                  "Mobile apps (iOS & Android)",
                  "Advanced analytics dashboard",
                  "Collaborative playlists and social features",
                  "Artist verification and badges",
                ],
              },
              {
                phase: "Phase 4: Decentralization (Q2 2026)",
                status: "Planned",
                items: [
                  "$USI governance token launch",
                  "DAO formation for protocol governance",
                  "Decentralized content moderation",
                  "Cross-chain expansion (Polygon, Arbitrum)",
                ],
              },
              {
                phase: "Phase 5: Scale (Q3-Q4 2026)",
                status: "Future",
                items: [
                  "AI-powered music discovery",
                  "Live streaming and virtual concerts",
                  "Merchandise integration and NFT drops",
                  "Label partnerships and major artist onboarding",
                ],
              },
            ].map((phase, index) => (
              <Card key={index}>
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold sm:text-xl">{phase.phase}</h3>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        phase.status === "Completed"
                          ? "bg-green-500/10 text-green-500"
                          : phase.status === "In Progress"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {phase.status}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
                        <span className="text-sm text-muted-foreground sm:text-base">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Conclusion */}
        <section id="conclusion" className="mb-16 scroll-mt-20 sm:mb-20">
          <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl">10. Conclusion</h2>
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              USIC represents a paradigm shift in how music is created, distributed, and monetized. By leveraging
              blockchain technology, instant micropayments, and tokenized ownership, we create a fair, transparent, and
              artist-first ecosystem that benefits all participants.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              The traditional music industry has failed artists for decades, extracting value while providing minimal
              compensation. USIC flips this model on its head: artists earn 100% of streaming revenue, receive instant
              payments, and can tokenize their work to unlock new revenue streams. Fans gain the ability to invest in
              artists they believe in, earning returns as those artists grow.
            </p>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              As we continue to build and scale USIC, our vision remains clear: create a sustainable music economy where
              artists can thrive, fans can participate in artist success, and everyone benefits from a transparent,
              decentralized platform. The future of music is on-chain, and USIC is leading the way.
            </p>
          </div>

          <Card className="mt-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent sm:mt-8">
            <CardContent className="p-6 text-center sm:p-8">
              <h3 className="mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">Join the Revolution</h3>
              <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">
                Be part of the future of music streaming and ownership
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Button size="lg" asChild className="w-full sm:w-auto">
                  <Link href="/dashboard/upload">
                    Start Creating
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto bg-transparent">
                  <Link href="/explore">Explore Music</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t pt-6 text-center text-xs text-muted-foreground sm:pt-8 sm:text-sm">
          <p>© 2025 USIC Protocol. All rights reserved.</p>
          <p className="mt-2">
            For more information, visit{" "}
            <a href="https://myusic.xyz" className="text-primary hover:underline">
              myusic.xyz
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
