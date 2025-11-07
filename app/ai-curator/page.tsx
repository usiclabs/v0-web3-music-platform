"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Sparkles, Star, Music, Loader2, CheckCircle2, TrendingUp } from "lucide-react"
import Link from "next/link"

const AI_CURATOR_ADDRESS = "0xAI000000000000000000000000000000CURATOR1"

const SUGGESTED_THEMES = [
  { label: "Latest Releases", icon: TrendingUp, theme: "new and trending" },
  { label: "Chill Vibes", icon: Music, theme: "chill and relaxing" },
  { label: "Workout Energy", icon: Sparkles, theme: "energy and workout" },
  { label: "AI Generated", icon: Star, theme: "ai generated music" },
]

export default function AICuratorPage() {
  const { address } = useAccount()
  const router = useRouter()
  const { toast } = useToast()

  const [theme, setTheme] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlaylist, setGeneratedPlaylist] = useState<any>(null)
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" })
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)

  async function generatePlaylist(selectedTheme?: string) {
    const themeToUse = selectedTheme || theme

    if (!themeToUse.trim()) {
      toast({
        title: "Theme required",
        description: "Please enter a theme or select a suggested one",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    setGeneratedPlaylist(null)

    try {
      const response = await fetch("/api/agents/create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: themeToUse, userId: address }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate playlist")
      }

      setGeneratedPlaylist(data.playlist)
      setFeedback({ rating: 0, comment: "" })

      toast({
        title: "Playlist generated!",
        description: `Created "${data.playlist.name}" with ${data.playlist.track_count} tracks`,
      })
    } catch (error) {
      console.error("Error generating playlist:", error)
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate playlist",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function submitFeedback() {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Connect your wallet to submit feedback",
        variant: "destructive",
      })
      return
    }

    if (feedback.rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingFeedback(true)

    try {
      const response = await fetch("/api/agents/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentAddress: AI_CURATOR_ADDRESS,
          rating: feedback.rating,
          comment: feedback.comment,
          userAddress: address,
          playlistId: generatedPlaylist.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit feedback")
      }

      toast({
        title: "Feedback submitted",
        description: "Thank you for helping improve the AI curator!",
      })

      setFeedback({ rating: 0, comment: "" })
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit feedback",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-violet-950/10">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-medium text-violet-400">Powered by ERC-8004 Trustless Agents</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
            AI Playlist Curator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An autonomous AI agent with verified on-chain identity that creates personalized playlists based on your
            mood and preferences
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="p-6 backdrop-blur-sm bg-card/50 border-violet-500/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Music className="w-6 h-6 text-violet-400" />
              Generate Playlist
            </h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="theme" className="mb-2">
                  Playlist Theme
                </Label>
                <Input
                  id="theme"
                  placeholder="e.g., chill vibes, workout energy, study focus..."
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generatePlaylist()}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label>Suggested Themes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED_THEMES.map((suggested) => (
                    <Button
                      key={suggested.theme}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTheme(suggested.theme)
                        generatePlaylist(suggested.theme)
                      }}
                      disabled={isGenerating}
                      className="justify-start gap-2 h-auto py-3"
                    >
                      <suggested.icon className="w-4 h-4" />
                      <span className="text-xs">{suggested.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={() => generatePlaylist()} disabled={isGenerating} className="w-full" size="lg">
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Playlist
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6 backdrop-blur-sm bg-card/50 border-violet-500/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              Agent Info
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Music Curator Agent</h3>
                  <p className="text-sm text-muted-foreground">Autonomous AI-powered playlist generator</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">ERC-8004 Identity</span>
                  <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/20">
                    Verified
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Validation</span>
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    Trusted
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  This agent operates with a verified on-chain identity using the ERC-8004 standard, ensuring
                  transparency and accountability in all actions.
                </p>
              </div>

              <Link href="/agents">
                <Button variant="outline" className="w-full bg-transparent" size="sm">
                  View All Agents
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {generatedPlaylist && (
          <Card className="mt-8 p-6 backdrop-blur-sm bg-card/50 border-violet-500/20 animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{generatedPlaylist.name}</h2>
                <p className="text-muted-foreground">{generatedPlaylist.description}</p>
                <p className="text-sm text-muted-foreground mt-2">{generatedPlaylist.track_count} tracks</p>
              </div>
              <Link href={`/playlist/${generatedPlaylist.id}`}>
                <Button>View Playlist</Button>
              </Link>
            </div>

            <div className="space-y-4 pt-6 border-t border-border/50">
              <h3 className="font-semibold">Rate this playlist</h3>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setFeedback({ ...feedback, rating: star })}
                    disabled={isSubmittingFeedback}
                    className="transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= feedback.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div>
                <Label htmlFor="feedback-comment">Additional Feedback (optional)</Label>
                <Textarea
                  id="feedback-comment"
                  placeholder="What did you think about this playlist?"
                  value={feedback.comment}
                  onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                  disabled={isSubmittingFeedback}
                  rows={3}
                />
              </div>

              <Button onClick={submitFeedback} disabled={isSubmittingFeedback || feedback.rating === 0}>
                {isSubmittingFeedback ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
