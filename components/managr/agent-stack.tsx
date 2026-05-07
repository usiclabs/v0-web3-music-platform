"use client"

import { motion } from "framer-motion"

const agents = [
  {
    name: "Producer Agent",
    description: "Assists with song concepts, lyrics, production direction, and creative iteration.",
    icon: "🎼",
  },
  {
    name: "Release Agent",
    description: "Prepares tracks, metadata, release plans, and launch workflows.",
    icon: "🚀",
  },
  {
    name: "Marketing Agent",
    description: "Creates campaigns, social posts, visuals, content calendars, and fan-facing messaging.",
    icon: "📢",
  },
  {
    name: "Distribution Agent",
    description: "Helps package music for platforms, channels, and audience touchpoints.",
    icon: "🌍",
  },
  {
    name: "Royalty Agent",
    description: "Tracks payouts, revenue flow, transparent earnings, and creator-side reporting.",
    icon: "💰",
  },
  {
    name: "Analytics Agent",
    description: "Studies audience behavior, release performance, engagement, and growth signals.",
    icon: "📊",
  },
  {
    name: "Fan Agent",
    description: "Supports fan communication, community updates, access drops, and retention loops.",
    icon: "👥",
  },
  {
    name: "Treasury Agent",
    description: "Helps organize budgets, reinvestment logic, campaign spend, and agent operating capital.",
    icon: "🏦",
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
            ONE ARTIST.
            <br />
            <span className="text-red-500">MULTIPLE AGENTS.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            Each agent is designed to be autonomous yet coordinated. They work together to handle every aspect of your
            music career, from creation to monetization.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
