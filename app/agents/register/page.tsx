"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Check } from "lucide-react"
import { useAccount } from "wagmi"
import { useRouter } from "next/navigation"

export default function RegisterAgentPage() {
  const { address } = useAccount()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    capabilities: "",
    apiEndpoint: "",
    websocketEndpoint: "",
  })
  const [registering, setRegistering] = useState(false)
  const [agentAddress, setAgentAddress] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address) {
      alert("Please connect your wallet first")
      return
    }

    if (!agentAddress) {
      alert("Please enter the agent's Ethereum address")
      return
    }

    setRegistering(true)

    try {
      // Register agent in database
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          version: formData.version,
          capabilities: formData.capabilities,
          apiEndpoint: formData.apiEndpoint,
          websocketEndpoint: formData.websocketEndpoint,
          ownerAddress: address,
          agentAddress: agentAddress,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to register agent")
      }

      const { agent } = await response.json()
      alert("Agent registered successfully!")
      router.push(`/agents/${agent.agent_address}`)
    } catch (error) {
      console.error("[v0] Error registering agent:", error)
      alert(error instanceof Error ? error.message : "Failed to register agent")
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center mb-8">
        <Bot className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">Register AI Agent</h1>
        <p className="text-muted-foreground">Register your AI agent on the MyUSIC platform using ERC-8004 standard</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="agentAddress">Agent Ethereum Address *</Label>
            <Input
              id="agentAddress"
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value)}
              placeholder="0x..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">The Ethereum address that will represent this agent</p>
          </div>

          <div>
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Playlist Curator Agent"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
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
            <Label htmlFor="capabilities">Capabilities (comma-separated) *</Label>
            <Input
              id="capabilities"
              value={formData.capabilities}
              onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
              placeholder="playlist-generation, recommendation, curation"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">What can this agent do? Separate with commas</p>
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

          <Button type="submit" className="w-full" disabled={!address || registering}>
            {registering ? (
              "Registering..."
            ) : address ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Register Agent
              </>
            ) : (
              "Connect Wallet to Register"
            )}
          </Button>
        </form>
      </Card>

      <Card className="mt-6 p-6 bg-muted">
        <h3 className="font-semibold mb-2">What is ERC-8004?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          ERC-8004 is a standard for trustless AI agents that provides on-chain identity, reputation systems, and
          validation frameworks. Registered agents get an NFT representing their identity and can build reputation
          through verified interactions.
        </p>
        <h3 className="font-semibold mb-2">Benefits of Registering</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Verified on-chain identity for your agent</li>
          <li>Build transparent reputation through user feedback</li>
          <li>Enable automated music operations with trust</li>
          <li>Access to platform agent marketplace</li>
        </ul>
      </Card>
    </div>
  )
}
