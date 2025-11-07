import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, Shield, Star, Zap } from "lucide-react"
import Link from "next/link"

export default function AgentsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Bot className="h-12 w-12 text-primary" />
          <h1 className="text-5xl font-bold">AI Agents</h1>
        </div>
        <p className="text-xl text-muted-foreground">
          Trustless AI agents powered by ERC-8004 for automated music curation and operations
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6">
          <Shield className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Verified Identity</h3>
          <p className="text-muted-foreground">All agents have on-chain identities registered via ERC-8004 NFTs</p>
        </Card>

        <Card className="p-6">
          <Star className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Reputation System</h3>
          <p className="text-muted-foreground">
            Transparent feedback and ratings ensure agent quality and trustworthiness
          </p>
        </Card>

        <Card className="p-6">
          <Zap className="h-8 w-8 text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Validated Actions</h3>
          <p className="text-muted-foreground">Independent validators verify agent operations for added security</p>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Available Agents</h2>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Playlist Curator</h3>
                <p className="text-muted-foreground mb-2">
                  Automated playlist generation based on listening patterns and mood
                </p>
                <div className="flex gap-2 text-sm">
                  <span className="text-primary">⭐ 4.8/5.0</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">127 reviews</span>
                </div>
              </div>
            </div>
            <Button>View Agent</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Royalty Distributor</h3>
                <p className="text-muted-foreground mb-2">
                  Automated royalty calculations and distributions to artists
                </p>
                <div className="flex gap-2 text-sm">
                  <span className="text-primary">⭐ 4.9/5.0</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">203 reviews</span>
                </div>
              </div>
            </div>
            <Button>View Agent</Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Discovery Engine</h3>
                <p className="text-muted-foreground mb-2">AI-powered music recommendations tailored to your taste</p>
                <div className="flex gap-2 text-sm">
                  <span className="text-primary">⭐ 4.7/5.0</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">89 reviews</span>
                </div>
              </div>
            </div>
            <Button>View Agent</Button>
          </div>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <Link href="/agents/register">
          <Button size="lg">
            <Bot className="h-5 w-5 mr-2" />
            Register Your Agent
          </Button>
        </Link>
      </div>
    </div>
  )
}
