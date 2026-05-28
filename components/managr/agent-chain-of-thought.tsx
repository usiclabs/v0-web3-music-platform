"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Brain, Zap, Target } from "lucide-react"

interface ThoughtStep {
  agent: string
  title: string
  description: string
  status: "thinking" | "processing" | "complete"
  timestamp: string
}

interface ChainOfThoughtProps {
  musicAsset: {
    title: string
    artist: string
    duration: string
  }
  thoughts: ThoughtStep[]
}

export function AgentChainOfThought({ musicAsset, thoughts }: ChainOfThoughtProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/30 bg-slate-950/50 backdrop-blur">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Agent Chain of Thought</h3>
        </div>
        <p className="text-sm text-slate-400">
          {musicAsset.artist} — {musicAsset.title}
        </p>
      </div>

      {/* Thought Steps */}
      <div className="p-6 space-y-4">
        {thoughts.map((thought, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="relative"
          >
            {/* Connecting line */}
            {index < thoughts.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/30 to-transparent" />
            )}

            <div className="flex gap-4">
              {/* Status Icon */}
              <div className="relative z-10">
                {thought.status === "complete" && (
                  <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  </div>
                )}
                {thought.status === "processing" && (
                  <motion.div
                    className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-6 h-6 text-blue-400" />
                  </motion.div>
                )}
                {thought.status === "thinking" && (
                  <motion.div
                    className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="w-6 h-6 text-amber-400" />
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-semibold text-white">{thought.agent}</h4>
                  <span className="text-xs text-slate-500">{thought.timestamp}</span>
                </div>
                <p className="text-sm text-white/90 mb-2">{thought.title}</p>
                <p className="text-xs text-slate-400">{thought.description}</p>

                {/* Status badge */}
                <div className="mt-2">
                  {thought.status === "complete" && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                      Complete
                    </span>
                  )}
                  {thought.status === "processing" && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 animate-pulse">
                      Processing
                    </span>
                  )}
                  {thought.status === "thinking" && (
                    <span className="inline-block px-2 py-1 rounded text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Analyzing
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
