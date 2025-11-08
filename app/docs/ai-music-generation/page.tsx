import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Music, Sparkles, Wand2, Video, CreditCard, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function AIMusicGenerationPage() {
  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-4xl">
        <Link href="/docs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>

        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-12 w-12 text-purple-500" />
            <h1 className="text-5xl md:text-6xl font-bold">AI Music Generation</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Create professional-quality music from text prompts using Suno AI integration.
          </p>
        </div>

        <div className="space-y-12">
          {/* Overview */}
          <section className="animate-slide-up">
            <h2 className="text-3xl font-bold mb-4">Overview</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <p className="text-muted-foreground mb-4">
                USIC integrates with Suno AI to enable text-to-music generation directly within the platform. Artists
                can create complete tracks with vocals, instrumentals, and production-quality mixing from simple text
                descriptions.
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-start gap-3">
                  <Music className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Text-to-Music</h4>
                    <p className="text-sm text-muted-foreground">Generate complete tracks from text prompts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wand2 className="h-6 w-6 text-accent mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">AI Lyrics</h4>
                    <p className="text-sm text-muted-foreground">Auto-generate lyrics or provide your own</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Video className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Music Videos</h4>
                    <p className="text-sm text-muted-foreground">Generate visualizers for your tracks</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* How It Works */}
          <section className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <div className="space-y-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Describe Your Track</h3>
                    <p className="text-muted-foreground mb-3">
                      Write a prompt describing the style, mood, instruments, and theme of your desired track. Be
                      specific for best results.
                    </p>
                    <div className="bg-muted/10 rounded-lg p-3 text-sm">
                      <span className="text-muted-foreground">Example: </span>
                      "Upbeat electronic dance track with pulsing synths, driving bass, and euphoric melodies"
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Generate Lyrics (Optional)</h3>
                    <p className="text-muted-foreground">
                      Let AI write lyrics based on your theme, or write your own custom lyrics. You can also generate
                      instrumental-only tracks.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI Processing</h3>
                    <p className="text-muted-foreground">
                      Suno AI processes your request and generates 2-3 variations. Generation typically takes 30-60
                      seconds.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Review & Upload</h3>
                    <p className="text-muted-foreground">
                      Listen to the generated tracks, select your favorite, and upload it to USIC with metadata and
                      pricing.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </section>

          {/* Features */}
          <section className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-3xl font-bold mb-4">Features</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Music className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-xl font-semibold mb-2">Multiple Genres</h3>
                <p className="text-muted-foreground">
                  Generate music in any genre: pop, rock, hip-hop, electronic, classical, jazz, and more.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Wand2 className="h-8 w-8 text-accent mb-3" />
                <h3 className="text-xl font-semibold mb-2">Custom Lyrics</h3>
                <p className="text-muted-foreground">
                  AI-generated lyrics or bring your own. Perfect for songwriters who want professional production.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Sparkles className="h-8 w-8 text-purple-500 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Multiple Variations</h3>
                <p className="text-muted-foreground">
                  Each generation creates 2-3 unique variations so you can choose the best one.
                </p>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <Video className="h-8 w-8 text-blue-500 mb-3" />
                <h3 className="text-xl font-semibold mb-2">Video Generation</h3>
                <p className="text-muted-foreground">
                  Create music visualizers and video content for your AI-generated tracks.
                </p>
              </Card>
            </div>
          </section>

          {/* Credits & Pricing */}
          <section className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-3xl font-bold mb-4">Credits & Pricing</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <div className="flex items-start gap-3 mb-4">
                <CreditCard className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">Suno Credits</h3>
                  <p className="text-muted-foreground">
                    AI music generation requires Suno credits. The platform administrator must configure a Suno API key
                    with an active subscription.
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <p className="font-semibold">Standard Generation</p>
                    <p className="text-sm text-muted-foreground">~2 minutes of music</p>
                  </div>
                  <Badge>10 credits</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <p className="font-semibold">Lyrics Generation</p>
                    <p className="text-sm text-muted-foreground">AI-written lyrics</p>
                  </div>
                  <Badge>5 credits</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <p className="font-semibold">Video Generation</p>
                    <p className="text-sm text-muted-foreground">Music visualizer</p>
                  </div>
                  <Badge>15 credits</Badge>
                </div>
              </div>

              <Alert className="mt-6 bg-blue-500/10 border-blue-500/50">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-500">
                  Check your remaining credits in the Create page before generating. Contact your platform admin to add
                  more credits.
                </AlertDescription>
              </Alert>
            </Card>
          </section>

          {/* Best Practices */}
          <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-3xl font-bold mb-4">Best Practices</h2>
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Be Specific</h4>
                    <p className="text-sm text-muted-foreground">
                      Include genre, mood, tempo, instruments, and style. More detail = better results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Iterate</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate multiple variations and refine your prompts based on results.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Use Reference Styles</h4>
                    <p className="text-sm text-muted-foreground">
                      Mention artists or songs for style reference: "synthwave in the style of The Midnight"
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Edit Metadata</h4>
                    <p className="text-sm text-muted-foreground">
                      Always review and edit track title, genre, and description before uploading.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Get Started */}
          <section className="animate-slide-up" style={{ animationDelay: "0.5s" }}>
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-border/50 p-8">
              <h2 className="text-3xl font-bold mb-4">Start Creating</h2>
              <p className="text-muted-foreground mb-6">
                Ready to generate your first AI track? Head to the Create page and start experimenting.
              </p>
              <Link href="/create">
                <Button size="lg">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Music
                </Button>
              </Link>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
