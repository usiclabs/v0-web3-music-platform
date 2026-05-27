"use client"

import { motion } from "framer-motion"

const agents = [
  {
    name: "Auto-Stream Agent",
    description: "Autonomously streams your music across blockchain networks and platforms, maximizing reach and earnings.",
    icon: "🎵",
  },
  {
    name: "Market Maker Agent",
    description: "Provides liquidity and market-making for your music tokens, enabling efficient trading and price discovery.",
    icon: "📈",
  },
  {
    name: "Autonomous Artist Agent",
    description: "Handles creative coordination, release scheduling, and artist operations automatically.",
    icon: "🎼",
  },
  {
    name: "Investment Agent",
    description: "Manages portfolio investments, yield optimization, and strategic asset allocation for your music IP.",
    icon: "💎",
  },
  {
    name: "Boost Agent",
    description: "Amplifies reach and engagement through automated promotion, advertising, and visibility strategies.",
    icon: "🚀",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export function AgentStack() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-accent/20">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance mb-8">
            YOUR AGENT TEAM.
            <br />
            <span className="text-red-500">DEPLOY & EARN.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {agents.map((agent, index) => (
            <motion.div
              key={index}
              className="group glass-card border border-red-500/20 hover:border-red-500/50 p-6 rounded-lg transition-all duration-300 hover-lift relative overflow-hidden"
              variants={itemVariants}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 40px rgba(239, 68, 68, 0.15)",
              }}
            >
              {/* Agent card content */}
              <div className="relative z-10">
                <div className="text-4xl mb-3">{agent.icon}</div>
                <h3 className="text-lg font-bold text-white mb-3 font-display">{agent.name}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{agent.description}</p>

                {/* Active badge */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />

              {/* Border glow on hover */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 20px rgba(239, 68, 68, 0.1)",
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Bottom description */}
        <motion.div
          className="mt-12 p-6 glass-card border border-red-500/20 rounded-lg text-center"
          variants={itemVariants}
        >
          <p className="text-gray-300">
            Deploy MANAGR agents to handle streaming, trading, investing, and promotion autonomously. Each agent works independently yet coordinates with your team to maximize earnings and reach.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
