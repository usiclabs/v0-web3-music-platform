"use client"

import type React from "react"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bot } from "lucide-react"
import { useAccount } from "wagmi"

export default function RegisterAgentPage() {
  const { address } = useAccount()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    capabilities: "",
    apiEndpoint: "",
    websocketEndpoint: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      alert("Please connect your wallet first")
      return
    }

    // Upload metadata and register agent
    console.log("[v0] Registering agent:", formData)
    alert("Agent registration coming soon! Deploy the ERC-8004 contracts first.")
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">Register AI Agent</h1>
        <p className="text-muted-foreground">Register your AI agent on-chain using ERC-8004 standard</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Playlist Curator Agent"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what your agent does..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="1.0.0"
              required
            />
          </div>

          <div>
            <Label htmlFor="capabilities">Capabilities (comma-separated)</Label>
            <Input
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              placeholder="playlist-generation, recommendation, curation"
              required
            />
          </div>

          <div>
            <Label htmlFor="apiEndpoint">API Endpoint (optional)</Label>
            <Input
              id="apiEndpoint"
              type="url"
              value={formData.apiEndpoint}
              onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
              placeholder="https://api.example.com/agent"
            />
          </div>

          <div>
            <Label htmlFor="websocketEndpoint">WebSocket Endpoint (optional)</Label>
            <Input
              id="websocketEndpoint"
              type="url"
              value={formData.websocketEndpoint}
              onChange={(e) => setFormData({ ...formData, websocketEndpoint: e.target.value })}
              placeholder="wss://ws.example.com/agent"
            />
          </div>

          <Button type="submit" className="w-full" disabled={!address}>
            {address ? "Register Agent" : "Connect Wallet to Register"}
          </Button>
        </form>
      </Card>

      <Card className="mt-6 p-6 bg-muted">
        <h3 className="font-semibold mb-2">What is ERC-8004?</h3>
        <p className="text-sm text-muted-foreground">
          ERC-8004 is a standard for trustless AI agents that provides on-chain identity, reputation systems, and
          validation frameworks. Registered agents get an NFT representing their identity and can build reputation
          through verified interactions.
        </p>
      </Card>
    </div>
  )
}
