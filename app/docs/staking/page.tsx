import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, TrendingUp, Lock, Coins, Calculator, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function StakingDocsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-5xl">💎</div>
            <h1 className="text-5xl md:text-6xl font-bold">$USI Staking</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Stake your $USI tokens to earn platform revenue share and participate in governance.
          </p>
        </div>

        <div className="space-y-12">
          {/* Overview */}
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Overview</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                Staking $USI allows token holders to earn a share of platform fees generated from X402 streaming
                payments, token swaps, and other revenue streams. Stakers also gain governance rights to vote on
                platform improvements and fee structures.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Earn APY</h4>
                    <p className="text-sm text-muted-foreground">Variable APY based on platform fees</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Governance Rights</h4>
                    <p className="text-sm text-muted-foreground">Vote on platform proposals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Flexible Terms</h4>
                    <p className="text-sm text-muted-foreground">No lockup period, unstake anytime</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* How It Works */}
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">How Staking Works</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Stake Your $USI</h3>
                    <p className="text-muted-foreground">
                      Deposit your $USI tokens into the staking vault. Minimum stake: 1M $USI. Your tokens remain in
                      your control and can be withdrawn anytime.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
                    <p className="text-muted-foreground">
                      Platform fees are collected and distributed to stakers proportionally. Rewards accrue in real-time
                      and can be claimed at any time.
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
                    <h3 className="text-xl font-semibold mb-2">Participate in Governance</h3>
                    <p className="text-muted-foreground">
                      Your staked $USI gives you voting power. Propose and vote on platform changes, fee adjustments,
                      and new features.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Unstake Anytime</h3>
                    <p className="text-muted-foreground">
                      No lockup period. Withdraw your staked $USI and claimed rewards whenever you want. Gas fees apply.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* APY Calculator */}
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Staking APY</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <div className="flex items-start gap-3 mb-4">
                <Calculator className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Dynamic APY</h3>
                  <p className="text-muted-foreground mb-4">
                    Staking APY is variable and depends on total platform fees collected and total amount staked. Higher
                    platform revenue = higher APY.
                  </p>
                </div>
              </div>

              <div className="bg-muted/10 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-3">Current Stats</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Staked</p>
                    <p className="text-2xl font-bold">50B $USI</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current APY</p>
                    <p className="text-2xl font-bold text-green-500">12.5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your Stake</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Earned Rewards</p>
                    <p className="text-2xl font-bold">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4">
                <h4 className="font-semibold mb-2">APY Formula</h4>
                <code className="text-sm">APY = (Total Annual Platform Fees × Staker Share %) / Total Staked $USI</code>
              </div>
            </Card>
          </section>

          {/* Revenue Sources */}
          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Revenue Sources</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">Staking rewards come from various platform fee sources:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">X402 Streaming Fees (5%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Platform takes 5% of all X402 streaming payments. 80% goes to stakers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Token Swap Fees (0.3%)</h4>
                    <p className="text-sm text-muted-foreground">
                      Trading fees from Uniswap V4 profile and track token swaps.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Profile Tokenization Fees</h4>
                    <p className="text-sm text-muted-foreground">
                      One-time fee when artists tokenize their profiles via Clanker.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Coins className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold">Premium Features</h4>
                    <p className="text-sm text-muted-foreground">Future premium features and subscription tiers.</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Risks */}
          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-bold mb-4">Risks & Considerations</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/50">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-500">
                  Staking involves smart contract risk. Always DYOR and only stake what you can afford to lose.
                </AlertDescription>
              </Alert>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <span>
                    <strong>Smart Contract Risk:</strong> Bugs or exploits in the staking contract could result in loss
                    of funds.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <span>
                    <strong>Variable APY:</strong> Staking rewards depend on platform activity and are not guaranteed.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <span>
                    <strong>Token Price:</strong> $USI price volatility can affect the USD value of your staked assets.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                  <span>
                    <strong>Gas Fees:</strong> Staking, unstaking, and claiming rewards require Base network gas fees.
                  </span>
                </li>
              </ul>
            </Card>
          </section>

          {/* Get Started */}
          <section className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Start Staking</h2>
              <p className="text-muted-foreground mb-6">
                Ready to earn rewards? Stake your $USI tokens and start earning platform revenue share.
              </p>
              <Link href="/staking">
                <Button size="lg">
                  <Lock className="h-5 w-5 mr-2" />
                  Stake $USI
                </Button>
              </Link>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
