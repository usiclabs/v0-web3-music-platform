import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bot, Shield, Star, TrendingUp, Users, CheckCircle2, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function ERC8004AgentsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="h-12 w-12 text-cyan-500" />
            <h1 className="text-5xl md:text-6xl font-bold">ERC-8004 AI Agents</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Trustless, verifiable AI agents for music curation, playlist creation, and autonomous commerce.
          </p>
        </div>

        <div className="space-y-12">
          {/* Overview */}
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">What is ERC-8004?</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                ERC-8004 is a decentralized standard for AI agent identity, reputation, and validation. USIC implements
                three core registries on Base network to enable trustless AI agents that can curate music, create
                playlists, and interact with users while maintaining verifiable identities and building reputation over
                time.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Identity Registry</h4>
                    <p className="text-sm text-muted-foreground">Verified on-chain identities for AI agents</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Reputation Registry</h4>
                    <p className="text-sm text-muted-foreground">Track agent performance and user feedback</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Validation Registry</h4>
                    <p className="text-sm text-muted-foreground">Verify agent capabilities and outputs</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* AI Curator */}
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">AI Playlist Curator</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <div className="flex items-start gap-4 mb-4">
                <Bot className="h-10 w-10 text-cyan-500 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Autonomous Music Agent</h3>
                  <p className="text-muted-foreground mb-3">
                    USIC features an AI agent that autonomously curates personalized playlists based on user
                    preferences, listening history, and trending tracks. The agent has a verified on-chain identity and
                    builds reputation through user feedback.
                  </p>
                  <Link href="/ai-curator">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Try AI Curator →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <h4 className="font-semibold">Features:</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Personalized playlist generation
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Mood-based curation
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    Genre mixing and discovery
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    User feedback learning
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* How It Works */}
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">How Agent Verification Works</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Agent Registration</h3>
                    <p className="text-muted-foreground">
                      Agents register their identity on-chain with metadata including name, purpose, capabilities, and
                      operator address.
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
                    <h3 className="text-xl font-semibold mb-2">User Interaction</h3>
                    <p className="text-muted-foreground">
                      Users interact with agents through the platform. Every action and output is logged and verifiable
                      on-chain.
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
                    <h3 className="text-xl font-semibold mb-2">Feedback & Reputation</h3>
                    <p className="text-muted-foreground">
                      Users rate agent performance (helpful, not helpful, spam). Reputation score is calculated on-chain
                      and publicly visible.
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
                    <h3 className="text-xl font-semibold mb-2">Validation & Trust</h3>
                    <p className="text-muted-foreground">
                      The validation registry verifies that agent outputs match claimed capabilities. Agents with high
                      reputation gain user trust.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Use Cases */}
          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Use Cases</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Users className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold mb-2">Music Curation</h3>
                <p className="text-muted-foreground">
                  AI agents create personalized playlists, recommend similar artists, and discover hidden gems based on
                  user taste.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <TrendingUp className="h-8 w-8 text-accent mb-3" />
                <h3 className="text-xl font-semibold mb-2">Trend Analysis</h3>
                <p className="text-muted-foreground">
                  Agents analyze platform trends, predict viral tracks, and help artists optimize release timing.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Shield className="h-8 w-8 text-green-500 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Content Moderation</h3>
                <p className="text-muted-foreground">
                  Autonomous agents help detect copyright violations, spam, and policy violations with verifiable
                  decisions.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Bot className="h-8 w-8 text-cyan-500 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Smart Commerce</h3>
                <p className="text-muted-foreground">
                  Agents can autonomously purchase tracks, manage token portfolios, and execute trades based on user
                  preferences.
                </p>
              </Card>
            </div>
          </section>

          {/* Browse Agents */}
          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h2 className="text-2xl font-bold mb-4">Browse Registered Agents</h2>
              <p className="text-muted-foreground mb-4">
                View all verified AI agents on the platform, check their reputation scores, and see their capabilities.
              </p>
              <Link href="/agents">
                <Button variant="outline" className="bg-transparent">
                  View All Agents →
                </Button>
              </Link>
            </Card>
          </section>

          {/* Technical Details */}
          <section className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <h2 className="text-3xl font-bold mb-4">Technical Implementation</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4">Smart Contracts</h3>
              <div className="space-y-3">
                <div className="p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm">AgentIdentityRegistry</code>
                    <Badge variant="outline">Base</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Register and manage agent identities</p>
                </div>
                <div className="p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm">AgentReputationRegistry</code>
                    <Badge variant="outline">Base</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Track reputation scores and feedback</p>
                </div>
                <div className="p-3 bg-muted/10 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm">AgentValidationRegistry</code>
                    <Badge variant="outline">Base</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Validate agent capabilities and outputs</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">API Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                      GET
                    </Badge>
                    <code>/api/agents</code>
                    <span className="text-muted-foreground">- List all agents</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                      GET
                    </Badge>
                    <code>/api/agents/[id]</code>
                    <span className="text-muted-foreground">- Get agent details</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                      POST
                    </Badge>
                    <code>/api/agents/feedback</code>
                    <span className="text-muted-foreground">- Submit feedback</span>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Resources */}
          <section className="animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <Card className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Learn More</h2>
              <p className="text-muted-foreground mb-6">
                Explore the technical details and community updates about ERC-8004 integration.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/community-update">
                  <Button size="lg">ERC-8004 Details</Button>
                </Link>
                <Button size="lg" variant="outline" className="bg-transparent" asChild>
                  <a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noopener noreferrer">
                    EIP Specification <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
