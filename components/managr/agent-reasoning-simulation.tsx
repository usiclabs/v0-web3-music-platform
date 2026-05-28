"use client"

import { motion } from "framer-motion"
import { AgentChainOfThought } from "./agent-chain-of-thought"
import { useState, useEffect } from "react"

export function AgentReasoningSimulation() {
  const [activeStep, setActiveStep] = useState(0)

  const mockMusicAsset = {
    title: "Electric Dreams",
    artist: "Luna Artist",
    duration: "3:45",
  }

  const simulationSteps = [
    {
      agent: "Auto-Stream Agent",
      title: "Analyzing distribution targets",
      description: "Evaluating optimal blockchain networks and streaming platforms for maximum reach based on audience demographics and platform fees.",
      status: "complete" as const,
      timestamp: "0.2s",
    },
    {
      agent: "Market Maker Agent",
      title: "Preparing liquidity pools",
      description: "Setting up automated market maker contracts on Uniswap V3 and V4 pools for token trading with dynamic fee optimization.",
      status: "complete" as const,
      timestamp: "0.8s",
    },
    {
      agent: "Boost Agent",
      title: "Calculating promotion strategy",
      description: "Analyzing trending hashtags, optimal posting times, and influencer opportunities to maximize initial visibility.",
      status: "processing" as const,
      timestamp: "1.5s",
    },
    {
      agent: "Investment Agent",
      title: "Evaluating revenue potential",
      description: "Modeling yield optimization across multiple revenue streams and recommending portfolio allocation strategy.",
      status: "thinking" as const,
      timestamp: "2.1s",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < simulationSteps.length - 1 ? prev + 1 : prev))
    }, 2000)
    return () => clearInterval(timer)
  }, [simulationSteps.length])

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 text-balance">
            AGENTS THINK,
            <br />
            <span className="text-red-500">BEFORE THEY ACT.</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl">
            Watch as your autonomous agent team analyzes a newly created music asset and determines optimal strategies across all channels in real-time.
          </p>
        </motion.div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Music Asset */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900 rounded-xl border border-slate-700/50 p-8"
          >
            <div className="aspect-square bg-gradient-to-br from-red-900/30 via-blue-900/20 to-slate-900 rounded-lg mb-6 flex items-center justify-center border border-slate-700/30">
              <div className="text-6xl">🎵</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{mockMusicAsset.title}</h3>
            <p className="text-slate-300 mb-6">{mockMusicAsset.artist}</p>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-slate-400">Duration</span>
                <span className="text-white font-medium">{mockMusicAsset.duration}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                <span className="text-slate-400">Format</span>
                <span className="text-white font-medium">WAV / MP3</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Status</span>
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-emerald-400 font-medium">Ready</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chain of Thought */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AgentChainOfThought
              musicAsset={mockMusicAsset}
              thoughts={simulationSteps}
            />
          </motion.div>
        </div>

        {/* Benefits Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "Parallel Processing",
              description: "All 5 agents analyze simultaneously, not sequentially",
            },
            {
              title: "Real-time Optimization",
              description: "Strategies adapt instantly to market conditions",
            },
            {
              title: "Complete Autonomy",
              description: "Once deployed, agents execute without manual intervention",
            },
          ].map((benefit, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/30 rounded-lg p-6 hover:border-red-500/30 transition-colors"
            >
              <h4 className="text-lg font-semibold text-white mb-2">{benefit.title}</h4>
              <p className="text-slate-400 text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
