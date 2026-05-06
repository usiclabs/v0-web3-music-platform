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
              {[
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
                },
              ].map((card, index) => (
                <motion.div
                  key={index}
                  className="group glass-card border border-red-500/20 hover:border-red-500/50 p-8 rounded-xl transition-all duration-300 hover-lift"
                  whileHover={{ y: -8 }}
                >
                  <div className="text-4xl mb-4">{card.icon}</div>
                  <h3 className="text-xl font-bold mb-3 text-white">{card.title}</h3>
                  <p className="text-gray-400">{card.description}</p>
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:to-red-500/5 rounded-xl transition-all duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

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
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-red-500/20">
          <motion.div
            className="max-w-6xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display leading-tight mb-6 text-balance">
              DEPLOY YOUR
              <br />
              <span className="text-red-500">FIRST MUSIC AGENT TEAM.</span>
            </h2>

            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12">
              MANAGR gives artists the coordination layer to create, release, promote, analyze, and earn with
              autonomous music agents.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
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
                Download the Field Guide
              </Button>
            </div>

            <p className="text-sm text-gray-500">
              MANAGR provides creative and operational infrastructure. Earnings are not guaranteed.
            </p>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-red-500/20 py-12 px-4 sm:px-6 lg:px-8">
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
