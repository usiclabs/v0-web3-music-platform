"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ManagRHero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  }

  return (
    <section className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12">
      <motion.div
        className="max-w-6xl mx-auto text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight mb-6 tracking-tight"
          variants={itemVariants}
        >
          YOUR MUSIC HAS A{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 animate-pulse">
            TEAM NOW.
          </span>
        </motion.h1>

        <motion.p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed" variants={itemVariants}>
          MANAGR coordinates autonomous music agents that help artists create, release, promote, distribute, analyze,
          and earn — without giving up ownership.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          variants={itemVariants}
        >
          <Button
            asChild
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 h-12 text-base hover-glow shadow-lg shadow-red-500/25 hover:scale-105 transition-all"
          >
            <Link href="/dashboard">Deploy MANAGR</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-red-500/50 hover:border-red-500 text-white font-bold px-8 h-12 text-base hover:bg-red-500/10 hover:scale-105 transition-all"
          >
            Explore the Agent Stack
          </Button>
        </motion.div>

        <motion.p className="text-sm text-gray-500 font-display tracking-widest" variants={itemVariants}>
          Create. Own. Earn. The next label is yours.
        </motion.p>

        {/* Hero Visual - Command Center */}
        <motion.div
          className="mt-16 relative"
          variants={itemVariants}
          whileInView={{ scale: 1 }}
          initial={{ scale: 0.95, opacity: 0 }}
        >
          <div className="bg-gradient-to-b from-red-900/20 via-transparent to-transparent rounded-2xl p-8 border border-red-500/20">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
              {/* Central Module */}
              <motion.div
                className="glass-card border border-red-500/40 p-6 rounded-lg w-full lg:w-auto lg:order-2 relative group"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold font-display text-red-500 mb-2">MANAGR</div>
                  <div className="text-sm text-gray-400">Command Center</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:to-red-500/10 rounded-lg transition-all" />
              </motion.div>

              {/* Left Agents */}
              <div className="flex flex-col gap-4 lg:order-1">
                {["Producer", "Release", "Marketing"].map((agent, i) => (
                  <motion.div
                    key={agent}
                    className="glass-card border border-red-500/20 p-4 rounded-lg hover:border-red-500/50 transition-all"
                    whileHover={{ x: -4 }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <div className="font-display font-bold text-sm text-white">{agent}</div>
                    <div className="text-xs text-gray-500">Agent</div>
                  </motion.div>
                ))}
              </div>

              {/* Right Agents */}
              <div className="flex flex-col gap-4 lg:order-3">
                {["Distribution", "Royalty", "Analytics"].map((agent, i) => (
                  <motion.div
                    key={agent}
                    className="glass-card border border-red-500/20 p-4 rounded-lg hover:border-red-500/50 transition-all"
                    whileHover={{ x: 4 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <div className="font-display font-bold text-sm text-white">{agent}</div>
                    <div className="text-xs text-gray-500">Agent</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Connection Lines (animated) */}
            <motion.svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: "visible" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <defs>
                <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0.1)" />
                </linearGradient>
              </defs>
            </motion.svg>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
