"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useWallet } from "@/lib/web3/wallet-context"
import { Code2, TrendingUp, Users, DollarSign, Sparkles, ExternalLink } from 'lucide-react'

export default function BuilderCodesPage() {
  const { address } = useWallet()
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [registrationForm, setRegistrationForm] = useState({
    code: "",
    name: "",
    description: "",
    websiteUrl: "",
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    try {
      const response = await fetch("/api/builder-codes/leaderboard?timeframe=30d")
      const data = await response.json()
      setLeaderboard(data.builders || [])
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    }
  }

  async function handleRegister() {
    if (!address) {
      setMessage("Please connect your wallet first")
      return
    }

    if (!registrationForm.code || !registrationForm.name) {
      setMessage("Please fill in all required fields")
      return
    }

    setIsRegistering(true)
    setMessage("")

    try {
      const response = await fetch("/api/builder-codes/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...registrationForm,
          ownerAddress: address,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage("Builder code registered successfully! Pending verification.")
        setRegistrationForm({ code: "", name: "", description: "", websiteUrl: "" })
        setTimeout(() => fetchLeaderboard(), 1000)
      } else {
        setMessage(data.error || "Registration failed")
      }
    } catch (error) {
      setMessage("Failed to register builder code")
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-full px-4 py-2 mb-6">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">ERC-8021 Builder Codes</span>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Build on MYUSIC, Earn Revenue
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Register your app's builder code and earn a share of the streaming revenue you generate. 
          Build music players, discovery tools, AI agents, and more on top of our platform.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <Card className="bg-card/50 border-purple-500/20">
            <CardContent className="pt-6 text-center">
              <Code2 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold mb-1">Embed Your Code</div>
              <p className="text-sm text-muted-foreground">Add your builder code to streaming transactions</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-pink-500/20">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold mb-1">Generate Volume</div>
              <p className="text-sm text-muted-foreground">Drive streams through your app</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50 border-blue-500/20">
            <CardContent className="pt-6 text-center">
              <DollarSign className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold mb-1">Earn 10%</div>
              <p className="text-sm text-muted-foreground">Automatic revenue split from platform fees</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Register Section */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Register Your Builder Code</CardTitle>
          <CardDescription>
            Create a unique code for your app to start earning from the activity you generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Builder Code *</label>
              <Input
                placeholder="my-music-app"
                value={registrationForm.code}
                onChange={(e) => setRegistrationForm({ ...registrationForm, code: e.target.value.toLowerCase() })}
              />
              <p className="text-xs text-muted-foreground mt-1">Lowercase letters, numbers, hyphens, and underscores only</p>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">App Name *</label>
              <Input
                placeholder="My Music App"
                value={registrationForm.name}
                onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Describe what your app does..."
                value={registrationForm.description}
                onChange={(e) => setRegistrationForm({ ...registrationForm, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Website URL</label>
              <Input
                type="url"
                placeholder="https://myapp.com"
                value={registrationForm.websiteUrl}
                onChange={(e) => setRegistrationForm({ ...registrationForm, websiteUrl: e.target.value })}
              />
            </div>
          </div>

          {message && (
            <div className={`mt-4 p-3 rounded-lg ${message.includes("success") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
              {message}
            </div>
          )}

          <Button
            onClick={handleRegister}
            disabled={isRegistering || !address}
            className="mt-4 w-full"
          >
            {isRegistering ? "Registering..." : address ? "Register Builder Code" : "Connect Wallet to Register"}
          </Button>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Builder Leaderboard (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Top builders earning revenue from the MYUSIC ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No builders registered yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((builder, index) => (
                <div
                  key={builder.code}
                  className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-2xl font-bold ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                      #{index + 1}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{builder.name}</span>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{builder.code}</code>
                        {builder.verified && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                      </div>
                      {builder.website_url && (
                        <a
                          href={builder.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          {builder.website_url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold text-green-400">
                      ${builder.timeframeStats?.earnings?.toFixed(2) || builder.total_earnings?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {builder.timeframeStats?.transactions || builder.total_transactions || 0} transactions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Integrate</CardTitle>
          <CardDescription>
            Add your builder code to MYUSIC API calls to start earning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Register your builder code above</h4>
              <p className="text-sm text-muted-foreground">Choose a unique code and provide your payout wallet address</p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. Add builder code to streaming requests</h4>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
{`// When requesting a chunk:
const payment = await requestChunk(trackId, chunkIndex, "your-code-here");

// The builder code is automatically included in the transaction`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">3. Earn automatically</h4>
              <p className="text-sm text-muted-foreground">You'll receive 10% of platform fees for all transactions with your builder code</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
