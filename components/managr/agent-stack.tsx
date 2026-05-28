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
              variants={itemVariants}
              whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgba(255, 0, 0, 0.15)" }}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/50 via-slate-900 to-slate-950 border border-slate-700/50 hover:border-red-500/40 p-6 transition-all duration-300"
            >
              {/* Animated gradient background on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-red-500/5 via-transparent to-blue-500/5 transition-opacity duration-300" />

              {/* Glow effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl bg-gradient-to-br from-red-500/20 to-transparent -z-10 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{agent.icon}</div>
                <h3 className="text-base font-bold text-white mb-3 leading-tight">{agent.name}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{agent.description}</p>

                {/* Agent status indicator */}
                <div className="pt-4 border-t border-slate-700/50 flex items-center gap-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-emerald-400"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium text-slate-400">Ready to Deploy</span>
                </div>
              </div>
            </motion.div>
          ))}
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
