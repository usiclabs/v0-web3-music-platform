"use client"

import { motion } from "framer-motion"
import { CheckCircle, Eye } from "lucide-react"
import * as Icons from "lucide-react"
import type { Agent } from "./agent-data"

interface AgentDetailPanelProps {
  agent: Agent | null
  onDeploy: () => void
}

const SKILL_ICONS: Record<string, keyof typeof Icons> = {
  "Beat Generation": "Music",
  "Melody Composition": "Radio",
  "Track Assembly": "Layers",
  "Lyric Generation": "PenTool",
  "Style Matching": "Palette",
  "Rhyme Optimization": "Zap",
  "Audio Mixing": "Sliders",
  Mastering: "Volume2",
  "EQ Optimization": "Activity",
  "Social Amplification": "Share2",
  "Audience Growth": "TrendingUp",
  "Reach Optimization": "Broadcast",
  "Data Analysis": "BarChart3",
  "Trend Prediction": "LineChart",
  "Performance Tracking": "Eye",
  "Platform Integration": "Zap",
  "Distribution Automation": "Truck",
  "Delivery Tracking": "Package",
}

export function AgentDetailPanel({ agent, onDeploy }: AgentDetailPanelProps) {
  if (!agent) {
    return (
      <div className="w-full p-6 border-t border-red-500/20 bg-black/40">
        <p className="text-center text-white/60">Select an agent to view details</p>
      </div>
    )
  }

  const Icon = Icons[agent.icon as keyof typeof Icons] as any

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full border-t border-red-500/20 bg-gradient-to-r from-black/80 via-red-500/5 to-black/80 backdrop-blur-lg"
    >
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
              {Icon && <Icon className="w-6 h-6 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-white">{agent.name}</h3>
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">{agent.specialty}</p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-400 font-semibold uppercase">ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center py-4 px-3 rounded-lg bg-red-500/5 border border-red-500/10">
            <div>
              <p className="text-xs text-white/60 uppercase font-bold mb-1">Success Rate</p>
              <p className="text-lg font-black text-white">{agent.successRate}%</p>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase font-bold mb-1">Users</p>
              <p className="text-lg font-black text-white">{agent.users}K</p>
            </div>
            <div>
              <p className="text-xs text-white/60 uppercase font-bold mb-1">Specialty</p>
              <p className="text-sm font-bold text-red-400">{agent.specialty.split(" ")[0]}</p>
            </div>
          </div>

          <button
            onClick={onDeploy}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,30,0.5)]"
          >
            DEPLOY AGENT
          </button>

          <button className="w-full py-2 px-4 text-red-400 text-sm font-semibold uppercase tracking-widest border border-red-500/30 rounded-lg hover:border-red-500 hover:bg-red-500/10 transition-all">
            <Eye className="w-4 h-4 mr-2 inline" />
            VIEW DETAILS
          </button>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between">
            {/* Agent Info */}
            <div className="flex items-center gap-6 flex-1">
              <div className="w-16 h-16 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0">
                {Icon && <Icon className="w-8 h-8 text-red-400" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-black text-white">{agent.name}</h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-400 font-bold uppercase tracking-widest">ACTIVE</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-3">{agent.specialty}</p>

                {/* Stats */}
                <div className="flex items-center gap-8">
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold mb-1">Specialty</p>
                    <p className="text-base font-bold text-white">{agent.specialty.split(" ")[0]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold mb-1">Success Rate</p>
                    <p className="text-base font-bold text-white">{agent.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase font-bold mb-1">Users</p>
                    <p className="text-base font-bold text-white">{agent.users}K</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills & CTA */}
            <div className="flex items-center gap-6 flex-shrink-0">
              {/* Skills Icons */}
              <div className="flex items-center gap-3">
                {agent.skills.slice(0, 3).map((skill) => {
                  const IconKey = SKILL_ICONS[skill] || "Zap"
                  const SkillIcon = Icons[IconKey as keyof typeof Icons] as any
                  return (
                    <div
                      key={skill}
                      className="w-10 h-10 rounded-lg border border-red-500/30 flex items-center justify-center hover:border-red-500 hover:bg-red-500/10 transition-all"
                      title={skill}
                    >
                      {SkillIcon && <SkillIcon className="w-5 h-5 text-red-400" />}
                    </div>
                  )
                })}
              </div>

              {/* CTA Button */}
              <button
                onClick={onDeploy}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,30,30,0.5)] flex items-center gap-2 whitespace-nowrap"
              >
                DEPLOY AGENT
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
