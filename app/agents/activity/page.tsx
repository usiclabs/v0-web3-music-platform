"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Wallet,
  Sparkles,
  Music,
  TrendingUp,
  Users,
  DollarSign,
  Radio,
  Zap,
  ArrowRight,
  Activity,
  Bot,
  Cpu,
  Network,
  BarChart3,
  Home,
  PieChart,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

// ============================================================================
// TYPES
// ============================================================================

interface AgentNode {
  id: string
  name: string
  icon: React.ReactNode
  status: "active" | "scheduled" | "optimizing" | "idle"
  progress: number
  currentTask: string
  color: string
}

interface ActivityEvent {
  id: string
  agent: string
  agentIcon: React.ReactNode
  action: string
  timestamp: string
  status: "completed" | "scheduled" | "optimizing" | "active"
  isNew?: boolean
}

interface Metric {
  label: string
  value: string
  change: string
  positive: boolean
}

// ============================================================================
// MOCK DATA
// ============================================================================

const agents: AgentNode[] = [
  {
    id: "creator",
    name: "Creator Agent",
    icon: <Music className="w-5 h-5" />,
    status: "active",
    progress: 78,
    currentTask: "Generating 3 new tracks in 'Eclipse' style",
    color: "#ff3b30",
  },
  {
    id: "marketing",
    name: "Marketing Agent",
    icon: <TrendingUp className="w-5 h-5" />,
    status: "active",
    progress: 92,
    currentTask: "Posting teaser to X and Discord",
    color: "#a855f7",
  },
  {
    id: "release",
    name: "Release Agent",
    icon: <Radio className="w-5 h-5" />,
    status: "scheduled",
    progress: 45,
    currentTask: "Scheduling drop window for Friday 8PM",
    color: "#3b82f6",
  },
  {
    id: "monetization",
    name: "Monetization Agent",
    icon: <DollarSign className="w-5 h-5" />,
    status: "optimizing",
    progress: 67,
    currentTask: "Rebalancing revenue routing",
    color: "#22c55e",
  },
  {
    id: "community",
    name: "Community Agent",
    icon: <Users className="w-5 h-5" />,
    status: "active",
    progress: 85,
    currentTask: "Rewarding 250 active fans",
    color: "#f59e0b",
  },
  {
    id: "liquidity",
    name: "Liquidity Agent",
    icon: <Zap className="w-5 h-5" />,
    status: "active",
    progress: 100,
    currentTask: "Added USDC to simulated pool",
    color: "#06b6d4",
  },
]

const initialActivities: ActivityEvent[] = [
  {
    id: "1",
    agent: "Creator Agent",
    agentIcon: <Music className="w-4 h-4" />,
    action: "Generated 3 new tracks in 'Eclipse' style",
    timestamp: "Just now",
    status: "completed",
    isNew: true,
  },
  {
    id: "2",
    agent: "Marketing Agent",
    agentIcon: <TrendingUp className="w-4 h-4" />,
    action: "Posted teaser to X and Discord",
    timestamp: "2m ago",
    status: "completed",
  },
  {
    id: "3",
    agent: "Release Agent",
    agentIcon: <Radio className="w-4 h-4" />,
    action: "Scheduled drop window for Friday 8PM",
    timestamp: "5m ago",
    status: "scheduled",
  },
  {
    id: "4",
    agent: "Monetization Agent",
    agentIcon: <DollarSign className="w-4 h-4" />,
    action: "Rebalanced revenue routing",
    timestamp: "8m ago",
    status: "optimizing",
  },
  {
    id: "5",
    agent: "Community Agent",
    agentIcon: <Users className="w-4 h-4" />,
    action: "Rewarded 250 active fans",
    timestamp: "12m ago",
    status: "completed",
  },
  {
    id: "6",
    agent: "Liquidity Agent",
    agentIcon: <Zap className="w-4 h-4" />,
    action: "Added USDC to simulated pool",
    timestamp: "15m ago",
    status: "completed",
  },
]

const metrics: Metric[] = [
  { label: "Streams", value: "45.2K", change: "+23%", positive: true },
  { label: "Listeners", value: "18.7K", change: "+19%", positive: true },
  { label: "Engagement", value: "8.9K", change: "+31%", positive: true },
  { label: "Revenue", value: "$12.45", change: "+18%", positive: true },
  { label: "Transfers", value: "2.45K", change: "+27%", positive: true },
]

const commandChips = [
  "Create 3 song variants",
  "Analyze top fans",
  "Optimize liquidity",
  "Schedule next drop",
]

const ecosystemSteps = [
  { label: "Create", color: "#ff3b30" },
  { label: "Fans", color: "#a855f7" },
  { label: "USIC Protocol", color: "#ffffff" },
  { label: "Liquidity", color: "#22c55e" },
  { label: "Ownership", color: "#f59e0b" },
]

// ============================================================================
// COMPONENTS
// ============================================================================

// Animated Waveform Background
function AnimatedWaveform() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        {[...Array(40)].map((_, i) => (
          <motion.rect
            key={i}
            x={i * 30 + 5}
            y={100}
            width={20}
            height={10}
            fill="#ff3b30"
            rx={4}
            initial={{ scaleY: 0.3, y: 100 }}
            animate={{
              scaleY: [0.3, 1, 0.5, 0.8, 0.3],
              y: [100, 50, 80, 60, 100],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.05,
              ease: "easeInOut",
            }}
            style={{ originY: 1 }}
          />
        ))}
      </svg>
    </div>
  )
}

// Pulsing Live Dot
function LiveDot({ size = "sm" }: { size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-2 h-2" : "w-3 h-3"
  return (
    <span className="relative flex">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b30] opacity-75`}
      />
      <span
        className={`relative inline-flex rounded-full ${sizeClasses} bg-[#ff3b30]`}
      />
    </span>
  )
}

// Sparkline Component (CSS-based)
function Sparkline() {
  return (
    <div className="flex items-end gap-[2px] h-6">
      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((height, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gradient-to-t from-[#ff3b30] to-[#ff3b30]/30 rounded-full"
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
        />
      ))}
    </div>
  )
}

// Agent Node Component
function AgentNodeCard({ agent, index }: { agent: AgentNode; index: number }) {
  const statusColors = {
    active: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20",
    scheduled: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20",
    optimizing: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    idle: "text-[#9ca3af] bg-[#9ca3af]/10 border-[#9ca3af]/20",
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      className="relative group"
    >
      {/* Glow effect on active */}
      {agent.status === "active" && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"
          style={{ backgroundColor: `${agent.color}20` }}
          animate={{ opacity: [0, 0.03] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative p-4 rounded-2xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.06)] hover:shadow-lg"
        style={{ 
          boxShadow: agent.status === "active" ? `0 0 20px ${agent.color}10` : "none"
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div
            className="p-2.5 rounded-xl"
            style={{ backgroundColor: `${agent.color}20` }}
          >
            <div style={{ color: agent.color }}>{agent.icon}</div>
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] font-medium uppercase tracking-wider ${statusColors[agent.status]}`}
          >
            {agent.status}
          </Badge>
        </div>

        {/* Name */}
        <h4 className="text-sm font-semibold text-white mb-1">{agent.name}</h4>

        {/* Current Task */}
        <p className="text-xs text-[#9ca3af] mb-3 line-clamp-2 min-h-[32px]">
          {agent.currentTask}
        </p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#9ca3af]">Progress</span>
            <span className="text-white font-semibold">{agent.progress}%</span>
          </div>
          <div className="h-2 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden border border-[rgba(255,255,255,0.05)]">
            <motion.div
              className="h-full rounded-full shadow-lg"
              style={{ 
                backgroundColor: agent.color,
                boxShadow: `0 0 12px ${agent.color}60`
              }}
              initial={{ width: 0 }}
              animate={{ width: `${agent.progress}%` }}
              transition={{ duration: 1.2, delay: 0.3 + index * 0.1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Activity Row Component
function ActivityRow({ event, index }: { event: ActivityEvent; index: number }) {
  const statusColors = {
    completed: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20",
    scheduled: "text-[#3b82f6] bg-[#3b82f6]/10 border-[#3b82f6]/20",
    optimizing: "text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20",
    active: "text-[#ff3b30] bg-[#ff3b30]/10 border-[#ff3b30]/20",
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className={`relative flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] transition-all duration-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.12)] ${
        event.isNew ? "ring-1 ring-[#ff3b30]/40 bg-[rgba(255,59,48,0.05)]" : ""
      }`}
    >
      {/* New item shimmer */}
      {event.isNew && (
        <motion.div 
          className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#ff3b30]/20 to-transparent"
            initial={{ translateX: "-100%" }}
            animate={{ translateX: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}

      {/* Icon */}
      <div className="p-2 rounded-lg bg-[rgba(255,255,255,0.05)] text-[#ff3b30] shrink-0">
        {event.agentIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-white">{event.agent}</span>
          {event.isNew && <LiveDot size="sm" />}
        </div>
        <p className="text-xs text-[#9ca3af] truncate">{event.action}</p>
      </div>

      {/* Status & Time */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <Badge
          variant="outline"
          className={`text-[9px] font-medium ${statusColors[event.status]}`}
        >
          {event.status}
        </Badge>
        <span className="text-[10px] text-[#9ca3af]">{event.timestamp}</span>
      </div>
    </motion.div>
  )
}

// Metric Card Component
function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      className="p-4 rounded-xl bg-[rgba(255,255,255,0.035)] border border-[rgba(255,255,255,0.08)] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.05)]"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-[#9ca3af] font-semibold uppercase tracking-wide">{metric.label}</span>
        <Sparkline />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{metric.value}</span>
        <span
          className={`text-xs font-bold ${
            metric.positive ? "text-[#22c55e]" : "text-[#ff3b30]"
          }`}
        >
          {metric.change}
        </span>
      </div>
    </motion.div>
  )
}

// Network Visualization Component
function NetworkVisualization() {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      {/* Central Node */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          {/* Glow rings */}
          <div className="absolute inset-0 rounded-full bg-[#ff3b30] blur-xl opacity-30 animate-pulse" />
          <div className="absolute inset-[-8px] rounded-full border border-[#ff3b30]/30 animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-[-16px] rounded-full border border-[#ff3b30]/20 animate-[spin_30s_linear_infinite_reverse]" />

          {/* Core */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ff3b30]/60 flex items-center justify-center shadow-lg shadow-[#ff3b30]/30">
            <Cpu className="w-8 h-8 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Agent Nodes */}
      {agents.map((agent, index) => {
        const angle = (index * 360) / agents.length - 90
        const radius = 42 // percentage from center
        const x = 50 + radius * Math.cos((angle * Math.PI) / 180)
        const y = 50 + radius * Math.sin((angle * Math.PI) / 180)

        return (
          <motion.div
            key={agent.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
          >
            {/* Connection line */}
            <svg
              className="absolute pointer-events-none"
              style={{
                width: "200px",
                height: "200px",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <motion.line
                x1="100"
                y1="100"
                x2={100 + (50 - x) * 2}
                y2={100 + (50 - y) * 2}
                stroke={agent.color}
                strokeWidth="1"
                strokeOpacity="0.3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
              />
            </svg>

            {/* Pulsing dot on line */}
            <motion.div
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: agent.color }}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
            />

            {/* Node */}
            <div className="relative group cursor-pointer">
              <div
                className="absolute inset-0 rounded-full blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                style={{ backgroundColor: agent.color }}
              />
              <div
                className="relative w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#080808] transition-all duration-300 group-hover:scale-110"
                style={{ borderColor: agent.color }}
              >
                <div style={{ color: agent.color }}>{agent.icon}</div>
              </div>
              {/* Label */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] text-[#9ca3af] font-medium">
                  {agent.name.split(" ")[0]}
                </span>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Ecosystem Flow Component
function EcosystemFlow() {
  return (
    <div className="relative py-8">
      {/* Desktop: Horizontal Flow */}
      <div className="hidden md:flex items-center justify-center gap-0 px-4">
        {ecosystemSteps.map((step, index) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div
                className="w-16 h-16 rounded-full border-2 flex items-center justify-center bg-[#080808] transition-all duration-300 hover:scale-110"
                style={{ borderColor: step.color }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: step.color }}
                >
                  {step.label.charAt(0)}
                </span>
              </div>
              <span className="mt-2 text-xs text-[#9ca3af] font-medium">
                {step.label}
              </span>
            </motion.div>

            {/* Arrow */}
            {index < ecosystemSteps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 48 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="h-[2px] mx-2 relative overflow-hidden"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, ${step.color}, ${ecosystemSteps[index + 1].color})`,
                  }}
                />
                {/* Animated particle */}
                <motion.div
                  className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                  style={{ backgroundColor: step.color }}
                  animate={{ left: ["0%", "100%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.3,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Vertical Flow */}
      <div className="md:hidden flex flex-col items-center gap-4 px-4">
        {ecosystemSteps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-full border-2 flex items-center justify-center bg-[#080808]"
                style={{ borderColor: step.color }}
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: step.color }}
                >
                  {step.label.charAt(0)}
                </span>
              </div>
              <span className="text-sm text-white font-medium">{step.label}</span>
            </motion.div>

            {/* Vertical connector */}
            {index < ecosystemSteps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 24 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                className="w-[2px] relative overflow-hidden"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, ${step.color}, ${ecosystemSteps[index + 1].color})`,
                  }}
                />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Mobile Bottom Nav for this page
function AgentBottomNav() {
  const navItems = [
    { href: "/agents/activity", icon: Home, label: "Overview", active: true },
    { href: "/agents", icon: Bot, label: "Agents", active: false },
    { href: "/create", icon: Sparkles, label: "Create", active: false },
    { href: "/analytics", icon: BarChart3, label: "Analytics", active: false },
    { href: "/wallet", icon: Wallet, label: "Wallet", active: false },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-2xl border-t border-[rgba(255,255,255,0.08)]" />
      <div className="relative flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300 ease-out active:scale-95"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                  item.active
                    ? "bg-[#ff3b30]/20 text-[#ff3b30]"
                    : "text-[#9ca3af] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-[10px] font-medium ${
                  item.active ? "text-[#ff3b30]" : "text-[#9ca3af]"
                }`}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function AgentActivityPage() {
  const [activities, setActivities] = useState(initialActivities)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simulate live activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities((prev) =>
        prev.map((activity, i) =>
          i === 0 ? { ...activity, isNew: false } : activity
        )
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#050505] pb-24 md:pb-8">
      {/* ================================================================== */}
      {/* STICKY HEADER */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-40 bg-[#050505]/90 backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo placeholder */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ff3b30] to-[#ff3b30]/60 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Agent Activity</h1>
              <p className="text-[10px] text-[#9ca3af]">OpenClaw simulation layer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ff3b30]/10 border border-[#ff3b30]/20">
              <LiveDot size="sm" />
              <span className="text-[10px] font-medium text-[#ff3b30]">Live Simulation</span>
            </div>

            {/* Connect Wallet Button */}
            <Button
              size="sm"
              className="gap-1.5 bg-[#ff3b30] hover:bg-[#ff3b30]/90 text-white text-xs h-9 px-3 shadow-lg shadow-[#ff3b30]/25"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Connect</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================== */}
      {/* HERO COMMAND PANEL */}
      {/* ================================================================== */}
      <section className="relative overflow-hidden py-12 md:py-20">
        <AnimatedWaveform />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Your music economy.
              <br />
              <span className="text-[#ff3b30]">Autonomous. Alive.</span>
            </h2>
            <p className="text-sm sm:text-base text-[#9ca3af] mb-8 max-w-xl mx-auto">
              Simulated OpenClaw agents working across creation, growth, liquidity,
              community, and ownership.
            </p>

            {/* Command Input Mockup */}
            <motion.div 
              className="relative max-w-xl mx-auto mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.div 
                className="absolute inset-0 rounded-2xl bg-[#ff3b30]/15 blur-xl"
                animate={{ opacity: [0.5, 0.7, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative flex items-center gap-3 p-4 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] backdrop-blur-sm transition-all duration-300 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.07)] cursor-pointer">
                <Sparkles className="w-5 h-5 text-[#ff3b30] shrink-0" />
                <span className="text-sm text-[#9ca3af] text-left">
                  Ask agents to create, grow, monetize, or route value...
                </span>
                <ArrowRight className="w-5 h-5 text-[#ff3b30] shrink-0 ml-auto" />
              </div>
            </motion.div>

            {/* Command Chips */}
            <motion.div 
              className="flex flex-wrap justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              {commandChips.map((chip, index) => (
                <motion.button
                  key={chip}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.08, ease: "easeOut" }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }}
                  className="px-3.5 py-2 rounded-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-xs font-medium text-[#9ca3af] hover:text-white transition-all duration-200"
                >
                  {chip}
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* LIVE AGENT NETWORK */}
      {/* ================================================================== */}
      <section className="py-12 md:py-16 border-t border-[rgba(255,255,255,0.05)]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center mb-10"
          >
            <h3 className="text-lg font-bold text-white mb-1">Live Agent Network</h3>
            <p className="text-xs text-[#9ca3af]">Central USIC protocol coordinating autonomous agents</p>
          </motion.div>

          {/* Desktop: Network Visualization */}
          <div className="hidden lg:block">
            <NetworkVisualization />
          </div>

          {/* Mobile/Tablet: Grid of Agent Cards */}
          <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-3">
            {agents.map((agent, index) => (
              <AgentNodeCard key={agent.id} agent={agent} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* METRICS / PULSE PANEL */}
      {/* ================================================================== */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {metrics.map((metric, index) => (
              <MetricCard key={metric.label} metric={metric} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* AGENT ACTIVITY FEED */}
      {/* ================================================================== */}
      <section className="py-8 md:py-10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center justify-between mb-5"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#ff3b30]" />
              <h3 className="text-sm font-bold text-white">Activity Feed</h3>
              <LiveDot size="sm" />
            </div>
            <span className="text-[10px] text-[#9ca3af]">Live updates</span>
          </motion.div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto scrollbar-hide pr-2">
            <AnimatePresence mode="popLayout">
              {activities.map((event, index) => (
                <ActivityRow key={event.id} event={event} index={index} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* ACTIVE AGENTS GRID */}
      {/* ================================================================== */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Bot className="w-4 h-4 text-[#ff3b30]" />
            Active Agents
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent, index) => (
              <AgentNodeCard key={agent.id} agent={agent} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* ECOSYSTEM FLOW */}
      {/* ================================================================== */}
      <section className="py-8 border-t border-[rgba(255,255,255,0.05)]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h3 className="text-sm font-bold text-white mb-1">Ecosystem Flow</h3>
            <p className="text-xs text-[#9ca3af]">
              Music transforming into value movement
            </p>
          </div>

          <EcosystemFlow />
        </div>
      </section>

      {/* ================================================================== */}
      {/* MOBILE BOTTOM NAV */}
      {/* ================================================================== */}
      <AgentBottomNav />
    </div>
  )
}
