"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAccount } from "wagmi"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Calendar, Target, Zap, ArrowLeft } from "lucide-react"

const CATEGORIES = [
  { value: "streams", label: "Streams" },
  { value: "market_cap", label: "Market Cap" },
  { value: "followers", label: "Followers" },
  { value: "revenue", label: "Revenue" },
]

const OPERATORS = [
  { value: ">=", label: "Greater than or equal to (≥)" },
  { value: ">", label: "Greater than (>)" },
  { value: "<=", label: "Less than or equal to (≤)" },
  { value: "<", label: "Less than (<)" },
]

interface FormData {
  // Step 1
  title: string
  description: string
  category: string

  // Step 2
  targetName: string
  targetImageUrl: string
  outcomeMetric: string
  outcomeThreshold: string
  outcomeOperator: string

  // Step 3
  resolutionDate: string
  verificationSource: string
}

export default function CreatePredictionMarket() {
  const router = useRouter()
  const { address } = useAccount()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "streams",
    targetName: "",
    targetImageUrl: "",
    outcomeMetric: "",
    outcomeThreshold: "",
    outcomeOperator: ">=",
    resolutionDate: "",
    verificationSource: "",
  })

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.description && formData.category)
      case 2:
        return !!(
          formData.targetName &&
          formData.outcomeMetric &&
          formData.outcomeThreshold &&
          formData.outcomeOperator
        )
      case 3:
        return !!(formData.resolutionDate && formData.verificationSource)
      case 4:
        return validateStep(1) && validateStep(2) && validateStep(3)
      default:
        return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address || !validateStep(4)) return

    setLoading(true)
    try {
      const res = await fetch("/api/predictions/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          target_type: "artist", // Could be dynamic
          target_id: formData.targetName.toLowerCase().replace(/\s+/g, "-"),
          target_name: formData.targetName,
          target_image_url: formData.targetImageUrl || null,
          outcome_metric: formData.outcomeMetric,
          outcome_threshold: Number.parseFloat(formData.outcomeThreshold),
          outcome_operator: formData.outcomeOperator,
          resolution_date: new Date(formData.resolutionDate).toISOString(),
          creator_address: address,
          verification_source: formData.verificationSource,
        }),
      })

      if (!res.ok) throw new Error("Failed to create market")

      const market = await res.json()
      router.push(`/predictions/${market.id}`)
    } catch (error) {
      console.error("[v0] Error creating market:", error)
      alert("Failed to create prediction market")
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.back()} className="rounded-lg hover:bg-muted p-2 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Create Prediction Market</h1>
            <p className="mt-1 text-muted-foreground">
              Step {currentStep} of 4 -{" "}
              {["Market Basics", "Outcome Details", "Resolution Setup", "Review"][currentStep - 1]}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex-1">
              <div className={`h-2 rounded-full transition-all ${step <= currentStep ? "bg-accent" : "bg-muted"}`} />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Step 1: Market Basics */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Market Basics</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define the core details of your prediction market
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Market Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Will Dua Lipa reach 50M monthly listeners by Dec 2024?"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide context and details about this prediction market..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="mt-2 min-h-24"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Outcome Details */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Zap className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Outcome Details</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Define what will be predicted and how to measure it
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="targetName">Target Name</Label>
                    <Input
                      id="targetName"
                      placeholder="e.g., Dua Lipa, Bitcoin, etc."
                      value={formData.targetName}
                      onChange={(e) => handleInputChange("targetName", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetImageUrl">Target Image URL (Optional)</Label>
                    <Input
                      id="targetImageUrl"
                      placeholder="https://example.com/image.jpg"
                      value={formData.targetImageUrl}
                      onChange={(e) => handleInputChange("targetImageUrl", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="outcomeMetric">Outcome Metric</Label>
                    <Input
                      id="outcomeMetric"
                      placeholder="e.g., Monthly Listeners, Token Price, etc."
                      value={formData.outcomeMetric}
                      onChange={(e) => handleInputChange("outcomeMetric", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="outcomeOperator">Operator</Label>
                      <Select
                        value={formData.outcomeOperator}
                        onValueChange={(value) => handleInputChange("outcomeOperator", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="outcomeThreshold">Target Value</Label>
                      <Input
                        id="outcomeThreshold"
                        type="number"
                        placeholder="50000000"
                        value={formData.outcomeThreshold}
                        onChange={(e) => handleInputChange("outcomeThreshold", e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Resolution Setup */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Resolution Setup</h2>
                    <p className="text-sm text-muted-foreground mt-1">Set when and how the market will be resolved</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resolutionDate">Resolution Date</Label>
                    <Input
                      id="resolutionDate"
                      type="datetime-local"
                      value={formData.resolutionDate}
                      onChange={(e) => handleInputChange("resolutionDate", e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="verificationSource">Verification Source</Label>
                    <Input
                      id="verificationSource"
                      placeholder="e.g., Spotify API, CoinGecko, Official Website"
                      value={formData.verificationSource}
                      onChange={(e) => handleInputChange("verificationSource", e.target.value)}
                      className="mt-2"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <Card className="p-6 space-y-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Outcome & Resolution</h2>
                    <p className="text-sm text-muted-foreground mt-1">Set the resolution criteria and timeline</p>
                  </div>
                </div>

                {/* Market Quality Check */}
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-accent/10 p-2 shrink-0">
                      <AlertCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Market Quality Check</p>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Clear resolution criteria</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Objective verification source</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>Reasonable resolution timeline</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full h-12 text-base font-semibold" size="lg">
                  {loading ? "Creating Market..." : "Create Market"}
                </Button>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex-1 bg-transparent"
            >
              Previous
            </Button>
            <Button
              type="button"
              onClick={nextStep}
              disabled={currentStep === 4 || !validateStep(currentStep)}
              className="flex-1"
            >
              Next
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
