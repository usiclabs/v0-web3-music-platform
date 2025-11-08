import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Shield, Zap, DollarSign, TrendingUp, Lock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AutoInvestmentPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-gradient-to-r from-[#e53e3e]/10 to-[#dc2626]/10 border border-[#e53e3e]/20 rounded-full">
            <Sparkles className="h-4 w-4 text-[#e53e3e]" />
            <span className="text-sm font-semibold text-[#e53e3e]">Automated Investing</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Auto-Investment</h1>
          <p className="text-xl text-muted-foreground">
            Enable seamless music discovery with automated payments. Listen without interruption while staying in full
            control of your budget.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">What is Auto-Investment?</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                Auto-Investment is a frictionless payment system that allows you to discover and stream music without
                signing a transaction for every song. Set your budget once, and the platform handles micropayments
                automatically as you listen.
              </p>
              <p className="text-muted-foreground mb-6">
                This feature transforms the music streaming experience by removing payment friction while maintaining
                full transparency and control over your spending.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Zap className="h-6 w-6 text-[#e53e3e] mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Frictionless</h4>
                    <p className="text-sm text-muted-foreground">Stream continuously without transaction prompts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Secure</h4>
                    <p className="text-sm text-muted-foreground">
                      Session keys with spending limits protect your wallet
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Budget Control</h4>
                    <p className="text-sm text-muted-foreground">Set daily and per-track spending limits</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  Set Your Budget
                </h3>
                <p className="text-muted-foreground mb-4">
                  Configure your auto-investment settings with daily spending limits and per-track maximums. You have
                  complete control over how much you spend.
                </p>
                <div className="bg-muted/10 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily Limit:</span>
                    <span className="font-mono font-semibold">$10.00 USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Per Track Limit:</span>
                    <span className="font-mono font-semibold">$1.00 USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Session Duration:</span>
                    <span className="font-mono font-semibold">24 hours</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  Create Session Key
                </h3>
                <p className="text-muted-foreground mb-4">
                  When you activate auto-investment, a temporary session key is generated. This key has limited
                  authority to spend only up to your configured limits and expires after 24 hours.
                </p>
                <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Lock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Your main wallet private key never leaves your device. The session key is stored securely and can
                    only execute pre-authorized actions.
                  </p>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  Stream Music Freely
                </h3>
                <p className="text-muted-foreground mb-4">
                  Discover and play music without interruption. The platform automatically handles X402 micropayments
                  using your session key, staying within your spending limits.
                </p>
                <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm font-mono text-muted-foreground">
                    {`✓ Playing "Midnight Dreams" - Artist Name
  Payment: $0.015 USDC (auto-paid)
  
✓ Playing "Electric Soul" - Another Artist
  Payment: $0.02 USDC (auto-paid)
  
✓ Daily spending: $2.45 / $10.00 remaining`}
                  </pre>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#e53e3e] to-[#dc2626] flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  Monitor & Revoke Anytime
                </h3>
                <p className="text-muted-foreground mb-4">
                  Track your spending in real-time and revoke your session key at any moment. Sessions automatically
                  expire after 24 hours for added security.
                </p>
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Full transparency: View every micro-transaction in your activity history.
                  </p>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Technical Architecture</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-4">
              <h3 className="text-xl font-semibold mb-3">Session Key System</h3>
              <p className="text-muted-foreground mb-4">
                Auto-investment uses a secure session key architecture built on top of EIP-3009
                (transferWithAuthorization). This enables gasless, pre-authorized USDC transfers without exposing your
                main wallet.
              </p>
              <div className="bg-muted/10 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm font-mono">
                  {`interface SessionKey {
  user_address: string        // Your wallet address
  session_key: string          // Temporary private key
  spending_limit: number       // Max daily spend
  spent_amount: number         // Current spending
  max_per_transaction: number  // Per-track limit
  valid_until: timestamp       // 24h expiry
  is_active: boolean          // Revocation status
}`}
                </pre>
              </div>
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Security Features
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Spending limits enforced at database level</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>24-hour automatic expiration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Instant revocation capability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Atomic spending updates prevent race conditions</span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#e53e3e]" />
                  Performance Benefits
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-[#e53e3e] mt-0.5">•</span>
                    <span>No wallet popups during streaming</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#e53e3e] mt-0.5">•</span>
                    <span>Instant payment authorization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#e53e3e] mt-0.5">•</span>
                    <span>Seamless music discovery</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#e53e3e] mt-0.5">•</span>
                    <span>Works with X402 micropayment protocol</span>
                  </li>
                </ul>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Platform Impact</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                  For Listeners
                </h3>
                <p className="text-muted-foreground mb-4">
                  Auto-investment removes the friction of micropayments, making it as easy to discover new music on
                  MyUSIC as it is on traditional streaming platforms—but with the added benefit of directly supporting
                  artists.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Uninterrupted listening experience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Discover new artists without commitment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Full control over budget and spending</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Transparent payment tracking</span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-[#e53e3e]" />
                  For Artists
                </h3>
                <p className="text-muted-foreground mb-4">
                  By reducing payment friction, auto-investment increases the likelihood that listeners will stream your
                  tracks. More streams mean more revenue, even with custom per-stream pricing as low as fractions of a
                  cent.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#e53e3e] mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Higher conversion rates from discovery to streams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#e53e3e] mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Instant payment settlement on-chain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#e53e3e] mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Listeners more likely to try new tracks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-[#e53e3e] mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Better user experience = more engagement</span>
                  </li>
                </ul>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-500" />
                  Platform Growth
                </h3>
                <p className="text-muted-foreground mb-4">
                  Auto-investment makes MyUSIC competitive with Web2 streaming platforms while maintaining Web3 benefits
                  like artist ownership and fair compensation.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Lowers barrier to entry for new users</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Bridges Web2 UX with Web3 economics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Increases platform stickiness and retention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Drives more transaction volume through protocol</span>
                  </li>
                </ul>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-bold mb-4">Best Practices</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-green-500/10 backdrop-blur-xl border border-green-500/20 p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Recommended Settings
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Set daily limits based on your listening habits</li>
                  <li>• Start with $5-10 daily for casual listening</li>
                  <li>• Per-track limit of $0.50-1.00 is reasonable</li>
                  <li>• Enable "Auto-unlock full songs" for favorites</li>
                  <li>• Review spending weekly to adjust limits</li>
                </ul>
              </Card>

              <Card className="bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Safety Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Never set limits higher than you can afford</li>
                  <li>• Revoke sessions when not actively using platform</li>
                  <li>• Monitor spending regularly in dashboard</li>
                  <li>• Sessions auto-expire after 24 hours</li>
                  <li>• Can revoke instantly if needed</li>
                </ul>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <h2 className="text-3xl font-bold mb-4">Integration with X402</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                Auto-investment works seamlessly with the X402 micropayment protocol. When you stream a track, the
                session key authorizes X402 chunk payments automatically without requiring wallet signatures.
              </p>
              <div className="bg-muted/10 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold mb-2">Combined Workflow:</p>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>User activates auto-investment session</li>
                  <li>User plays a track with custom artist pricing</li>
                  <li>X402 protocol streams audio in 30-second chunks</li>
                  <li>Session key auto-authorizes each chunk payment</li>
                  <li>Payments settle on-chain via EIP-3009</li>
                  <li>Artist receives revenue instantly</li>
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/docs/x402-protocol">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Learn about X402 Protocol →
                  </Button>
                </Link>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <Card className="bg-gradient-to-br from-[#e53e3e]/20 to-[#dc2626]/20 backdrop-blur-xl border border-[#e53e3e]/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Get Started with Auto-Investment</h2>
              <p className="text-muted-foreground mb-6">
                Enable frictionless music discovery today. Set your budget and start streaming without interruption.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auto-invest">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-[#e53e3e] to-[#dc2626] hover:from-[#dc2626] hover:to-[#b91c1c]"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Enable Auto-Investment
                  </Button>
                </Link>
                <Link href="/docs/getting-started">
                  <Button size="lg" variant="outline" className="bg-transparent">
                    Platform Guide
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
