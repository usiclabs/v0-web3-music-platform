"use client"

import { motion } from "framer-motion"
import * as Icons from "lucide-react"
import type { Agent } from "./agent-data"

interface AgentCardProps {
  agent: Agent
  isSelected: boolean
  onClick: () => void
  rotation: number
  scale: number
}

export function AgentCard({ agent, isSelected, onClick, rotation, scale }: AgentCardProps) {
  const Icon = Icons[agent.icon as keyof typeof Icons] as any
  const stats = [
    { label: "POWER", value: agent.power },
    { label: "SPEED", value: agent.speed },
    { label: "EARN", value: agent.earn },
  ]

  return (
    <motion.div
      onClick={onClick}
      className="relative cursor-pointer h-96"
      style={{
        perspective: "1000px",
      }}
      animate={{
        rotateY: rotation,
        scale: scale,
        zIndex: isSelected ? 50 : 10,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Card Container */}
      <div
        className={`relative w-64 h-full rounded-2xl border-2 transition-all duration-500 overflow-hidden ${
          isSelected
            ? "border-red-500 shadow-[0_0_30px_rgba(255,30,30,0.6)]"
            : "border-red-900/40 shadow-[0_0_20px_rgba(255,30,30,0.3)]"
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(20, 20, 25, 0.9) 0%, rgba(10, 10, 15, 0.95) 100%)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Glow Ring Under Card (only for selected) */}
        {isSelected && (
          <motion.div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-80 h-16 rounded-full border-2 border-red-500/40 pointer-events-none"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
        )}

        {/* Top Section with OVR and Icon */}
        <div className="relative p-6 pb-4 border-b border-red-500/20">
          <div className="flex justify-between items-start mb-4">
            {/* OVR Badge */}
            <motion.div
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg border-2 ${
                isSelected ? "border-red-500 bg-red-500/20" : "border-red-900/40 bg-red-500/10"
              }`}
              animate={{
                boxShadow: isSelected ? "0 0 20px rgba(255, 30, 30, 0.6)" : "0 0 10px rgba(255, 30, 30, 0.2)",
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs font-bold text-red-400">OVR</span>
              <span className="text-lg font-black text-white">{agent.ovr}</span>
            </motion.div>

            {/* Icon */}
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${isSelected ? "bg-red-500/30" : "bg-red-500/10"}`}>
              {Icon && <Icon className="w-6 h-6 text-red-400" />}
            </div>
          </div>

          {/* Agent Name */}
          <h3 className="text-xl font-black text-white tracking-wider">{agent.name}</h3>
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">{agent.specialty}</p>
        </div>

        {/* Middle Section with Description and Waveform */}
        <div className="p-6 border-b border-red-500/20">
          <p className="text-xs text-white/70 leading-relaxed mb-4">{agent.description}</p>

          {/* Animated Waveform */}
          <div className="flex items-center justify-center gap-1 h-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 bg-gradient-to-t from-red-500 to-red-300 rounded-full"
                animate={{
                  height: [20, 35, 20],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  repeat: Infinity,
                }}
              />
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6 space-y-3">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{stat.label}</span>
                <span className="text-xs font-bold text-red-400">{stat.value}%</span>
              </div>
              {/* Stat Bars */}
              <div className="w-full h-1 bg-red-500/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 to-red-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.value}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Shine Effect on Hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition-opacity duration-500 pointer-events-none ${
            isSelected ? "opacity-10" : "hover:opacity-5"
          }`}
          style={{
            animation: isSelected ? "shimmer 3s infinite" : "none",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </motion.div>
  )
}
