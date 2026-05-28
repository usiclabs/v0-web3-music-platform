"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ManagRHero } from "@/components/managr/hero"
import { ManagROperatingSystem } from "@/components/managr/operating-system"
import { AgentStack } from "@/components/managr/agent-stack"
import { AgentReasoningSimulation } from "@/components/managr/agent-reasoning-simulation"
import { ManagRWorkflow } from "@/components/managr/workflow"
import { EcosystemDiagram } from "@/components/managr/ecosystem-diagram"
import { ArtistOwnedComparison } from "@/components/managr/artist-owned-comparison"
import { FieldGuide } from "@/components/managr/field-guide"
import { Manifesto } from "@/components/managr/manifesto"

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

export default function ManagRPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/10 rounded-full blur-3xl animate-pulse-slow animation-delay-4000" />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <ManagRHero />

        {/* What is MANAGR Section */}
        <ManagROperatingSystem />

        {/* Agent Stack Section */}
        <AgentStack />

        {/* Agent Chain of Thought Simulation */}
        <AgentReasoningSimulation />

        {/* How MANAGR Works Section */}
        <ManagRWorkflow />

        {/* MyUSIC Ecosystem Section */}
        <EcosystemDiagram />

        {/* Artist-Owned Label Section */}
        <ArtistOwnedComparison />

        {/* Field Guide Section */}
        <FieldGuide />

        {/* Manifesto Section */}
        <Manifesto />

        {/* Final CTA Section */}
        <section className="py-32 md:py-48 px-4 sm:px-6 lg:px-8 border-t border-red-500/20 relative overflow-hidden bg-gradient-to-b from-red-950/10 via-black to-black">
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 via-transparent to-transparent" />

          <motion.div
            className="max-w-6xl mx-auto text-center relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-6xl sm:text-7xl lg:text-8xl font-serif font-bold leading-tight mb-8 md:mb-12 text-balance">
              Deploy Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">First Music Agent Team.</span>
            </h2>

            <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-16 md:mb-24 font-light leading-relaxed">
              MANAGR gives artists the coordination layer to create, release, promote, analyze, and earn with autonomous music agents working on your behalf.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mb-12">
              <Button
                asChild
                size="lg"
                className="gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold px-10 md:px-12 h-14 md:h-16 text-base md:text-lg shadow-lg shadow-red-500/30 hover:shadow-red-500/60 hover:scale-105 transition-all duration-300"
              >
                <Link href="/managr/dashboard">Deploy Now</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-red-500/50 hover:border-red-400 text-white font-bold px-10 md:px-12 h-14 md:h-16 text-base md:text-lg hover:bg-red-500/10 hover:scale-105 transition-all duration-300"
              >
                Learn More
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              MANAGR provides creative and operational infrastructure. Earnings are not guaranteed.
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-accent/20 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
              <div>
                <h3 className="font-display font-bold text-lg mb-2">USIC</h3>
                <p className="text-gray-400 text-sm">Create. Own. Earn.</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">MyUSIC Operating System</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">AI-powered music finance ecosystem.</p>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
              <p>© 2024 MyUSIC. The next label is yours.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
