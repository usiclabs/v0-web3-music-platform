import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Upload, DollarSign, Users, TrendingUp, Music, Coins } from "lucide-react"
import Link from "next/link"

export default function ArtistGuidePage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Artist Guide</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about uploading music, earning revenue, and growing your audience on USIC.
          </p>
        </div>

        <div className="space-y-12">
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Uploading Your Music</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 mb-6">
              <div className="flex items-start gap-4 mb-6">
                <Upload className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Upload Process</h3>
                  <p className="text-muted-foreground">
                    Navigate to the Upload page and follow these steps to publish your music on USIC.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-l-2 border-primary/50 pl-4">
                  <h4 className="font-semibold mb-1">1. Prepare Your Files</h4>
                  <p className="text-sm text-muted-foreground">
                    Audio: MP3, WAV, or FLAC (max 50MB)
                    <br />
                    Cover Art: JPG or PNG (recommended 3000x3000px)
                  </p>
                </div>

                <div className="border-l-2 border-primary/50 pl-4">
                  <h4 className="font-semibold mb-1">2. Add Metadata</h4>
                  <p className="text-sm text-muted-foreground">
                    Fill in track title, artist name, genre, and description. Complete metadata helps listeners discover
                    your music.
                  </p>
                </div>

                <div className="border-l-2 border-primary/50 pl-4">
                  <h4 className="font-semibold mb-1">3. Set Royalty Splits (Optional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Add collaborators and set their revenue share percentages. Payments are automatically split
                    on-chain.
                  </p>
                </div>

                <div className="border-l-2 border-primary/50 pl-4">
                  <h4 className="font-semibold mb-1">4. Publish</h4>
                  <p className="text-sm text-muted-foreground">
                    Confirm the transaction in your wallet. Your music will be uploaded to IPFS and registered on-chain.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-accent/10 backdrop-blur-xl border border-accent/50 p-6">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Music className="h-5 w-5 text-accent" />
                Best Practices
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use high-quality audio files for the best listening experience</li>
                <li>• Create eye-catching cover art that represents your music</li>
                <li>• Write detailed descriptions with relevant keywords</li>
                <li>• Tag your genre accurately to help listeners discover your music</li>
              </ul>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">Earning Revenue</h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <DollarSign className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold mb-2">Stream Payments</h3>
                <p className="text-muted-foreground mb-3">
                  Earn $0.01 USDC per stream, paid instantly to your wallet. No waiting for monthly payouts.
                </p>
                <div className="bg-primary/10 rounded-lg p-3">
                  <p className="text-sm font-mono">
                    1,000 streams = $10 USDC
                    <br />
                    10,000 streams = $100 USDC
                    <br />
                    100,000 streams = $1,000 USDC
                  </p>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Coins className="h-8 w-8 text-accent mb-3" />
                <h3 className="text-xl font-semibold mb-2">Creator Coins</h3>
                <p className="text-muted-foreground mb-3">
                  Launch your own token that fans can collect. Set the supply and price to create scarcity.
                </p>
                <Link href="/docs/smart-contracts">
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Learn More →
                  </Button>
                </Link>
              </Card>
            </div>

            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <h3 className="text-xl font-semibold mb-4">Revenue Dashboard</h3>
              <p className="text-muted-foreground mb-4">
                Track your earnings in real-time on your analytics dashboard. View:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Total streams and revenue
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Revenue per track
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Listener demographics
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Growth trends
                </div>
              </div>
            </Card>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Growing Your Audience</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <Users className="h-8 w-8 text-primary flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Build Your Following</h3>
                    <p className="text-muted-foreground mb-3">
                      Listeners can follow your wallet address to get notified of new releases. Engage with your fans
                      through the platform.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Share your artist profile link on social media</li>
                      <li>• Release music consistently to stay in the trending feed</li>
                      <li>• Collaborate with other artists to cross-promote</li>
                    </ul>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <TrendingUp className="h-8 w-8 text-accent flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Trending Algorithm</h3>
                    <p className="text-muted-foreground mb-3">The trending feed prioritizes tracks based on:</p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Recent stream count (last 24 hours)</li>
                      <li>• Unique listeners</li>
                      <li>• Completion rate (listeners who finish the track)</li>
                      <li>• Recency of upload</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <Card className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Ready to Upload?</h2>
              <p className="text-muted-foreground mb-6">
                Start earning from your music today. Connect your wallet and upload your first track.
              </p>
              <Link href="/upload">
                <Button size="lg">Upload Music</Button>
              </Link>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
