"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Menu, Bell, ChevronRight } from "lucide-react"
import { AgentCarousel } from "@/components/agent-selection/agent-carousel"
import { AgentDetailPanel } from "@/components/agent-selection/agent-detail-panel"
import { CategoryFilters } from "@/components/agent-selection/category-filters"
import { AGENTS, CATEGORIES, type Agent } from "@/components/agent-selection/agent-data"
import Link from "next/link"

export default function AgentsPage() {
  const router = useRouter()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    setMounted(true)
    if (AGENTS.length > 0) {
      setSelectedAgent(AGENTS[2]) // Default to MIXERAI
    }
  }, [])

  const filteredAgents =
    selectedCategory === "all" ? AGENTS : AGENTS.filter((agent) => agent.category === selectedCategory || agent.category === "all")

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

      {/* Desktop Sidebar Navigation */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:w-48 lg:h-screen lg:bg-gradient-to-b lg:from-black lg:to-black/80 lg:border-r lg:border-red-500/20 lg:p-6 lg:flex lg:flex-col lg:z-30">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">Y</span>
          </div>
          <span className="text-white font-black tracking-wider">USIC</span>
        </Link>

        {/* Nav Items */}
        <nav className="space-y-1 flex-1">
          {[
            { label: "DASHBOARD", href: "/dashboard", active: false },
            { label: "CREATE", href: "/create", active: false },
            { label: "AGENTS", href: "/agents", active: true },
            { label: "LIBRARY", href: "/library", active: false },
            { label: "EARN", href: "/earn", active: false },
            { label: "ANALYTICS", href: "/analytics", active: false },
            { label: "COMMUNITY", href: "/community", active: false },
            { label: "SETTINGS", href: "/settings", active: false },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                item.active
                  ? "bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_20px_rgba(255,30,30,0.3)]"
                  : "text-white/60 hover:text-white/80 border border-transparent hover:border-white/10"
              }`}
            >
              <div className="w-4 h-4 rounded border border-current flex items-center justify-center" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Balance */}
        <div className="border-t border-red-500/20 pt-6">
          <p className="text-xs text-white/60 uppercase font-bold tracking-widest mb-2">YOUR BALANCE</p>
          <p className="text-2xl font-black text-white mb-2">88,888.88</p>
          <div className="h-12 bg-gradient-to-r from-red-500/20 to-red-500/10 rounded border border-red-500/20 flex items-center justify-center">
            <span className="text-xs text-red-400 font-bold">$USIC</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-48 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-black/80 backdrop-blur border-b border-red-500/20">
          <button className="p-2 hover:bg-red-500/10 rounded border border-red-500/30 transition-all">
            <Menu className="w-5 h-5 text-red-400" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white font-black text-xs">Y</span>
            </div>
            <span className="text-white font-black text-sm">USIC</span>
          </Link>

          <button className="p-2 hover:bg-red-500/10 rounded border border-red-500/30 transition-all relative">
            <Bell className="w-5 h-5 text-red-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500" />
          </button>
        </div>

        {/* Header Section */}
        <div className="flex-1 flex flex-col">
          {/* Desktop Top Bar */}
          <div className="hidden lg:flex items-center justify-between p-6 border-b border-red-500/20 bg-black/40 backdrop-blur">
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest">AI AGENT NETWORK</div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/60">$USIC 88,888.88</span>
              <button className="p-2 hover:bg-red-500/10 rounded border border-red-500/30 transition-all relative">
                <Bell className="w-5 h-5 text-red-400" />
                <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
              {/* Title Section */}
              <div className="mb-8 md:mb-12 text-center">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">AI AGENT NETWORK</p>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-3">
                  SELECT YOUR <span className="text-red-500">AGENT</span>
                </h1>
                <p className="text-sm md:text-base text-white/60">Specialized AI agents. Infinite possibilities.</p>
              </div>

              {/* Category Filters */}
              <div className="mb-8 md:mb-12">
                <CategoryFilters
                  categories={CATEGORIES}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
              </div>

              {/* Carousel */}
              <div className="mb-8 md:mb-12">
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6 mb-8 md:mb-12 pt-8 md:pt-12 border-t border-red-500/20">
                {[
                  { icon: "⚙️", label: "BUILT ON USIC", desc: "PROTOCOL" },
                  { icon: "🤖", label: "AI-POWERED", desc: "PERFORMANCE" },
                  { icon: "✓", label: "VERIFIED", desc: "CREATORS" },
                  { icon: "🔒", label: "SECURE & SAFE", desc: "TRANSACTIONS" },
                  { icon: "👥", label: "COMMUNITY", desc: "DRIVEN" },
                ].map((feature, i) => (
                  <div key={i} className="text-center text-xs">
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <p className="font-bold text-white/80">{feature.label}</p>
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

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-red-500/20 p-4">
        <div className="flex items-center justify-around">
          {[
            { label: "DASHBOARD", href: "/dashboard" },
            { label: "AGENTS", href: "/agents", active: true },
            { label: "USIC", href: "/" },
            { label: "EARN", href: "/earn" },
            { label: "LIBRARY", href: "/library" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-xs font-bold uppercase tracking-widest transition-all ${
                item.active ? "text-red-400" : "text-white/60"
              }`}
            >
              <div
                className={`w-8 h-8 rounded flex items-center justify-center border-2 ${
                  item.active ? "border-red-500 bg-red-500/20" : "border-white/20"
                }`}
              >
                {item.label === "DASHBOARD" && "📊"}
                {item.label === "AGENTS" && "🤖"}
                {item.label === "USIC" && "Y"}
                {item.label === "EARN" && "💰"}
                {item.label === "LIBRARY" && "📚"}
              </div>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Padding for mobile bottom nav */}
      <div className="lg:hidden h-24" />
    </div>
  )
}
