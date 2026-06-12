"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Music, Coins, TrendingUp, Wallet, Sparkles, ArrowRight, X, ChevronRight } from 'lucide-react'
import { useWallet } from "@/lib/web3/wallet-context"
import { motion } from "framer-motion"

const ONBOARDING_STORAGE_KEY = "usic-onboarding-completed"

const steps = [
  {
    title: "Welcome to the Future of Music",
    subtitle: "The creator-owned platform powered by Web3",
    description:
      "USIC gives artists direct control over their music, instant payments from streams, and the ability to build a fan-owned economy around their work.",
    icon: Music,
    gradient: "from-red-600 to-red-500",
    badge: "01",
  },
  {
    title: "Stream & Earn Instantly",
    subtitle: "Every second of music pays artists directly",
    description:
      "Artists receive real-time micropayments on-chain for every stream. No intermediaries, no delays—just transparent, direct compensation.",
    icon: Coins,
    gradient: "from-amber-600 to-amber-500",
    badge: "02",
  },
  {
    title: "Own the Music You Love",
    subtitle: "Collect and trade song tokens",
    description:
      "Each track has its own tradeable token. Collect from artists you believe in, own a piece of their success, and watch value grow with their career.",
    icon: TrendingUp,
    gradient: "from-emerald-600 to-emerald-500",
    badge: "03",
  },
  {
    title: "Stake & Grow Your Influence",
    subtitle: "Earn platform rewards",
    description:
      "Stake $USI to participate in platform governance and earn a share of all streaming revenue. The ecosystem rewards your commitment.",
    icon: Sparkles,
    gradient: "from-violet-600 to-violet-500",
    badge: "04",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { connect, isConnected } = useWallet()

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!hasCompletedOnboarding) {
      const timer = setTimeout(() => setOpen(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
    setOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, "true")
    setOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConnectWallet = async () => {
    await connect()
    handleComplete()
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon
  const isLastStep = currentStep === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPortal>
        <DialogOverlay className="bg-black/95 backdrop-blur-lg" />
        <DialogContent className="max-w-4xl border-0 bg-transparent p-0 shadow-none" showCloseButton={false}>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-black to-black backdrop-blur-2xl"
          >
            {/* Premium gradient background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentStepData.gradient} opacity-5`} />

            {/* Animated accent line */}
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${currentStepData.gradient} opacity-50`} />

            {/* Floating accent orbs */}
            <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${currentStepData.gradient}`} />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-10 bg-gradient-to-tr from-slate-500 to-slate-600" />

            {/* Content wrapper */}
            <div className="relative z-10">
              {/* Header with close and step counter */}
              <div className="flex items-center justify-between px-6 md:px-10 pt-6 md:pt-8 pb-4 md:pb-6 border-b border-white/5">
                {/* Badge */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${currentStepData.gradient} flex items-center justify-center font-serif font-bold text-white text-lg`}>
                    {currentStepData.badge}
                  </div>
                  <div className="hidden sm:block text-xs text-white/50 uppercase tracking-wider">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleSkip}
                  className="p-2.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300"
                  aria-label="Skip onboarding"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Main content */}
              <div className="px-6 md:px-10 py-8 md:py-12 space-y-8">
                {/* Icon with animated glow */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="flex justify-center"
                >
                  <div className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${currentStepData.gradient} p-0.5 shadow-lg shadow-current/20`}>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-40" />
                    <div className={`w-full h-full rounded-2xl bg-black flex items-center justify-center relative`}>
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
                    </div>
                  </div>
                </motion.div>

                {/* Text content */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-center space-y-4"
                >
                  <h2 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight">
                    {currentStepData.title}
                  </h2>
                  <p className="text-lg md:text-xl text-white/70 font-light">
                    {currentStepData.subtitle}
                  </p>
                  <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto font-light">
                    {currentStepData.description}
                  </p>
                </motion.div>

                {/* Progress dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="flex justify-center gap-3 py-6"
                >
                  {steps.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`rounded-full transition-all duration-300 ${
                        index === currentStep
                          ? "w-8 h-2.5 bg-gradient-to-r from-red-500 to-red-600"
                          : "w-2.5 h-2.5 bg-white/30 hover:bg-white/50"
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center pt-4"
                >
                  {currentStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="ghost"
                      className="border border-white/20 text-white hover:bg-white/10 h-12 px-6 font-medium"
                    >
                      Back
                    </Button>
                  )}

                  {currentStep === 0 && <div className="hidden sm:block" />}

                  <div className="flex gap-3 flex-1 sm:flex-none">
                    {isLastStep ? (
                      <>
                        <Button
                          onClick={handleComplete}
                          variant="outline"
                          className="flex-1 sm:flex-none border-white/20 text-white hover:bg-white/10 h-12 font-medium"
                        >
                          Explore Platform
                        </Button>
                        {!isConnected && (
                          <Button
                            onClick={handleConnectWallet}
                            className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-600 h-12 font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
                          >
                            <Wallet className="h-4 w-4" />
                            Connect Wallet
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        onClick={handleNext}
                        className="flex-1 sm:flex-none gap-2 bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-500 hover:to-red-600 h-12 font-semibold shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all group"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
