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
    <motion.section
      className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-red-950/5 to-transparent"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={containerVariants}
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 md:mb-24">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight text-balance mb-4">
            Your Agent Team.
          </h2>
          <p className="text-lg md:text-xl text-white/70 font-light tracking-wide">
            Five specialized agents working in concert to maximize your creative potential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {agents.map((agent, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/50 to-black border border-red-500/20 hover:border-red-500/40 p-6 md:p-8 transition-all duration-500 backdrop-blur-sm"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-red-500/10 via-transparent to-transparent blur-2xl transition-opacity duration-500" />

              <div className="relative z-10 space-y-4">
                <div className="text-5xl md:text-6xl transform group-hover:scale-125 transition-transform duration-500">
                  {agent.icon}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-300">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed font-light">
                    {agent.description}
                  </p>
                </div>

                {/* Status indicator */}
                <div className="pt-4 border-t border-red-500/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-white/50 uppercase tracking-wider font-light">
                    Ready to Deploy
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom description */}
        <motion.div
          className="mt-16 md:mt-24 p-6 md:p-8 border border-red-500/20 rounded-2xl bg-gradient-to-r from-red-500/5 via-transparent to-transparent backdrop-blur-sm"
          variants={itemVariants}
        >
          <p className="text-center text-white/70 font-light text-lg leading-relaxed">
            Deploy individually or as an ensemble. Each agent operates autonomously yet coordinates seamlessly with your music team to maximize earnings and creative impact.
          </p>
        </motion.div>
      </div>
    </motion.section>
  )
}
