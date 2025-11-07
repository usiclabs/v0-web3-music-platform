"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Music,
  Coins,
  TrendingUp,
  Wallet,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Play,
  Users,
  Shield,
  Zap,
} from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

const onboardingSteps = [
  {
    id: 1,
    title: "Welcome to MyUSIC",
    subtitle: "The Future of Music",
    description:
      "Experience a revolutionary music platform where artists earn directly from streams and fans collect exclusive song tokens.",
    icon: Music,
    color: "from-blue-500 to-cyan-500",
    features: [
      { icon: Play, text: "Stream unlimited music" },
      { icon: Coins, text: "Support artists directly" },
      { icon: Shield, text: "Blockchain secured" },
    ],
  },
  {
    id: 2,
    title: "Instant Micropayments",
    subtitle: "X402 Protocol",
    description:
      "Artists receive real-time micropayments for every second of music streamed. No middlemen, no delays—just direct payments on the blockchain.",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
    features: [
      { icon: Coins, text: "Pay per second streaming" },
      { icon: Zap, text: "Instant settlements" },
      { icon: Shield, text: "Transparent pricing" },
    ],
  },
  {
    id: 3,
    title: "AI Agent Economy",
    subtitle: "ERC-8004 Powered",
    description:
      "Discover music through verified AI agents with transparent reputation systems. Experience the future of autonomous music curation.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    features: [
      { icon: Sparkles, text: "AI-powered playlists" },
      { icon: Users, text: "Trusted agent network" },
      { icon: TrendingUp, text: "Smart recommendations" },
    ],
  },
  {
    id: 4,
    title: "Collect & Trade",
    subtitle: "Song Tokens",
    description:
      "Each song has its own tradeable token. Collect tokens from artists you love and watch their value grow as the music gains popularity.",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500",
    features: [
      { icon: TrendingUp, text: "Trade song tokens" },
      { icon: Coins, text: "Earn from growth" },
      { icon: Sparkles, text: "Support your favorites" },
    ],
  },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<"forward" | "backward">("forward")
  const { connect, isConnected } = useWallet()
  const router = useRouter()

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setDirection("forward")
      setCurrentStep(currentStep + 1)
    } else {
      router.push("/")
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection("backward")
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConnectWallet = async () => {
    await connect()
    router.push("/")
  }

  const currentStepData = onboardingSteps[currentStep]
  const Icon = currentStepData.icon
  const isLastStep = currentStep === onboardingSteps.length - 1

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Animated Background Gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${currentStepData.color} opacity-10 blur-3xl transition-all duration-1000`}
          style={{
            transform: `scale(${1 + currentStep * 0.1})`,
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="text-2xl font-bold">
            MyUSIC
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
            Skip
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="max-w-4xl w-full">
            {/* Step Content with Slide Animation */}
            <div
              key={currentStep}
              className={`animate-in fade-in slide-in-from-${direction === "forward" ? "right" : "left"}-8 duration-700`}
            >
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div
                  className={`relative rounded-3xl p-8 bg-gradient-to-br ${currentStepData.color} animate-in zoom-in duration-500 delay-150`}
                >
                  <Icon className="h-16 w-16 text-white" />
                  {/* Glow Effect */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${currentStepData.color} blur-2xl opacity-50 -z-10`}
                  />
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center mb-12 space-y-4">
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                  {currentStepData.title}
                </h1>
                <p className="text-xl md:text-2xl text-white/60 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                  {currentStepData.subtitle}
                </p>
                <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700">
                  {currentStepData.description}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
                {currentStepData.features.map((feature, idx) => {
                  const FeatureIcon = feature.icon
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700`}
                      style={{ animationDelay: `${900 + idx * 100}ms` }}
                    >
                      <FeatureIcon className="h-5 w-5 text-white/60 shrink-0" />
                      <span className="text-sm text-white/80">{feature.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex justify-center gap-2 mb-12">
              {onboardingSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => {
                    setDirection(index > currentStep ? "forward" : "backward")
                    setCurrentStep(index)
                  }}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index === currentStep
                      ? "w-12 bg-white"
                      : index < currentStep
                        ? "w-2 bg-white/40"
                        : "w-2 bg-white/20 hover:bg-white/30"
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`gap-2 ${currentStep === 0 ? "invisible" : ""} hover:bg-white/10 transition-all`}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {/* Next/Connect Button */}
              <div className="flex gap-3">
                {isLastStep && !isConnected && (
                  <Button
                    onClick={handleConnectWallet}
                    size="lg"
                    className={`gap-2 bg-gradient-to-r ${currentStepData.color} hover:opacity-90 transition-all shadow-lg`}
                  >
                    <Wallet className="h-5 w-5" />
                    Connect Wallet
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  size="lg"
                  className={`gap-2 ${
                    isLastStep && !isConnected
                      ? "bg-white/10 hover:bg-white/20"
                      : `bg-gradient-to-r ${currentStepData.color} hover:opacity-90`
                  } transition-all shadow-lg`}
                >
                  {isLastStep ? "Get Started" : "Continue"}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-white/40 pb-6">
          Step {currentStep + 1} of {onboardingSteps.length}
        </div>
      </div>
    </div>
  )
}
