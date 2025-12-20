"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  Music,
  Coins,
  Sparkles,
  Info,
  Calendar,
  Target,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const MARKET_TEMPLATES = [
  {
    id: "streams-1m",
    name: "1M Streams Milestone",
    category: "streams",
    icon: Music,
    description: "Will [Artist] reach 1 million streams?",
    outcomeMetric: "stream_count",
    outcomeThreshold: 1000000,
    verificationSource: "supabase_streams",
  },
  {
    id: "mcap-100k",
    name: "$100K Market Cap",
    category: "market_cap",
    icon: Coins,
    description: "Will [Token] reach $100K market cap?",
    outcomeMetric: "market_cap_usd",
    outcomeThreshold: 100000,
    verificationSource: "dexscreener",
  },
  {
    id: "followers-10k",
    name: "10K Followers",
    category: "followers",
    icon: Users,
    description: "Will [Artist] gain 10K followers?",
    outcomeMetric: "follower_count",
    outcomeThreshold: 10000,
    verificationSource: "supabase_streams",
  },
  {
    id: "revenue-50k",
    name: "$50K Revenue",
    category: "revenue",
    icon: DollarSign,
    description: "Will [Artist] generate $50K revenue?",
    outcomeMetric: "revenue_usd",
    outcomeThreshold: 50000,
    verificationSource: "supabase_streams",
  },
]

export default function CreateMarketPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "market_cap",
    targetType: "token",
    targetId: "",
    targetName: "",
    targetImageUrl: "",
    outcomeMetric: "market_cap_usd",
    outcomeThreshold: "",
    outcomeOperator: ">=",
    resolutionDate: "",
    verificationSource: "dexscreener",
  })

  const applyTemplate = (templateId: string) => {
    const template = MARKET_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    setSelectedTemplate(templateId)
    setFormData({
      ...formData,
      category: template.category,
      outcomeMetric: template.outcomeMetric,
      outcomeThreshold: template.outcomeThreshold.toString(),
      verificationSource: template.verificationSource,
    })
    setCurrentStep(2)
  }

  const validateStep = (step: number) => {
    switch (step) {
      case 2:
        return formData.title && formData.description && formData.category
      case 3:
        return formData.targetType && formData.targetId && formData.targetName
      case 4:
        return formData.outcomeMetric && formData.outcomeThreshold && formData.resolutionDate
      default:
        return true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      toast.error("Please connect your wallet")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/predictions/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          outcomeThreshold: Number.parseFloat(formData.outcomeThreshold),
          creatorAddress: address,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create market")
      }

      const { market } = await response.json()
      toast.success("Market created successfully!")
      router.push(`/predictions/${market.id}`)
    } catch (error: any) {
      console.error("Error creating market:", error)
      toast.error(error.message || "Failed to create market")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link
            href="/predictions"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 sm:mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Markets
          </Link>

          <div className="relative">
            <Badge className="mb-3 sm:mb-4 gap-1 bg-accent/10 text-accent hover:bg-accent/20">
              <Sparkles className="h-3 w-3" />
              Create New Market
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Launch a Prediction Market</h1>
            <p className="text-muted-foreground mt-2 sm:mt-3 text-sm sm:text-lg">
              Create a market for any music industry outcome. Start with a template or build from scratch.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 sm:mt-8 flex items-center gap-1 sm:gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-1 sm:gap-2 flex-1">
                <div
                  className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-semibold transition-all ${
                    step < currentStep
                      ? "bg-accent text-accent-foreground"
                      : step === currentStep
                        ? "bg-accent text-accent-foreground ring-2 sm:ring-4 ring-accent/20"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step < currentStep ? <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" /> : step}
                </div>
                {step < 4 && (
                  <div className={`h-0.5 flex-1 transition-colors ${step < currentStep ? "bg-accent" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Step 1: Choose Template */}
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="p-4 sm:p-6">
                <div className="flex items-start gap-3 mb-4 sm:mb-6">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Choose a Template</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Start with a pre-configured template or create custom
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 mb-4 sm:mb-6">
                  {MARKET_TEMPLATES.map((template) => {
                    const IconComponent = template.icon
                    return (
                      <Card
                        key={template.id}
                        className={`group cursor-pointer transition-all active:scale-[0.98] sm:hover:shadow-lg sm:hover:-translate-y-0.5 ${
                          selectedTemplate === template.id ? "ring-2 ring-accent bg-accent/5" : "hover:border-accent/50"
                        }`}
                        onClick={() => applyTemplate(template.id)}
                      >
                        <div className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                              <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base">{template.name}</h3>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                                {template.description}
                              </p>
                              <Badge variant="secondary" className="mt-2 text-xs">
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-4 sm:mt-6 bg-transparent h-11"
                  onClick={() => setCurrentStep(2)}
                >
                  Create Custom Market
                </Button>
              </Card>
            </div>
          )}

          {/* Step 2: Market Details */}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Info className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Market Details</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Define your market question and category
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="flex items-center gap-2 text-sm">
                    Market Question
                    <span className="text-xs text-muted-foreground hidden sm:inline">(Be specific and clear)</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Will Artist X reach 1M streams?"
                    required
                    className="text-base sm:text-lg h-11 sm:h-auto"
                  />
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    Make it a YES/NO question
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide context and resolution criteria..."
                    rows={4}
                    required
                    className="resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market_cap">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          Market Cap
                        </div>
                      </SelectItem>
                      <SelectItem value="streams">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-blue-500" />
                          Streams
                        </div>
                      </SelectItem>
                      <SelectItem value="followers">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          Followers
                        </div>
                      </SelectItem>
                      <SelectItem value="revenue">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-500" />
                          Revenue
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 h-11">
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!validateStep(2)}
                  className="flex-1 h-11"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Target Selection */}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Select Target</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Choose the artist, token, or track</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetType" className="text-sm">
                    Target Type
                  </Label>
                  <Select
                    value={formData.targetType}
                    onValueChange={(value) => setFormData({ ...formData, targetType: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="token">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4" />
                          Token
                        </div>
                      </SelectItem>
                      <SelectItem value="artist">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4" />
                          Artist
                        </div>
                      </SelectItem>
                      <SelectItem value="track">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Track
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetId" className="text-sm">
                    {formData.targetType === "token" && "Contract Address"}
                    {formData.targetType === "artist" && "Wallet Address"}
                    {formData.targetType === "track" && "Track ID"}
                  </Label>
                  <Input
                    id="targetId"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                    placeholder="0x..."
                    required
                    className="font-mono text-xs sm:text-sm h-11"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetName" className="text-sm">
                      Display Name
                    </Label>
                    <Input
                      id="targetName"
                      value={formData.targetName}
                      onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                      placeholder="Artist or token name"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetImageUrl" className="text-sm">
                      Image URL <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="targetImageUrl"
                      value={formData.targetImageUrl}
                      onChange={(e) => setFormData({ ...formData, targetImageUrl: e.target.value })}
                      placeholder="https://..."
                      className="h-11"
                    />
                  </div>
                </div>
              </Card>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 h-11">
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  disabled={!validateStep(3)}
                  className="flex-1 h-11"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Outcome & Resolution */}
          {currentStep === 4 && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold">Outcome & Resolution</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">Define success criteria</p>
                  </div>
                </div>

                {/* Outcome Metric */}
                <div className="space-y-2">
                  <Label htmlFor="outcomeMetric" className="text-sm">
                    Success Metric
                  </Label>
                  <Select
                    value={formData.outcomeMetric}
                    onValueChange={(value) => setFormData({ ...formData, outcomeMetric: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market_cap_usd">Market Cap (USD)</SelectItem>
                      <SelectItem value="stream_count">Stream Count</SelectItem>
                      <SelectItem value="follower_count">Follower Count</SelectItem>
                      <SelectItem value="revenue_usd">Revenue (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Outcome Operator & Threshold */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outcomeOperator" className="text-sm">
                      Condition
                    </Label>
                    <Select
                      value={formData.outcomeOperator}
                      onValueChange={(value) => setFormData({ ...formData, outcomeOperator: value })}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">=">{">="}</SelectItem>
                        <SelectItem value=">">{">"}</SelectItem>
                        <SelectItem value="<=">{" <="}</SelectItem>
                        <SelectItem value="<">{"<"}</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="outcomeThreshold" className="text-sm">
                      Target Value
                    </Label>
                    <Input
                      id="outcomeThreshold"
                      type="number"
                      step="any"
                      value={formData.outcomeThreshold}
                      onChange={(e) => setFormData({ ...formData, outcomeThreshold: e.target.value })}
                      placeholder="1000000"
                      required
                      className="font-mono text-sm sm:text-base h-11"
                    />
                  </div>
                </div>

                {/* Market Resolution Preview */}
                <Card className="bg-muted/50 p-4 border-accent/20">
                  <p className="text-sm text-muted-foreground mb-1">Market resolves YES if:</p>
                  <p className="font-semibold">
                    {formData.targetName || "[Target]"}'s {formData.outcomeMetric.replace(/_/g, " ")}{" "}
                    {formData.outcomeOperator} {formData.outcomeThreshold || "[value]"}
                  </p>
                </Card>

                {/* Resolution Date */}
                <div className="space-y-2">
                  <Label htmlFor="resolutionDate" className="text-sm">
                    Resolution Date
                  </Label>
                  <Input
                    id="resolutionDate"
                    type="datetime-local"
                    value={formData.resolutionDate}
                    onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                    required
                    className="font-mono text-sm sm:text-base h-11"
                  />
                  <p className="text-xs text-muted-foreground">Trading closes and market resolves on this date</p>
                </div>

                {/* Verification Source */}
                <div className="space-y-2">
                  <Label htmlFor="verificationSource" className="text-sm">
                    Data Source
                  </Label>
                  <Select
                    value={formData.verificationSource}
                    onValueChange={(value) => setFormData({ ...formData, verificationSource: value })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dexscreener">
                        <div>
                          <div className="font-medium">DexScreener</div>
                          <div className="text-xs text-muted-foreground">For token prices and market caps</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="supabase_streams">
                        <div>
                          <div className="font-medium">Platform Data</div>
                          <div className="text-xs text-muted-foreground">For streams, followers, revenue</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="on_chain">
                        <div>
                          <div className="font-medium">On-Chain</div>
                          <div className="text-xs text-muted-foreground">Verified blockchain data</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* Ready to Launch */}
              <Card className="p-4 sm:p-6 bg-gradient-to-br from-accent/5 to-accent/0 border-accent/20">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Ready to Launch</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Review your market details and create when ready
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="secondary">{formData.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-medium">{formData.targetName || "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resolution:</span>
                    <span className="font-medium">
                      {formData.resolutionDate ? new Date(formData.resolutionDate).toLocaleDateString() : "Not set"}
                    </span>
                  </div>
                </div>
              </Card>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} className="flex-1 h-11">
                  Back
                </Button>
                <Button type="submit" disabled={!validateStep(4) || loading} className="flex-1 h-11">
                  {loading ? "Creating..." : "Create Market"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
