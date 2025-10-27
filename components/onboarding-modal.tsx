"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Music, Coins, TrendingUp, Wallet, Sparkles, ArrowRight, X } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"

const ONBOARDING_STORAGE_KEY = "usic-onboarding-completed"

const steps = [
  {
    title: "Welcome to USIC",
    description: "The future of music streaming powered by Web3",
    content:
      "Experience a revolutionary music platform where artists earn directly from streams and fans collect exclusive song tokens.",
    icon: Music,
    gradient: "from-accent/20 via-accent/10 to-transparent",
  },
  {
    title: "Stream & Earn",
    description: "Every stream pays artists instantly",
    content:
      "Artists receive micropayments in real-time for every second of music streamed. No middlemen, no delays—just direct payments on the blockchain.",
    icon: Coins,
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
  },
  {
    title: "Collect Song Tokens",
    description: "Own a piece of your favorite tracks",
    content:
      "Each song has its own tradeable token. Collect tokens from artists you love and watch their value grow as the music gains popularity.",
    icon: TrendingUp,
    gradient: "from-green-500/20 via-green-500/10 to-transparent",
  },
  {
    title: "Stake & Multiply",
    description: "Earn rewards by staking $USI",
    content:
      "Stake your $USI tokens to earn a share of platform revenue. The more you stake, the more you earn from every stream on the platform.",
    icon: Sparkles,
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
  },
]

export function OnboardingModal() {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const { connect, isConnected } = useWallet()

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_STORAGE_KEY)
    if (!hasCompletedOnboarding) {
      // Show onboarding after a short delay for better UX
      const timer = setTimeout(() => setOpen(true), 1000)
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
        <DialogOverlay className="bg-black/80 backdrop-blur-md" />
        <DialogContent className="max-w-2xl border-0 bg-transparent p-0 shadow-none" hideClose>
          {/* Glassmorphic Container */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
            {/* Animated Background Gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${currentStepData.gradient} opacity-50 transition-all duration-700`}
            />

            {/* Floating Orbs */}
            <div className="absolute -left-20 -top-20 h-40 w-40 animate-pulse-slow rounded-full bg-accent/20 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-40 w-40 animate-pulse-slow rounded-full bg-blue-500/20 blur-3xl animation-delay-2000" />

            {/* Content */}
            <div className="relative z-10 p-8 sm:p-12">
              {/* Close Button */}
              <button
                onClick={handleSkip}
                className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Skip onboarding"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <Icon className="h-12 w-12 text-accent animate-float" />
                </div>
              </div>

              {/* Title */}
              <h2 className="mb-3 text-center text-3xl font-bold text-white sm:text-4xl">{currentStepData.title}</h2>

              {/* Description */}
              <p className="mb-4 text-center text-lg text-white/80">{currentStepData.description}</p>

              {/* Content */}
              <p className="mb-8 text-center text-base leading-relaxed text-white/60">{currentStepData.content}</p>

              {/* Progress Indicators */}
              <div className="mb-8 flex justify-center gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep ? "w-8 bg-accent" : "w-2 bg-white/20 hover:bg-white/40"
                    }`}
                    aria-label={`Go to step ${index + 1}`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                {/* Back Button */}
                {currentStep > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="border border-white/10 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10"
                  >
                    Back
                  </Button>
                )}

                {/* Spacer for alignment when no back button */}
                {currentStep === 0 && <div className="hidden sm:block" />}

                {/* Next/Connect Button */}
                {isLastStep ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={handleComplete}
                      className="border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10"
                    >
                      Explore Platform
                    </Button>
                    {!isConnected && (
                      <Button
                        onClick={handleConnectWallet}
                        className="gap-2 bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
                      >
                        <Wallet className="h-4 w-4" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={handleNext}
                    className="gap-2 bg-accent text-white shadow-lg shadow-accent/25 hover:bg-accent/90"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Skip Link */}
              <div className="mt-6 text-center">
                <button onClick={handleSkip} className="text-sm text-white/40 transition-colors hover:text-white/60">
                  Skip tutorial
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
