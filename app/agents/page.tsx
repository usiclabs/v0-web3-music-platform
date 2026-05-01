"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { AgentCarousel } from "@/components/agent-selection/agent-carousel"
import { AgentDetailPanel } from "@/components/agent-selection/agent-detail-panel"
import { AGENTS, type Agent } from "@/components/agent-selection/agent-data"

export default function AgentsPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)

  useEffect(() => {
    setMounted(true)
    if (AGENTS.length > 0) {
      setSelectedAgent(AGENTS[2]) // Default to MIXERAI
    }
  }, [])

  const filteredAgents = AGENTS

  const handleDeploy = () => {
    if (selectedAgent) {
      router.push(`/dashboard/agent?id=${selectedAgent.id}`)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,30,30,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,30,30,0.03) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="min-h-screen flex flex-col">
        {/* Content Area */}
        <div className="flex-1 overflow-auto w-full">
          <div className="w-full max-w-6xl mx-auto px-3 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12 pb-32 md:pb-40">
            {/* Title Section */}
            <div className="mb-6 md:mb-8 lg:mb-12 text-center">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">AI AGENT NETWORK</p>
              <h1 className="text-3xl md:text-4xl lg:text-6xl font-black text-white mb-2 md:mb-3 leading-tight">
                SELECT YOUR <span className="text-red-500">AGENT</span>
              </h1>
              <p className="text-xs md:text-sm text-white/60 leading-relaxed">Specialized AI agents. Infinite possibilities.</p>
            </div>

            {/* Carousel - with extra bottom margin for pagination visibility */}
            <div className="mb-8 md:mb-12 lg:mb-16">
              <AgentCarousel
                agents={filteredAgents}
                selectedAgentId={selectedAgent?.id || ""}
                onSelectAgent={(id) => {
                  const agent = filteredAgents.find((a) => a.id === id)
                  if (agent) setSelectedAgent(agent)
                }}
              />
            </div>

            {/* Features Section */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 lg:gap-6 pt-6 md:pt-8 lg:pt-12 border-t border-red-500/20">
              {[
                { icon: "⚙️", label: "BUILT ON USIC", desc: "PROTOCOL" },
                { icon: "🤖", label: "AI-POWERED", desc: "PERFORMANCE" },
                { icon: "✓", label: "VERIFIED", desc: "CREATORS" },
                { icon: "🔒", label: "SECURE & SAFE", desc: "TRANSACTIONS" },
                { icon: "👥", label: "COMMUNITY", desc: "DRIVEN" },
              ].map((feature, i) => (
                <div key={i} className="text-center text-xs">
                  <div className="text-2xl md:text-3xl mb-2">{feature.icon}</div>
                  <p className="font-bold text-white/80 text-xs md:text-sm">{feature.label}</p>
                  <p className="text-white/50 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel - Sticky at Bottom */}
        <div className="border-t border-red-500/20 bg-black/60 backdrop-blur">
          <AgentDetailPanel agent={selectedAgent} onDeploy={handleDeploy} />
        </div>
      </div>
    </div>
  )
}
