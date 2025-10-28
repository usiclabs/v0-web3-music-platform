import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Radio, Key, Shield, Video, Users, Zap, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LiveStreamingDocsPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Radio className="h-8 w-8 text-red-500" />
            <h1 className="text-4xl font-bold">Live Streaming Guide</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Learn how to broadcast live performances to your fans using Livepeer
          </p>
        </div>

        {/* Quick Start */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Quick Start
          </h2>
          <ol className="space-y-3 text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-bold text-primary">1.</span>
              <span>Have at least 3 published tracks on your profile</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">2.</span>
              <span>
                Go to{" "}
                <Link href="/live/start" className="text-primary hover:underline">
                  /live/start
                </Link>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">3.</span>
              <span>Create your stream with a title and description</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">4.</span>
              <span>Allow camera/microphone permissions when prompted</span>
            </li>
            <li className="flex gap-3">
              <span className="font-bold text-primary">5.</span>
              <span>Click "Go Live" and start streaming!</span>
            </li>
          </ol>
        </Card>

        {/* Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4">
              <Video className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold mb-1">Mobile-Friendly</h3>
              <p className="text-sm text-muted-foreground">
                Stream directly from your phone or tablet with optimized mobile broadcasting
              </p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4">
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <h3 className="font-semibold mb-1">Low Latency</h3>
              <p className="text-sm text-muted-foreground">
                WebRTC-powered streaming for real-time interaction with your audience
              </p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4">
              <Users className="h-8 w-8 text-green-500 mb-2" />
              <h3 className="font-semibold mb-1">Viewer Tracking</h3>
              <p className="text-sm text-muted-foreground">See how many people are watching your stream in real-time</p>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-4">
              <Shield className="h-8 w-8 text-blue-500 mb-2" />
              <h3 className="font-semibold mb-1">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground">Powered by Livepeer's decentralized streaming network</p>
            </Card>
          </div>
        </div>

        {/* Eligibility */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Eligibility Requirements
          </h2>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To ensure quality content, artists must meet the following requirements to go live:
            </AlertDescription>
          </Alert>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Connected wallet with artist profile</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>At least 3 published tracks (active and visible)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Stable internet connection (5+ Mbps upload recommended)</span>
            </li>
          </ul>
        </Card>

        {/* API Keys Setup */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Key className="h-6 w-6 text-yellow-500" />
            API Keys Setup (For Platform Admins)
          </h2>

          <Alert className="mb-4 bg-blue-500/10 border-blue-500/50">
            <Shield className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-500">
              <strong>Important:</strong> Livepeer requires API keys to be configured in your environment variables.
              Contact your platform administrator for setup.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Badge className="mb-2 bg-green-500/20 text-green-500 border-green-500/50">Public Key</Badge>
              <p className="text-sm text-muted-foreground mb-2">Used for client-side playback</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Read-only permissions for viewing streams</li>
                <li>• Safe for client-side usage</li>
                <li>• Required for the video player to work</li>
              </ul>
            </div>

            <div>
              <Badge className="mb-2 bg-red-500/20 text-red-500 border-red-500/50">Private Key</Badge>
              <p className="text-sm text-muted-foreground mb-2">Used for server-side operations</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Full admin permissions for stream management</li>
                <li>• Never exposed to client-side code</li>
                <li>• Only used in secure API routes</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-semibold mb-2">Setup Instructions:</p>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>
                1. Visit{" "}
                <a
                  href="https://livepeer.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  livepeer.studio
                </a>{" "}
                and create an account
              </li>
              <li>2. Generate two separate API keys with different permission levels</li>
              <li>3. Add the keys to your project's environment variables via the Vars section</li>
              <li>4. Refer to LIVEPEER_SETUP.md for detailed configuration steps</li>
            </ol>
          </div>
        </Card>

        {/* Best Practices */}
        <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="space-y-3 text-muted-foreground">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Before Going Live:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Test your camera and microphone</li>
                <li>• Ensure good lighting</li>
                <li>• Check your internet connection speed</li>
                <li>• Prepare your content and talking points</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">During the Stream:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Engage with your viewers</li>
                <li>• Monitor viewer count</li>
                <li>• Keep your content interesting and dynamic</li>
                <li>• Watch for any technical issues</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">After the Stream:</h3>
              <ul className="space-y-1 ml-4">
                <li>• Thank your viewers</li>
                <li>• Announce your next stream</li>
                <li>• Review analytics (coming soon)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild className="bg-red-500 hover:bg-red-600">
            <Link href="/live/start">
              <Radio className="h-5 w-5 mr-2" />
              Start Your First Stream
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
