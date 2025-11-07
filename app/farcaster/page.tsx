"use client"

import { useFarcaster } from "@/lib/farcaster-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Zap, Music, Coins, Share2, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function FarcasterPage() {
  const { isFarcaster, user, isReady } = useFarcaster()

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-32">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">Farcaster Mini App</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
          Welcome to MyUSIC on Farcaster
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience blockchain-powered music streaming directly within Farcaster. Stream, earn, and support artists
          seamlessly.
        </p>
      </div>

      {/* Status Card */}
      {isFarcaster ? (
        <Card className="mb-8 border-purple-500/30 bg-purple-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Connected to Farcaster
            </CardTitle>
            <CardDescription>You're viewing MyUSIC as a Farcaster Mini App</CardDescription>
          </CardHeader>
          {user && (
            <CardContent>
              <div className="flex items-center gap-4">
                {user.pfp && (
                  <img
                    src={user.pfp || "/placeholder.svg"}
                    alt={user.displayName || "User"}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="font-semibold">{user.displayName || user.username}</p>
                  <p className="text-sm text-muted-foreground">FID: {user.fid}</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ) : (
        <Card className="mb-8 border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              Not in Farcaster
            </CardTitle>
            <CardDescription>
              You're viewing MyUSIC in a regular browser. Open this in Farcaster for the full Mini App experience.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <Music className="w-8 h-8 mb-2 text-blue-400" />
            <CardTitle>Stream Music</CardTitle>
            <CardDescription>Access thousands of tracks with micropayment-enabled streaming</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Coins className="w-8 h-8 mb-2 text-yellow-400" />
            <CardTitle>Earn $USI Tokens</CardTitle>
            <CardDescription>Earn rewards for listening and engaging with the platform</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Zap className="w-8 h-8 mb-2 text-purple-400" />
            <CardTitle>X402 Micropayments</CardTitle>
            <CardDescription>Pay-per-stream with fractions of a cent per second</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Share2 className="w-8 h-8 mb-2 text-green-400" />
            <CardTitle>Social Features</CardTitle>
            <CardDescription>Share tracks, follow artists, and discover new music</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Link href="/discover">
            <Music className="w-5 h-5 mr-2" />
            Discover Music
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/trending">
            <Zap className="w-5 h-5 mr-2" />
            Trending Now
          </Link>
        </Button>
      </div>

      {/* Integration Info */}
      <Card className="mt-12 border-muted">
        <CardHeader>
          <CardTitle>About Farcaster Integration</CardTitle>
          <CardDescription>MyUSIC is built as a Farcaster Mini App</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Features Available:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Seamless authentication with your Farcaster account</li>
              <li>Native wallet integration for on-chain transactions</li>
              <li>Share tracks and playlists directly to Farcaster feeds</li>
              <li>Discover music from your Farcaster network</li>
              <li>Earn and tip with $USI tokens</li>
            </ul>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Learn more about Farcaster Mini Apps at{" "}
              <a
                href="https://miniapps.farcaster.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline"
              >
                miniapps.farcaster.xyz
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
