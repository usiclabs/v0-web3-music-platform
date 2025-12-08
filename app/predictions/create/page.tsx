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
import { ArrowLeft, TrendingUp, DollarSign, Users, Music } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function CreateMarketPage() {
  const router = useRouter()
  const { address } = useAccount()
  const [loading, setLoading] = useState(false)

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/predictions"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Markets
          </Link>
          <h1 className="text-3xl font-bold">Create Prediction Market</h1>
          <p className="text-muted-foreground mt-2">Create a new market for predicting artist success metrics</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Market Details */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Market Details</h2>

            <div className="space-y-2">
              <Label htmlFor="title">Market Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Will Artist X reach 1M streams by EOY?"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the prediction market..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market_cap">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Market Cap
                    </div>
                  </SelectItem>
                  <SelectItem value="streams">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Streams
                    </div>
                  </SelectItem>
                  <SelectItem value="followers">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Followers
                    </div>
                  </SelectItem>
                  <SelectItem value="revenue">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Revenue
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Target */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Target</h2>

            <div className="space-y-2">
              <Label htmlFor="targetType">Target Type</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) => setFormData({ ...formData, targetType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="token">Token</SelectItem>
                  <SelectItem value="artist">Artist</SelectItem>
                  <SelectItem value="track">Track</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetId">
                {formData.targetType === "token" && "Token Address"}
                {formData.targetType === "artist" && "Artist Address"}
                {formData.targetType === "track" && "Track ID"}
              </Label>
              <Input
                id="targetId"
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                placeholder="0x..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetName">Display Name</Label>
              <Input
                id="targetName"
                value={formData.targetName}
                onChange={(e) => setFormData({ ...formData, targetName: e.target.value })}
                placeholder="Artist or token name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetImageUrl">Image URL (optional)</Label>
              <Input
                id="targetImageUrl"
                value={formData.targetImageUrl}
                onChange={(e) => setFormData({ ...formData, targetImageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </Card>

          {/* Outcome */}
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Outcome Definition</h2>

            <div className="space-y-2">
              <Label htmlFor="outcomeMetric">Metric</Label>
              <Select
                value={formData.outcomeMetric}
                onValueChange={(value) => setFormData({ ...formData, outcomeMetric: value })}
              >
                <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outcomeOperator">Operator</Label>
                <Select
                  value={formData.outcomeOperator}
                  onValueChange={(value) => setFormData({ ...formData, outcomeOperator: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">=">{">="} Greater than or equal</SelectItem>
                    <SelectItem value=">">{">"} Greater than</SelectItem>
                    <SelectItem value="<=">{" <="} Less than or equal</SelectItem>
                    <SelectItem value="<">{"<"} Less than</SelectItem>
                    <SelectItem value="=">= Equal to</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcomeThreshold">Threshold Value</Label>
                <Input
                  id="outcomeThreshold"
                  type="number"
                  step="any"
                  value={formData.outcomeThreshold}
                  onChange={(e) => setFormData({ ...formData, outcomeThreshold: e.target.value })}
                  placeholder="1000000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolutionDate">Resolution Date</Label>
              <Input
                id="resolutionDate"
                type="datetime-local"
                value={formData.resolutionDate}
                onChange={(e) => setFormData({ ...formData, resolutionDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationSource">Verification Source</Label>
              <Select
                value={formData.verificationSource}
                onValueChange={(value) => setFormData({ ...formData, verificationSource: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dexscreener">DexScreener</SelectItem>
                  <SelectItem value="supabase_streams">Platform Streams</SelectItem>
                  <SelectItem value="on_chain">On-Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !address} className="flex-1">
              {loading ? "Creating..." : "Create Market"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
