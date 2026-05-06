"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle } from "lucide-react"

const comparisonPoints = [
  { old: "Permission-based access", new: "Artist-controlled agent stack" },
  { old: "Delayed royalties", new: "Transparent workflows" },
  { old: "Fragmented data", new: "Faster feedback loops" },
  { old: "Middlemen control the system", new: "Direct fan infrastructure" },
  { old: "Artist gives up leverage", new: "Creator-owned execution layer" },
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
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
}

export function ArtistOwnedComparison() {
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display leading-tight text-balance mb-4">
            THE ARTIST IS NO LONGER WAITING FOR A LABEL.
            <br />
            <span className="text-red-500">THE ARTIST IS OPERATING ONE.</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mt-6">
            Traditional labels controlled the team, the capital, the data, the audience access, and the release
            machine. MANAGR gives artists a way to build their own operational layer with autonomous agents while
            staying in control of the vision.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Old Model */}
          <motion.div
            className="glass-card border border-gray-600/30 p-8 rounded-xl"
            variants={itemVariants}
          >
            <h3 className="text-2xl font-bold font-display text-gray-300 mb-8 text-balance">Old Label Model</h3>

            <div className="space-y-4">
              {comparisonPoints.map((point, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4 items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <XCircle className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-400">{point.old}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* MANAGR Model */}
          <motion.div
            className="glass-card border border-red-500/40 p-8 rounded-xl relative overflow-hidden group"
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <h3 className="text-2xl font-bold font-display text-red-500 mb-8 text-balance relative z-10">
              MANAGR Model
            </h3>

            <div className="space-y-4 relative z-10">
              {comparisonPoints.map((point, index) => (
                <motion.div
                  key={index}
                  className="flex gap-4 items-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-gray-300">{point.new}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom callout */}
        <motion.div
          className="mt-12 glass-card border border-red-500/20 p-8 rounded-xl text-center bg-gradient-to-r from-red-500/5 to-transparent"
          variants={itemVariants}
        >
          <p className="text-lg text-gray-300">
            <span className="text-red-500 font-bold">MANAGR is not a replacement for artist vision.</span> It's the
            operational infrastructure that lets artists execute their vision at scale with autonomous agents handling
            the details.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
