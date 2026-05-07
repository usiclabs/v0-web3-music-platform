"use client"

import { motion } from "framer-motion"

const ecosystemNodes = [
  "AI Creation",
  "Onchain Ownership",
  "x402 Payments",
  "Artist Tokens",
  "Fan Access",
  "Royalty Flow",
  "Distribution",
  "Analytics",
  "Creator Treasury",
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
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
}

export function EcosystemDiagram() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-red-500/20">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance mb-4">
            BUILT INSIDE THE
            <br />
            <span className="text-red-500">MYUSIC ECOSYSTEM.</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl">
            MANAGR connects to the broader MyUSIC stack — AI music creation, onchain ownership, x402 payments, artist
            tokens, fan participation, royalty flows, and creator-controlled music finance.
          </p>
        </div>

        {/* Ecosystem Network Visualization */}
        <div className="relative h-screen max-h-96 flex items-center justify-center">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 500 500"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
              </radialGradient>
              <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(220, 38, 38, 0.5)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
              </linearGradient>
            </defs>

            {/* Center glow */}
            <circle cx="250" cy="250" r="80" fill="url(#centerGlow)" />

            {/* Connection lines from center to nodes */}
            {ecosystemNodes.map((_, index) => {
              const angle = (index / ecosystemNodes.length) * Math.PI * 2
              const radius = 130
              const x = 250 + Math.cos(angle) * radius
              const y = 250 + Math.sin(angle) * radius
              return (
                <line
                  key={`line-${index}`}
                  x1="250"
                  y1="250"
                  x2={x}
                  y2={y}
                  stroke="url(#nodeGradient)"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              )
            })}

            {/* Node circles */}
            {ecosystemNodes.map((node, index) => {
              const angle = (index / ecosystemNodes.length) * Math.PI * 2
              const radius = 130
              const x = 250 + Math.cos(angle) * radius
              const y = 250 + Math.sin(angle) * radius
              return (
                <motion.g
                  key={`node-${index}`}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.2 }}
                >
                  <circle cx={x} cy={y} r="20" fill="rgba(10, 10, 10, 0.8)" stroke="rgb(239, 68, 68)" strokeWidth="1.5" />
                  <circle cx={x} cy={y} r="18" fill="url(#nodeGradient)" opacity="0.2" />
                </motion.g>
              )
            })}

            {/* Center circle */}
            <motion.circle
              cx="250"
              cy="250"
              r="35"
              fill="rgba(220, 38, 38, 0.2)"
              stroke="rgb(220, 38, 38)"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              animate={{ scale: [1, 1.05, 1] }}
              whileHover={{ scale: 1.1 }}
            />
          </svg>

          {/* SVG Text Labels (positioned as overlay) */}
          <div className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Center label */}
              <div className="absolute text-center">
                <div className="text-xs sm:text-sm font-bold text-red-500 font-display">MANAGR</div>
              </div>

              {/* Outer labels */}
              {ecosystemNodes.map((node, index) => {
                const angle = (index / ecosystemNodes.length) * Math.PI * 2
                const radius = 155
                const x = Math.cos(angle) * radius
                const y = Math.sin(angle) * radius
                return (
                  <motion.div
                    key={`label-${index}`}
                    className="absolute text-center"
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="text-xs font-display font-semibold text-gray-300 whitespace-nowrap">{node}</div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Grid of ecosystem features below diagram */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12"
          variants={containerVariants}
        >
          {[
            "Transparent creator finance across all music operations",
            "Autonomous agents coordinated by artist decisions",
            "Data-driven insights feeding back into creative decisions",
          ].map((feature, index) => (
            <motion.div
              key={index}
              className="glass-card border border-red-500/20 p-6 rounded-lg hover:border-red-500/50 transition-all"
              variants={itemVariants}
            >
              <p className="text-gray-300">{feature}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
