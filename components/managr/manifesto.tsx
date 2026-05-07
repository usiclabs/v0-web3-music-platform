"use client"

import { motion } from "framer-motion"

export function Manifesto() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-red-500/20 relative overflow-hidden">
      {/* Background waveform effect */}
      <div className="absolute inset-0 opacity-30">
        <svg
          className="w-full h-full"
          viewBox="0 0 1200 400"
          preserveAspectRatio="none"
          style={{ filter: "drop-shadow(0 0 20px rgba(239, 68, 68, 0.3))" }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0.3)" />
              <stop offset="50%" stopColor="rgba(220, 38, 38, 0.5)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0.3)" />
            </linearGradient>
          </defs>
          <path
            d="M0,200 Q150,100 300,200 T600,200 T900,200 T1200,200 L1200,400 L0,400 Z"
            fill="url(#waveGradient)"
            opacity="0.4"
          />
          <path
            d="M0,250 Q200,150 400,250 T800,250 T1200,250 L1200,400 L0,400 Z"
            fill="url(#waveGradient)"
            opacity="0.2"
          />
        </svg>
      </div>

      <motion.div
        className="max-w-4xl mx-auto text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Main quote */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <blockquote className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance mb-8">
            The future is not
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600">
              AI versus artists.
            </span>
            <br />
            It is artists with
            <br />
            <span className="text-red-500">agent teams.</span>
          </blockquote>
        </motion.div>

        {/* Footer text */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className="text-2xl font-display font-bold text-gray-300 tracking-widest">
            Create. Own. Earn.
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
