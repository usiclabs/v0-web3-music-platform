"use client"

import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FieldGuide() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-red-500/20">
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
      >
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight text-balance mb-12">
          READ THE
          <br />
          <span className="text-red-500">ARTIST-OWNED LABEL STACK.</span>
        </h2>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Description */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              A high-level field guide to autonomous music agents, MyUSIC, x402 payments, onchain ownership, and the
              future of creator-owned music infrastructure.
            </p>

            <Button
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 h-12 text-base hover-glow shadow-lg shadow-red-500/25 hover:scale-105 transition-all"
              onClick={() => {
                // Scroll to CTA or trigger download
                const ctaElement = document.querySelector('a[href="/dashboard"]');
                ctaElement?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Download the Field Guide
            </Button>

            <p className="text-sm text-gray-500 mt-4">Free. No signup required.</p>
          </motion.div>

          {/* Right: 3D Book Card Mockup */}
          <motion.div
            className="relative h-96 perspective"
            initial={{ opacity: 0, rotateY: -30 }}
            whileInView={{ opacity: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Outer shadow/depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-transparent rounded-2xl blur-3xl" />

            {/* Book card */}
            <motion.div
              className="relative h-full glass-card border border-red-500/40 p-8 rounded-2xl flex flex-col justify-center items-center text-center bg-gradient-to-br from-red-500/10 to-transparent overflow-hidden group hover-lift"
              whileHover={{ y: -12, rotateY: 10 }}
            >
              {/* Accent glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              {/* Book icon */}
              <motion.div
                className="text-6xl mb-6 relative z-10"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                📖
              </motion.div>

              {/* Content */}
              <div className="relative z-10">
                <h3 className="text-2xl font-bold font-display text-white mb-2">The Artist-Owned</h3>
                <h3 className="text-2xl font-bold font-display text-red-500 mb-4">Label Stack</h3>

                <p className="text-sm text-gray-400 mb-6">How autonomous music agents are rebuilding the music business</p>

                <div className="flex justify-center gap-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-red-500 rounded-full" />
                    Practical Guide
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-red-500 rounded-full" />
                    Free Resource
                  </span>
                </div>
              </div>

              {/* Page curl effect */}
              <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-bl from-gray-900/50 to-transparent rounded-bl-3xl" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
