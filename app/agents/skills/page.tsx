"use client"

import { useState, useEffect } from "react"
import { Activity, ArrowRight, BarChart3, Music, Radio, Share2, TrendingUp, Zap, Filter, Search, Code, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AGENT_SKILLS, getAllCategories, AgentSkill } from "@/lib/agents/skill-registry"
import Link from "next/link"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Radio,
  BarChart3,
  Music,
  TrendingUp,
  Zap,
  Share2,
}

export default function AgentSkillsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<AgentSkill | null>(AGENT_SKILLS[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const categories = getAllCategories()

  const filteredSkills = AGENT_SKILLS.filter((skill) => {
    const matchesCategory = !selectedCategory || skill.category === selectedCategory
    const matchesSearch =
      searchQuery === "" ||
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  if (!isHydrated) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-card/50 to-background">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-500" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Agent Framework</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Agent Skills</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Discover the capabilities AI agents can use to autonomously participate in the USIC ecosystem. Combine skills
            to create sophisticated multi-step workflows.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 bg-card/50 border-cyan-500/20 focus:border-cyan-500/40"
                />
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm ${
                    selectedCategory === null ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "hover:bg-accent/5 text-muted-foreground"
                  }`}
                >
                  All Skills
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all text-sm capitalize ${
                      selectedCategory === category
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "hover:bg-accent/5 text-muted-foreground"
                    }`}
                  >
                    {category.replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity Filter */}
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Complexity</h3>
              <div className="space-y-2">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <label key={level} className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground">
                    <input type="checkbox" className="w-4 h-4 rounded border-cyan-500/30 bg-card/50" />
                    <span className="capitalize text-muted-foreground">{level}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Skills Grid */}
            <div className="grid gap-4">
              {filteredSkills.map((skill) => {
                const IconComponent = ICON_MAP[skill.icon]
                return (
                  <button
                    key={skill.id}
                    onClick={() => setSelectedSkill(skill)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      selectedSkill?.id === skill.id
                        ? "bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/10"
                        : "bg-card/50 border-border/50 hover:border-cyan-500/20 hover:bg-card/80"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        skill.color === "cyan" ? "bg-cyan-500/10" : skill.color === "emerald" ? "bg-emerald-500/10" : "bg-teal-500/10"
                      }`}>
                        {IconComponent && <IconComponent className={`w-5 h-5 ${
                          skill.color === "cyan" ? "text-cyan-500" : skill.color === "emerald" ? "text-emerald-400" : "text-teal-400"
                        }`} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{skill.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{skill.description}</p>
                      </div>
                      <Badge variant="outline" className="capitalize text-xs flex-shrink-0">
                        {skill.complexity}
                      </Badge>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Skill Detail Panel */}
            {selectedSkill && (
              <Card className="border-0 bg-card/50 backdrop-blur shadow-xl border-t border-cyan-500/10">
                <CardHeader className="border-b border-cyan-500/10 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {ICON_MAP[selectedSkill.icon] && 
                          (() => {
                            const Icon = ICON_MAP[selectedSkill.icon]
                            return <Icon className="w-5 h-5 text-cyan-500" />
                          })()
                        }
                        {selectedSkill.name}
                      </CardTitle>
                      <CardDescription className="mt-2">{selectedSkill.longDescription}</CardDescription>
                    </div>
                    <Badge className="capitalize">{selectedSkill.complexity}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  {/* Metrics */}
                  {selectedSkill.metrics && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                        <p className="text-lg font-semibold text-emerald-400">{(selectedSkill.metrics.successRate * 100).toFixed(1)}%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                        <p className="text-xs text-muted-foreground mb-1">Avg Execution</p>
                        <p className="text-lg font-semibold text-cyan-400">{(selectedSkill.metrics.averageExecutionTime / 1000).toFixed(1)}s</p>
                      </div>
                      <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/10">
                        <p className="text-xs text-muted-foreground mb-1">Total Runs</p>
                        <p className="text-lg font-semibold text-teal-400">{selectedSkill.metrics.totalExecutions.toLocaleString()}</p>
                      </div>
                    </div>
                  )}

                  {/* Capabilities */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Capabilities</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedSkill.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parameters */}
                  {selectedSkill.parameters.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3">Configuration Parameters</h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {selectedSkill.parameters.map((param, i) => (
                          <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/30">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-sm font-medium">{param.name}</p>
                              <span className="text-xs text-muted-foreground">{param.type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{param.description}</p>
                            {param.default !== undefined && (
                              <p className="text-xs text-cyan-400/60 mt-2">Default: {String(param.default)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-border/30">
                    <Button className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                      <Code className="w-4 h-4 mr-2" />
                      View API Docs
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Try Demo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Activity Feed */}
            <Card className="border-0 bg-card/50 backdrop-blur shadow-xl border-t border-emerald-500/10">
              <CardHeader className="border-b border-emerald-500/10">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Live Agent Activity
                </CardTitle>
                <CardDescription>Real-time skill executions across the network</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-4">
                    {[
                      { skill: "Artist Discovery Engine", artist: "SoundWave Studios", status: "discovered", time: "2s ago" },
                      { skill: "Portfolio Rebalancer", status: "rebalanced", amount: "$2,450", time: "12s ago" },
                      { skill: "Market Maker Bot", status: "quote", artist: "Rising Star", time: "18s ago" },
                      { skill: "Token Sniper", status: "executed", tokens: "1.2K", time: "34s ago" },
                      { skill: "Streaming Optimizer", status: "optimized", revenue: "+8.3%", time: "1m ago" },
                      { skill: "Social Amplifier", status: "engagement", interactions: "127", time: "2m ago" },
                      { skill: "Artist Discovery Engine", artist: "Emerging Talent", status: "signals", time: "3m ago" },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.skill}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.status} {("artist" in activity && activity.artist) || ("amount" in activity && activity.amount) || ("tokens" in activity && activity.tokens) || ("revenue" in activity && activity.revenue) || ("interactions" in activity && activity.interactions) || ""}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
