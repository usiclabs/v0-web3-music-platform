"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ManagRHero } from "@/components/managr/hero"
import { ManagROperatingSystem } from "@/components/managr/operating-system"
import { AgentStack } from "@/components/managr/agent-stack"
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
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-red-500/20 relative overflow-hidden">
          {/* Background accent */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 to-transparent" />

          <motion.div
            className="max-w-6xl mx-auto text-center relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 text-balance">
              DEPLOY YOUR
              <br />
              <span className="text-accent">FIRST MUSIC AGENT TEAM.</span>
            </h2>

            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12">
              MANAGR gives artists the coordination layer to create, release, promote, analyze, and earn with
              autonomous music agents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                asChild
                size="lg"
                variant="default"
                className="gap-1.5 sm:gap-2 !bg-accent hover:!bg-accent/90 text-white font-bold px-8 h-12 text-base shadow-lg shadow-accent/25 hover:scale-105 transition-all"
              >
                <Link href="/dashboard">Deploy MANAGR</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-accent/50 hover:border-accent text-white font-bold px-8 h-12 text-base hover:bg-accent/10 hover:scale-105 transition-all"
              >
                Download the Field Guide
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
