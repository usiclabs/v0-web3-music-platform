"use client"

import { useState } from "react"
import { Code, Copy, Download, Github, BookOpen, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const SPEC_EXAMPLES = {
  typescript: `import { AgentSkill, SkillParameter } from '@usic/agents'

// Define a custom skill
const myCustomSkill: AgentSkill = {
  id: 'my-custom-skill',
  name: 'My Custom Skill',
  category: 'discovery',
  description: 'A custom agent skill',
  longDescription: 'Detailed description...',
  icon: 'Music',
  color: 'cyan',
  capabilities: ['feature1', 'feature2'],
  parameters: [
    {
      name: 'threshold',
      type: 'number',
      description: 'Decision threshold',
      required: true,
      default: 50
    }
  ],
  complexity: 'intermediate',
  tags: ['custom', 'trading'],
  apiEndpoint: '/api/agents/skills/my-custom'
}

// Use the skill
await agent.executeSkill(myCustomSkill, {
  threshold: 65
})`,

  json: `{
  "id": "artist-discovery",
  "name": "Artist Discovery Engine",
  "category": "discovery",
  "description": "Autonomously scout rising artists",
  "capabilities": [
    "Real-time artist monitoring",
    "Streaming velocity analysis"
  ],
  "parameters": [
    {
      "name": "minStreamingVelocity",
      "type": "number",
      "description": "Minimum streams per day",
      "required": true,
      "default": 10000
    }
  ],
  "complexity": "intermediate",
  "metrics": {
    "successRate": 0.78,
    "totalExecutions": 1247
  }
}`,

  python: `from usic.agents import AgentSkill, SkillParameter

# Execute a skill from Python
class MyAgent:
    async def discover_artists(self):
        skill = {
            'id': 'artist-discovery',
            'parameters': {
                'minStreamingVelocity': 10000,
                'sentimentThreshold': 65
            }
        }
        result = await self.execute_skill(skill)
        return result

# Combine multiple skills
async def smart_portfolio():
    # First: discover artists
    discoveries = await agent.discover_artists()
    
    # Then: add to portfolio
    for artist in discoveries:
        await agent.execute_skill('portfolio-rebalancer', {
            'strategy': 'equal-weight'
        })`,

  rest: `# Get available skills
GET /api/agents/skills

# Execute a skill
POST /api/agents/skills/artist-discovery/execute
Content-Type: application/json

{
  "parameters": {
    "minStreamingVelocity": 10000,
    "sentimentThreshold": 65,
    "maxMarketCap": 100000
  }
}

# Response
{
  "taskId": "task_abc123",
  "status": "executing",
  "startedAt": "2026-05-01T04:00:00Z"
}`,
}

const SKILL_CATEGORIES = [
  {
    name: "Discovery",
    value: "discovery",
    description: "Find emerging artists and opportunities",
  },
  {
    name: "Portfolio",
    value: "portfolio",
    description: "Manage and optimize token holdings",
  },
  {
    name: "Trading",
    value: "trading",
    description: "Execute trades and market making",
  },
  {
    name: "Streaming",
    value: "streaming",
    description: "Optimize royalties and engagement",
  },
]

export default function SkillDocumentationPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-cyan-500" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Documentation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Skill Specification</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Learn how to create, configure, and execute agent skills on the USIC platform. Build sophisticated workflows by composing multiple skills.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-12">
        <div className="space-y-12">
          {/* Overview Section */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Overview</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-cyan-500/10">
                <CardHeader>
                  <CardTitle className="text-lg">What are Skills?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Skills are modular units of agent capability. Each skill performs a specific function within the USIC ecosystem, from discovering artists
                    to executing trades.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Autonomous execution</li>
                    <li>Configurable parameters</li>
                    <li>Real-time metrics</li>
                    <li>Composable workflows</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-emerald-500/10">
                <CardHeader>
                  <CardTitle className="text-lg">Skill Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {SKILL_CATEGORIES.map((cat) => (
                    <div key={cat.value} className="p-2 rounded-lg bg-background/50">
                      <p className="font-medium text-foreground">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Core Concepts */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Core Concepts</h2>
            <div className="space-y-3">
              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Skill Schema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Every skill has:</p>
                  <div className="grid md:grid-cols-2 gap-3 mt-3">
                    {[
                      { label: "ID", desc: "Unique identifier" },
                      { label: "Name", desc: "Human-readable name" },
                      { label: "Category", desc: "Type of capability" },
                      { label: "Parameters", desc: "Configuration options" },
                      { label: "Metrics", desc: "Performance data" },
                      { label: "Complexity", desc: "Difficulty level" },
                    ].map((item) => (
                      <div key={item.label} className="p-2 rounded-lg bg-background/50">
                        <p className="font-medium text-foreground">{item.label}</p>
                        <p className="text-xs">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>Parameters control skill behavior. Each parameter has:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>
                      <strong>Type</strong> - string, number, boolean, or array
                    </li>
                    <li>
                      <strong>Required</strong> - whether parameter is mandatory
                    </li>
                    <li>
                      <strong>Default</strong> - fallback value if not provided
                    </li>
                    <li>
                      <strong>Options</strong> - valid choices (for enums)
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Code Examples */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Implementation Examples</h2>
            <Tabs defaultValue="typescript" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 bg-card/50 border border-cyan-500/10">
                <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="rest">REST API</TabsTrigger>
                <TabsTrigger value="json">JSON Schema</TabsTrigger>
              </TabsList>

              {Object.entries(SPEC_EXAMPLES).map(([key, code]) => (
                <TabsContent key={key} value={key}>
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <CardTitle className="text-base">Example</CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(code)}
                        className={`transition-all ${copiedCode === code ? "bg-emerald-500/10 border-emerald-500/30" : ""}`}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        {copiedCode === code ? "Copied!" : "Copy"}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto text-xs text-cyan-400 font-mono border border-border/30">
                        <code>{code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </section>

          {/* API Reference */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">API Reference</h2>
            <div className="space-y-3">
              {[
                {
                  method: "GET",
                  endpoint: "/api/agents/skills",
                  desc: "List all available skills",
                },
                {
                  method: "GET",
                  endpoint: "/api/agents/skills/:skillId",
                  desc: "Get skill details",
                },
                {
                  method: "POST",
                  endpoint: "/api/agents/skills/:skillId/execute",
                  desc: "Execute a skill",
                },
                {
                  method: "GET",
                  endpoint: "/api/agents/skills/:skillId/metrics",
                  desc: "Get skill performance metrics",
                },
              ].map((endpoint, i) => (
                <Card key={i} className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-0">{endpoint.method}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-cyan-400 break-all">{endpoint.endpoint}</p>
                        <p className="text-sm text-muted-foreground mt-1">{endpoint.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Best Practices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: "Start Simple",
                  desc: "Begin with beginner-level skills before combining advanced workflows",
                },
                {
                  title: "Monitor Metrics",
                  desc: "Track success rates and execution times to optimize your agents",
                },
                {
                  title: "Use Defaults",
                  desc: "Leverage default parameters to start, then customize based on results",
                },
                {
                  title: "Compose Workflows",
                  desc: "Chain multiple skills together for sophisticated multi-step operations",
                },
              ].map((practice, i) => (
                <Card key={i} className="bg-card/50 border-cyan-500/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{practice.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{practice.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-cyan-500/10 to-emerald-600/10 border-cyan-500/20">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Ready to Build?</h3>
                  <p className="text-muted-foreground">
                    Start creating intelligent agents using our skill framework. Access full documentation and examples on GitHub.
                  </p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Terminal className="w-4 h-4 mr-2" />
                    Get Started
                  </Button>
                  <Button variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
