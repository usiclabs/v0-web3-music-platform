"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Zap,
  Wallet,
  TrendingUp,
  Shield,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Lightbulb,
  Rocket,
  PlayCircle,
} from "lucide-react"

export default function MMDocsPage() {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
        <div className="container max-w-6xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <Zap className="h-6 w-6 text-rose-400" />
              </div>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30">Documentation</Badge>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-4 text-pretty">
              Market Maker <span className="text-rose-400">Agent</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-pretty">
              Autonomous liquidity provision and 24/7 volume generation for Web3 tokens on Base. Deploy in 60 seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                View Features
              </Button>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Deploy Time", value: "60s" },
              { label: "Max Wallets", value: "20" },
              { label: "Supported Tokens", value: "Any" },
              { label: "Uptime", value: "24/7" },
            ].map((stat, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur">
                <p className="text-xs font-semibold text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-rose-400">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <Tabs defaultValue="getting-started" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2 bg-transparent border border-border/50 p-1.5 rounded-xl h-auto">
            {[
              { value: "getting-started", label: "Getting Started", icon: "→" },
              { value: "features", label: "Features", icon: "✨" },
              { value: "guide", label: "How-To", icon: "?" },
              { value: "advanced", label: "Advanced", icon: "⚙️" },
              { value: "faq", label: "FAQ", icon: "?" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-300 data-[state=active]:border-rose-500/30 border border-transparent rounded-lg transition-all"
              >
                <span className="mr-1.5">{tab.icon}</span>
                <span className="text-xs sm:text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Rocket className="h-6 w-6" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {[
                    { step: "1", title: "Connect Your Wallet", desc: "Link your Web3 wallet to authenticate" },
                    { step: "2", title: "Deploy Agent", desc: "Click deploy to create your MM agent" },
                    { step: "3", title: "Configure Settings", desc: "Select tokens and trading parameters" },
                    { step: "4", title: "Fund Wallets", desc: "Send ETH to wallets for gas and trading" },
                    { step: "5", title: "Go Live", desc: "Enable agent and watch volume flow in" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 p-4 rounded-xl bg-card/70 border border-border/50 hover:border-rose-500/30 transition-colors group cursor-pointer"
                    >
                      <div className="flex h-8 w-8 min-w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 font-bold group-hover:bg-rose-500/30 transition-colors">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-rose-400/50 transition-colors" />
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex gap-3">
                  <Lightbulb className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-400 mb-1">Pro Tip</p>
                    <p className="text-xs text-muted-foreground">
                      Start with Base Mode (5 wallets), upgrade to Pro (10) or Max (20) as you scale.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Zap,
                  label: "Deploy in 60 Seconds",
                  desc: "No complex setup or configuration required",
                },
                {
                  icon: TrendingUp,
                  label: "24/7 Autonomous Trading",
                  desc: "AI-powered market maker that never sleeps",
                },
                {
                  icon: Shield,
                  label: "Non-Custodial",
                  desc: "Maintain full control of your wallets and keys",
                },
                {
                  icon: Zap,
                  label: "Any Token Support",
                  desc: "Works with USI, DEUS, or custom ERC20 tokens",
                },
              ].map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <Card
                    key={idx}
                    className="border-border/50 bg-card/50 hover:border-rose-500/30 transition-colors group cursor-pointer"
                  >
                    <CardContent className="pt-6">
                      <Icon className="h-6 w-6 text-rose-400 mb-3 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-semibold mb-2">{benefit.label}</p>
                      <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Wallet Architecture</CardTitle>
                <CardDescription>Flexible deployment sizes for every use case</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    name: "Base Mode",
                    wallets: 5,
                    desc: "Perfect for getting started and testing strategies",
                    features: ["5 Secure Wallets", "Standard trading", "Essential monitoring"],
                  },
                  {
                    name: "Pro Mode",
                    wallets: 10,
                    desc: "For growing projects requiring higher volume",
                    features: ["10 Secure Wallets", "2x volume capacity", "Advanced analytics"],
                  },
                  {
                    name: "Max Mode",
                    wallets: 20,
                    desc: "Enterprise deployment for maximum liquidity",
                    features: ["20 Secure Wallets", "4x volume capacity", "Priority support"],
                  },
                ].map((mode, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-muted/50 border border-border/50 hover:border-rose-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-base">{mode.name}</p>
                        <p className="text-sm text-rose-400 font-medium mt-1">{mode.wallets} Wallets</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{mode.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {mode.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Trading Modes</CardTitle>
                <CardDescription>Strategies optimized for different market conditions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    name: "Standard Mode",
                    icon: "⚡",
                    desc: "Continuous autonomous buy/sell cycles",
                    default: "5 min buy, 10 min sell",
                    best: "Consistent liquidity provision",
                  },
                  {
                    name: "Profitable Mode",
                    icon: "💰",
                    desc: "Smart profit protection on all sells",
                    default: "10% minimum profit threshold",
                    best: "Risk management & ROI optimization",
                  },
                  {
                    name: "Burst Mode",
                    icon: "🚀",
                    desc: "Rapid-fire trading sequences",
                    default: "Up to 20 trades per sequence",
                    best: "Token launches & peak demand events",
                  },
                ].map((mode, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl bg-muted/50 border border-border/50 group hover:border-rose-500/30 transition-colors"
                  >
                    <div className="flex gap-4">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{mode.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-base mb-1">{mode.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{mode.desc}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {mode.default}
                          </Badge>
                          <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-xs">{mode.best}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* How-To Guide Tab */}
          <TabsContent value="guide" className="space-y-6">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  Funding Your Agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {[
                    {
                      step: "Step 1",
                      title: "View Wallet Addresses",
                      desc: "Click 'Wallets' in the dashboard to see all agent wallet addresses",
                    },
                    {
                      step: "Step 2",
                      title: "Send ETH or Tokens",
                      desc: "Transfer ETH for gas fees or target tokens for selling operations",
                    },
                    {
                      step: "Step 3",
                      title: "Use Fund Dialog",
                      desc: "Click 'Fund' next to any wallet for streamlined transfers",
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/50 border border-border/50">
                      <Badge className="mb-2 bg-rose-500/20 text-rose-300">{item.step}</Badge>
                      <p className="font-semibold text-sm mb-1">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <PlayCircle className="h-6 w-6" />
                  Test Run Your Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Before activating continuous trading, run a single cycle to validate your configuration
                </p>
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <p className="text-sm font-semibold text-rose-300 mb-3">Test Cycle Process</p>
                  <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Configure your strategy and save settings</li>
                    <li>Click "Test Run" button to execute one cycle</li>
                    <li>System performs one buy and one sell transaction</li>
                    <li>View results in the activity feed</li>
                    <li>Review stats and adjust settings if needed</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Shield className="h-6 w-6" />
                  Security & Key Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Non-Custodial Architecture</h4>
                    <p className="text-xs text-muted-foreground">
                      Private keys are generated server-side, encrypted, and stored securely. You maintain complete
                      control.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Export Private Keys</h4>
                    <p className="text-xs text-muted-foreground">
                      Click "Export Key" on any wallet card to decrypt and backup the private key for manual wallet
                      recovery
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex gap-3">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300/80">
                    Private keys grant full access to funds. Store securely and never share or expose them.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl">Custom Token Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  All users can run the MM agent on any ERC-20 token. Simply paste the contract address and the system
                  handles everything.
                </p>
                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30">
                  <p className="text-xs font-semibold text-rose-300 mb-2">Automatic Features</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>✓ Automatic symbol detection</li>
                    <li>✓ Uniswap V3 pool discovery</li>
                    <li>✓ Multi-fee-tier support (0.01%, 0.05%, 0.30%, 1%)</li>
                    <li>✓ Optimal pool selection for best execution</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            {[
              {
                q: "How much does it cost?",
                a: "The MM Agent is free to use. You only pay gas fees for transactions and Uniswap trading fees (0.01%-1%).",
              },
              {
                q: "How much capital do I need?",
                a: "Minimum 0.0001 ETH per wallet for gas fees. Recommended: 0.01-0.1 ETH per wallet depending on trading volume goals.",
              },
              {
                q: "Can I use this with any token?",
                a: "Yes! The system supports any ERC-20 token on Base. Just paste the contract address and you're ready.",
              },
              {
                q: "How do I withdraw funds?",
                a: "Click 'Withdraw' on any wallet to send funds back to your connected wallet. You can also use exported private keys to access wallets directly.",
              },
              {
                q: "What if I want to scale up?",
                a: "Enable Pro Mode (10 wallets) or Max Mode (20 wallets) in configuration. Fund additional wallets and continue trading.",
              },
              {
                q: "Is my money safe?",
                a: "Yes. The system is non-custodial - you maintain full control. Private keys are encrypted server-side and never exposed.",
              },
              {
                q: "Can I run multiple agents?",
                a: "Currently one agent per wallet address. Each agent can trade multiple tokens by switching configuration.",
              },
              {
                q: "What is Profitable Mode?",
                a: "Profitable Mode enforces a 10% minimum profit threshold on all sells, protecting you from losses in unfavorable markets.",
              },
              {
                q: "What is Burst Mode?",
                a: "Burst Mode executes up to 20 rapid-fire trades in sequence, perfect for token launches and peak demand events.",
              },
              {
                q: "How do I contact support?",
                a: "Check the main dashboard for support links or community channels. We're here to help!",
              },
            ].map((faq, idx) => (
              <Card
                key={idx}
                className="border-border/50 bg-card/50 cursor-pointer hover:border-rose-500/30 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === String(idx) ? null : String(idx))}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-pretty">{faq.q}</h3>
                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${expandedFaq === String(idx) ? "rotate-90" : ""}`}
                    />
                  </div>
                </CardHeader>
                {expandedFaq === String(idx) && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* CTA Section */}
        <div className="mt-20 p-8 rounded-2xl bg-gradient-to-r from-rose-500/10 to-red-500/10 border border-rose-500/20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Deploy Your Agent?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Set up your Market Maker Agent in 60 seconds and start generating volume 24/7.
          </p>
          <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white font-semibold">
            Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
