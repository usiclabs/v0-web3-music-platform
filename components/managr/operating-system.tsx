"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

const benefits = [
  {
    title: "Coordinates Agent Teams",
    description: "Direct specialized AI agents across creation, release, marketing, and analytics.",
    icon: "🎯",
  },
  {
    title: "Protects Creator Ownership",
    description: "Stay in full control of your music, data, audience, and earnings.",
    icon: "🔐",
  },
  {
    title: "Repeatable Release Systems",
    description: "Turn every release into an optimized, scalable, data-driven system.",
    icon: "⚡",
}]

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

export function ManagROperatingSystem() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-6xl mx-auto"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        <div className="mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance mb-8">
            NOT A MANAGER.
            <br />
            A <span className="text-red-500">MUSIC OPERATING SYSTEM.</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl leading-relaxed">
            MANAGR is the coordination layer for an artist-owned label stack. It helps artists direct autonomous
            sub-agents across the operational, promotional, financial, and analytical layers of their music career.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((card, index) => (
            <motion.div
              key={index}
              className="group glass-card border border-red-500/20 hover:border-red-500/50 p-8 rounded-xl transition-all duration-300 hover-lift relative overflow-hidden"
              variants={itemVariants}
              whileHover={{
                y: -8,
                boxShadow: "0 20px 40px rgba(239, 68, 68, 0.15)",
              }}
            >
              <div className="relative z-10">
                <div className="text-4xl mb-4">{card.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
                <p className="text-gray-400">{card.description}</p>
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
            </motion.div>
          ))}
        </div>

        {/* Core systems explanation */}
        <motion.div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8" variants={containerVariants}>
          <motion.div
            className="glass-card border border-red-500/20 p-8 rounded-xl hover:border-red-500/50 transition-all"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">●</span> Creative Layer
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Producer Agent assists with concepts, lyrics, production direction, and creative iteration to help refine your unique sound.
            </p>
          </motion.div>

          <motion.div
            className="glass-card border border-red-500/20 p-8 rounded-xl hover:border-red-500/50 transition-all"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">●</span> Release Layer
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Release Agent prepares tracks, metadata, release plans, and launch workflows to execute professional releases.
            </p>
          </motion.div>

          <motion.div
            className="glass-card border border-red-500/20 p-8 rounded-xl hover:border-red-500/50 transition-all"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">●</span> Promotion Layer
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Marketing and Distribution Agents create campaigns, handle packaging, and connect music across platforms and audiences.
            </p>
          </motion.div>

          <motion.div
            className="glass-card border border-red-500/20 p-8 rounded-xl hover:border-red-500/50 transition-all"
            variants={itemVariants}
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-red-500">●</span> Analytics Layer
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Royalty and Analytics Agents track performance, payouts, earnings transparency, and audience behavior to drive decisions.
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
