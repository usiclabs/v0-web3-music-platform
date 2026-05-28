"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Sparkles } from "lucide-react"

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
    <section className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-12 relative overflow-hidden bg-gradient-to-b from-red-950/10 via-black to-black">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--accent)/0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <motion.div
        className="max-w-6xl mx-auto text-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Pre-headline badge */}
        <motion.div
          className="mb-8 flex items-center justify-center gap-2"
          variants={itemVariants}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 backdrop-blur-sm hover:border-red-500/50 transition-colors duration-300">
            <Sparkles className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-red-400/80 tracking-wider uppercase">The Artist-Owned Label Stack</span>
          </div>
        </motion.div>

        <motion.h1
          className="text-6xl sm:text-7xl lg:text-8xl font-serif font-bold leading-tight mb-6 tracking-tight text-balance"
          variants={itemVariants}
        >
          Your Music Has a{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600 animate-pulse">
            Team Now.
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
            variant="default"
            className="gap-1.5 sm:gap-2 !bg-accent hover:!bg-accent/90 text-white font-bold px-8 h-12 text-base shadow-lg shadow-accent/25 hover:scale-105 transition-all"
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Deploy MANAGR
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-accent/50 hover:border-accent text-white font-bold px-8 h-12 text-base hover:bg-accent/10 hover:scale-105 transition-all"
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
          {/* Ambient light effect */}
          <div className="absolute -inset-32 bg-gradient-to-r from-accent/20 via-transparent to-accent/20 blur-3xl" />

          <div className="bg-gradient-to-b from-accent/20 via-transparent to-transparent rounded-2xl p-8 border border-accent/20 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
              {/* Central Module */}
              <motion.div
                className="glass-card border border-accent/40 p-6 rounded-lg w-full lg:w-auto lg:order-2 relative group overflow-hidden"
                whileHover={{ scale: 1.05 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                {/* Inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />

                <div className="text-center relative z-10">
                  <div className="text-3xl font-bold font-display text-accent mb-2 flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    MANAGR
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="text-sm text-gray-400">Command Center</div>
                </div>
              </motion.div>

              {/* Left Agents */}
              <div className="flex flex-col gap-4 lg:order-1">
                {["Producer", "Release", "Marketing"].map((agent, i) => (
                  <motion.div
                    key={agent}
                    className="glass-card border border-accent/20 p-4 rounded-lg hover:border-accent/50 transition-all"
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
                    className="glass-card border border-accent/20 p-4 rounded-lg hover:border-accent/50 transition-all"
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
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
