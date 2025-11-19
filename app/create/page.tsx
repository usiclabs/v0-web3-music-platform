"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Music, Video, Loader2, Play, Pause, Save, Wand2, AlertCircle, ExternalLink, FileText, Settings, Download, RefreshCw, Check, Lock, TrendingUp, Mic2, Radio, Headphones } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWallet } from "@/lib/web3/wallet-context"
import { createBrowserClient } from "@/lib/supabase/client"
import confetti from "canvas-confetti"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { checkTokenGate } from "@/lib/web3/token-gate"
import { LavaLampBackground } from "@/components/lava-lamp-background"
import { AnimatedCounter } from "@/components/animated-counter"
import Link from "next/link"

const GENRES = [
  "Pop",
  "Rock",
  "Hip Hop",
  "R&B",
  "Electronic",
  "Dance",
  "House",
  "Techno",
  "Dubstep",
  "Trap",
  "Jazz",
  "Blues",
  "Classical",
  "Country",
  "Folk",
  "Indie",
  "Alternative",
  "Metal",
  "Punk",
  "Reggae",
  "Latin",
  "Afrobeat",
  "K-Pop",
  "Lo-fi",
  "Ambient",
  "Chillwave",
  "Synthwave",
  "Vaporwave",
]

const MOODS = [
  "Happy",
  "Sad",
  "Energetic",
  "Calm",
  "Romantic",
  "Melancholic",
  "Uplifting",
  "Dark",
  "Dreamy",
  "Aggressive",
  "Peaceful",
  "Mysterious",
  "Nostalgic",
  "Epic",
  "Chill",
]

const INSTRUMENTS = [
  "Piano",
  "Guitar",
  "Drums",
  "Bass",
  "Synth",
  "Strings",
  "Brass",
  "Vocals",
  "Electronic",
  "Acoustic",
  "Orchestra",
]

interface GeneratedTrack {
  taskId: string
  audioId: string
  title: string
  audioUrl: string
  imageUrl: string
  videoUrl?: string
  duration: number
  prompt: string
  style: string
  lyrics?: string
}

type SunoModel = "V3_5" | "V4" | "V4_5" | "V4_5PLUS" | "V5"

// Define interface for platform stats
interface PlatformStats {
  tracksCreated: number
  artists: number
  maxDuration: number
}

export default function CreatePage() {
  const router = useRouter()
  const { address, chainId } = useWallet()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>("")
  const [progressPercent, setProgressPercent] = useState(0)
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null)
  const [credits, setCredits] = useState<number | null>(null)

  // Form state
  const [prompt, setPrompt] = useState("")
  const [title, setTitle] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [selectedMood, setSelectedMood] = useState("")
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [lyrics, setLyrics] = useState("")
  const [instrumental, setInstrumental] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [model, setModel] = useState<SunoModel>("V5")
  const [negativeTags, setNegativeTags] = useState("")
  const [vocalGender, setVocalGender] = useState<"m" | "f" | "any">("any")
  const [styleWeight, setStyleWeight] = useState(0.65)
  const [weirdnessConstraint, setWeirdnessConstraint] = useState(0.65)
  const [audioWeight, setAudioWeight] = useState(0.65)

  // Generated tracks
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([])
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    tracksCreated: 0,
    artists: 0,
    maxDuration: 8,
  })

  const selectedTrack = generatedTracks[selectedTrackIndex]

  useEffect(() => {
    const checkAccess = async () => {
      if (!address || !chainId) {
        setHasAccess(false)
        setIsCheckingAccess(false)
        return
      }

      try {
        const access = await checkTokenGate(address, chainId)
        setHasAccess(access)
      } catch (error) {
        console.error("[v0] Error checking token gate:", error)
        setHasAccess(false)
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkAccess()
  }, [address, chainId])

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const response = await fetch("/api/suno/check-key")
        const data = await response.json()
        setApiKeyConfigured(data.configured)
      } catch (err) {
        console.error("Failed to check API key:", err)
        setApiKeyConfigured(false)
      }
    }

    const fetchCredits = async () => {
      try {
        const response = await fetch("/api/suno/credits")
        const data = await response.json()
        if (data.credits !== undefined) {
          setCredits(data.credits)
        }
      } catch (err) {
        console.error("Failed to fetch credits:", err)
      }
    }

    checkApiKey()
    fetchCredits()
  }, [])

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const response = await fetch('/api/platform/stats')
        const data = await response.json()
        setPlatformStats(data)
      } catch (error) {
        console.error('[v0] Error fetching platform stats:', error)
      }
    }

    fetchPlatformStats()
  }, [])

  const buildStyleString = () => {
    const parts = []
    if (selectedGenre) parts.push(selectedGenre)
    if (selectedMood) parts.push(selectedMood)
    if (selectedInstruments.length > 0) parts.push(selectedInstruments.join(", "))
    return parts.join(", ")
  }

  const handleGenerateLyrics = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for your lyrics")
      return
    }

    setIsGeneratingLyrics(true)
    setError(null)
    setProgress("Generating lyrics...")

    try {
      const response = await fetch("/api/suno/generate-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style: buildStyleString() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate lyrics")
      }

      const { taskId } = await response.json()

      let attempts = 0
      const maxAttempts = 30
      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error("Lyrics generation timed out")
        }

        try {
          const statusResponse = await fetch(`/api/suno/lyrics-status?taskId=${taskId}`)
          const statusData = await statusResponse.json()

          if (statusData.status === "complete" && statusData.lyrics) {
            clearInterval(pollInterval)
            setLyrics(statusData.lyrics)
            setProgress("Lyrics generated successfully!")
            setIsGeneratingLyrics(false)
            setTimeout(() => setProgress(""), 2000)
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval)
            throw new Error(statusData.error || "Lyrics generation failed")
          }
        } catch (err) {
          clearInterval(pollInterval)
          throw err
        }
      }, 3000)
    } catch (err) {
      console.error("Lyrics generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate lyrics")
      setIsGeneratingLyrics(false)
      setProgress("")
    }
  }

  const handleGenerate = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    if (!prompt.trim() && !lyrics.trim()) {
      setError("Please enter a description or lyrics for your music")
      return
    }

    setIsGenerating(true)
    setError(null)
    setProgress("Generating your music with AI...")
    setProgressPercent(0)

    try {
      const styleString = buildStyleString()
      const requestBody: any = {
        prompt: lyrics.trim() || prompt,
        title: title || undefined,
        style: styleString || undefined,
        instrumental,
        model,
      }

      if (customMode) {
        requestBody.customMode = true
        requestBody.negativeTags = negativeTags || undefined
        requestBody.vocalGender = vocalGender === "any" ? undefined : vocalGender
        requestBody.styleWeight = styleWeight
        requestBody.weirdnessConstraint = weirdnessConstraint
        requestBody.audioWeight = audioWeight
      }

      console.log("[v0] Generating music with params:", requestBody)

      const response = await fetch("/api/suno/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate music")
      }

      const { taskId } = await response.json()
      console.log("[v0] Generation started, task ID:", taskId)
      setProgress("AI is composing your track... This may take 1-2 minutes")
      setProgressPercent(20)

      let attempts = 0
      const maxAttempts = 60
      const pollInterval = setInterval(async () => {
        attempts++
        setProgressPercent(Math.min(20 + (attempts / maxAttempts) * 70, 90))

        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          setIsGenerating(false)
          setProgress("")
          setProgressPercent(0)
          setError("Generation timed out after 5 minutes. Please try again with a simpler prompt.")
          return
        }

        try {
          const statusResponse = await fetch(`/api/suno/status?taskId=${taskId}`)

          if (!statusResponse.ok) {
            throw new Error("Failed to check generation status")
          }

          const statusData = await statusResponse.json()
          console.log("[v0] Status check:", statusData)

          if (statusData.status === "complete" && statusData.tracks) {
            clearInterval(pollInterval)
            setGeneratedTracks(statusData.tracks)
            setSelectedTrackIndex(0)
            setProgress("Music generated successfully!")
            setProgressPercent(100)
            setIsGenerating(false)

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
            })

            setTimeout(() => {
              setProgress("")
              setProgressPercent(0)
            }, 2000)
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval)
            setIsGenerating(false)
            setProgress("")
            setProgressPercent(0)
            setError(statusData.error || "Generation failed. Please try again.")
          }
        } catch (err) {
          clearInterval(pollInterval)
          setIsGenerating(false)
          setProgress("")
          setProgressPercent(0)
          setError(err instanceof Error ? err.message : "An unexpected error occurred")
        }
      }, 5000)
    } catch (err) {
      console.error("Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate music")
      setIsGenerating(false)
      setProgress("")
      setProgressPercent(0)
    }
  }

  const handleGenerateVideo = async () => {
    if (!selectedTrack) return

    setIsGeneratingVideo(true)
    setError(null)
    setProgress("Creating music video...")

    try {
      const response = await fetch("/api/suno/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTrack.taskId,
          audioId: selectedTrack.audioId,
          author: address,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate video")
      }

      const { taskId } = await response.json()
      setProgress("AI is creating your music video... This may take 2-3 minutes")

      let attempts = 0
      const maxAttempts = 60
      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error("Video generation timed out. Please try again.")
        }

        try {
          const statusResponse = await fetch(`/api/suno/video-status?taskId=${taskId}`)
          const statusData = await statusResponse.json()

          if (statusData.status === "complete" && statusData.videoUrl) {
            clearInterval(pollInterval)
            const updatedTracks = [...generatedTracks]
            updatedTracks[selectedTrackIndex] = { ...selectedTrack, videoUrl: statusData.videoUrl }
            setGeneratedTracks(updatedTracks)
            setProgress("Music video created successfully!")
            setIsGeneratingVideo(false)

            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
            })

            setTimeout(() => setProgress(""), 2000)
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval)
            throw new Error(statusData.error || "Video generation failed")
          }
        } catch (err) {
          clearInterval(pollInterval)
          throw err
        }
      }, 5000)
    } catch (err) {
      console.error("Video generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate video")
      setIsGeneratingVideo(false)
      setProgress("")
    }
  }

  const togglePlayPause = () => {
    if (!selectedTrack) return

    if (!audio) {
      const newAudio = new Audio(selectedTrack.audioUrl)
      newAudio.addEventListener("ended", () => setIsPlaying(false))
      newAudio.play()
      setAudio(newAudio)
      setIsPlaying(true)
    } else {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSaveToLibrary = async () => {
    if (!selectedTrack || !address) return

    setIsSaving(true)
    setError(null)
    setProgress("Saving to your library...")

    try {
      const supabase = createBrowserClient()

      const { data: track, error: createError } = await supabase
        .from("tracks")
        .insert({
          title: selectedTrack.title,
          artist_id: address.toLowerCase(),
          content_type: selectedTrack.videoUrl ? "video" : "audio",
          audio_url: selectedTrack.audioUrl,
          video_url: selectedTrack.videoUrl || null,
          cover_url: selectedTrack.imageUrl,
          duration: selectedTrack.duration,
          price_per_chunk: 0.005,
          unlock_type: "per_chunk",
          is_active: true,
          ai_generated: true,
          ai_prompt: selectedTrack.prompt,
          ai_style: selectedTrack.style,
        })
        .select()
        .single()

      if (createError) throw createError

      setProgress("Saved successfully!")

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#E53E3E", "#DC2626", "#F87171", "#FCA5A5"],
      })

      setTimeout(() => {
        router.push("/profile")
      }, 1500)
    } catch (err) {
      console.error("Save error:", err)
      setError(err instanceof Error ? err.message : "Failed to save track")
      setIsSaving(false)
      setProgress("")
    }
  }

  const handleReset = () => {
    setGeneratedTracks([])
    setSelectedTrackIndex(0)
    setIsPlaying(false)
    if (audio) {
      audio.pause()
      setAudio(null)
    }
    setError(null)
    setProgress("")
  }

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-muted-foreground">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!address) {
    return (
      <div className="relative min-h-screen bg-black overflow-hidden">
        {/* Animated Background */}
        <LavaLampBackground 
          count={6}
          duration={25}
          intensity={120}
          colors={[
            "rgba(229, 62, 62, 0.35)",
            "rgba(220, 38, 38, 0.3)",
            "rgba(239, 68, 68, 0.25)",
            "rgba(185, 28, 28, 0.3)",
          ]}
        />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000,transparent)] pointer-events-none" />

        {/* Mouse tracking gradient */}
        <div className="absolute inset-0 opacity-30 transition-all duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(229, 62, 62, 0.2), transparent 50%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-5xl mx-auto text-center space-y-12">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-card/30 backdrop-blur-2xl border border-accent/30 rounded-full px-6 py-3 text-sm shadow-2xl shadow-accent/10 animate-in fade-in slide-in-from-top-4 duration-700 hover:shadow-accent/30 hover:scale-105 hover:border-accent/50 transition-all">
              <Sparkles className="h-4 w-4 text-accent animate-pulse" />
              <span className="font-medium bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Powered by Suno AI v5 • Up to 8 Minutes • Commercial Rights
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance">
              Create music{" "}
              <span className="bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(229,62,62,0.3)]">
                with AI
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-3xl text-foreground/80 mb-6 text-pretty leading-relaxed max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium">
              From idea to release-ready track in minutes. No instruments required.
            </p>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              {[
                { icon: Wand2, title: "AI Generation", desc: "Describe your vision, get studio-quality music" },
                { icon: Video, title: "Music Videos", desc: "Auto-generate professional music videos" },
                { icon: Music, title: "Full Rights", desc: "Keep 100% ownership and commercial rights" },
              ].map((feature, i) => (
                <Card key={i} className="bg-card/20 backdrop-blur-xl border border-border/50 p-6 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <feature.icon className="h-10 w-10 text-accent mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </Card>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <Button
                size="lg"
                onClick={() => router.push("/")}
                className="gap-2 text-lg px-10 py-7 h-auto rounded-full bg-white text-black hover:bg-white/90 transition-all hover:scale-105 shadow-2xl hover:shadow-white/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Mic2 className="h-5 w-5 group-hover:scale-110 transition-transform relative z-10" />
                <span className="relative z-10 font-bold">Connect Wallet to Create</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="gap-2 text-lg px-10 py-7 h-auto rounded-full bg-card/20 hover:bg-card/40 backdrop-blur-2xl border-2 border-border hover:scale-105 hover:border-accent/50 transition-all duration-300 group relative overflow-hidden"
              >
                <Link href="/explore">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Headphones className="h-5 w-5 group-hover:rotate-12 transition-transform relative z-10" />
                  <span className="relative z-10 font-bold">Explore AI Music</span>
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
              {[
                { value: platformStats.tracksCreated, label: "Tracks Created", icon: Music },
                { value: platformStats.artists, label: "Artists", icon: Sparkles },
                { value: platformStats.maxDuration, label: "Min Duration", icon: Radio },
              ].map((stat, i) => (
                <div key={i} className="text-center group cursor-default bg-card/20 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300">
                  <stat.icon className="h-6 w-6 text-accent mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-4xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">
                    <AnimatedCounter value={stat.value} duration={2000} />
                    {stat.label === "Min Duration" && ""}
                  </div>
                  <div className="text-sm text-foreground/60 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer group">
          <div className="w-6 h-10 rounded-full border-2 border-foreground/20 flex items-start justify-center p-2 group-hover:border-accent/50 transition-colors">
            <div className="w-1 h-2 bg-accent/60 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (hasAccess === false) {
    return (
      <div className="relative min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden">
        <LavaLampBackground count={4} duration={20} intensity={100} />
        
        <Card className="max-w-md w-full bg-card/50 backdrop-blur-2xl border border-border/50 p-8 text-center animate-in slide-in-from-bottom-4 duration-700 relative z-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 mb-6 animate-pulse-slow">
            <Lock className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">Premium Feature</h2>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            AI music creation requires holding at least
          </p>
          <p className="text-2xl font-bold text-accent mb-6">
            5,000,000,000 $USI
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            in your connected wallet to access this studio
          </p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full hover:scale-105 transition-all shadow-lg hover:shadow-xl">
              <a href="/swap" className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Get $USI Tokens
              </a>
            </Button>
            <Button variant="outline" onClick={() => router.push("/")} size="lg" className="w-full bg-transparent hover:scale-105 transition-all">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Subtle background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI Studio • Suno v5</span>
            {credits !== null && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm font-medium text-muted-foreground">{credits} credits</span>
              </>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
            Create Music with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Describe your vision and let AI compose original music and videos
          </p>
        </div>

        {/* API Key Warning */}
        {apiKeyConfigured === false && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10 animate-in slide-in-from-bottom-4 duration-700">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Suno API Key Required</AlertTitle>
            <AlertDescription className="text-amber-500/90 space-y-2">
              <p>To use AI music generation, you need to configure your Suno API key.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 text-amber-500"
                  asChild
                >
                  <a href="https://sunoapi.org" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Get API Key
                  </a>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {generatedTracks.length === 0 ? (
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-8 animate-in slide-in-from-bottom-4 duration-700 delay-100">
            <Tabs defaultValue="simple" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="simple">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Simple
                </TabsTrigger>
                <TabsTrigger value="lyrics">
                  <FileText className="h-4 w-4 mr-2" />
                  With Lyrics
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Simple Mode */}
              <TabsContent value="simple" className="space-y-6">
                <div>
                  <Label htmlFor="prompt" className="text-lg font-semibold mb-2 block">
                    Describe Your Music
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A calm and relaxing piano track with soft melodies, perfect for meditation and focus"
                    rows={4}
                    className="bg-card/50 backdrop-blur-xl border border-border/50 resize-none"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Be specific about genre, mood, instruments, and style
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="genre">Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mood">Mood</Label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="instruments">Primary Instrument</Label>
                    <Select
                      value={selectedInstruments[0] || ""}
                      onValueChange={(value) => setSelectedInstruments([value])}
                    >
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select instrument" />
                      </SelectTrigger>
                      <SelectContent>
                        {INSTRUMENTS.map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Track Title (Optional)</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Peaceful Piano Meditation"
                      className="bg-card/50 backdrop-blur-xl border border-border/50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div>
                      <Label htmlFor="instrumental" className="font-semibold">
                        Instrumental Only
                      </Label>
                      <p className="text-xs text-muted-foreground">No vocals</p>
                    </div>
                    <Switch id="instrumental" checked={instrumental} onCheckedChange={setInstrumental} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div>
                    <Label className="font-semibold">AI Model</Label>
                    <p className="text-sm text-muted-foreground">Choose the generation model</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Button
                      type="button"
                      variant={model === "V3_5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModel("V3_5")}
                      className={model === "V3_5" ? "" : "bg-transparent"}
                    >
                      V3.5
                    </Button>
                    <Button
                      type="button"
                      variant={model === "V4" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModel("V4")}
                      className={model === "V4" ? "" : "bg-transparent"}
                    >
                      V4
                    </Button>
                    <Button
                      type="button"
                      variant={model === "V4_5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModel("V4_5")}
                      className={model === "V4_5" ? "" : "bg-transparent"}
                      title="Smart Prompts - Excellent prompt understanding with faster generation speeds"
                    >
                      V4.5
                    </Button>
                    <Button
                      type="button"
                      variant={model === "V4_5PLUS" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModel("V4_5PLUS")}
                      className={model === "V4_5PLUS" ? "" : "bg-transparent"}
                      title="Richer Tones - Enhanced tonal variation and creative approaches"
                    >
                      V4.5+
                    </Button>
                    <Button
                      type="button"
                      variant={model === "V5" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setModel("V5")}
                      className={model === "V5" ? "" : "bg-transparent"}
                      title="Latest Model - Cutting-edge model with enhanced quality"
                    >
                      V5 ✨
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {model === "V3_5" && "Standard model for basic music generation"}
                    {model === "V4" && "Advanced model for complex music requests"}
                    {model === "V4_5" && "Smart Prompts - Excellent prompt understanding with faster generation speeds, up to 8 minutes"}
                    {model === "V4_5PLUS" && "Richer Tones - Most advanced model with enhanced tonal variation, up to 8 minutes. Best for highest quality"}
                    {model === "V5" && "Latest Model - Cutting-edge model with enhanced quality and capabilities"}
                  </div>
                </div>
              </TabsContent>

              {/* Lyrics Mode */}
              <TabsContent value="lyrics" className="space-y-6">
                <div>
                  <Label htmlFor="lyrics-prompt" className="text-lg font-semibold mb-2 block">
                    Describe Your Lyrics Theme
                  </Label>
                  <Textarea
                    id="lyrics-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A love song about missing someone, with emotional and heartfelt lyrics"
                    rows={3}
                    className="bg-card/50 backdrop-blur-xl border border-border/50 resize-none"
                  />
                  <Button
                    onClick={handleGenerateLyrics}
                    disabled={isGeneratingLyrics || !prompt.trim()}
                    variant="outline"
                    size="sm"
                    className="mt-2 bg-transparent"
                  >
                    {isGeneratingLyrics ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Lyrics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Lyrics
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <Label htmlFor="lyrics" className="text-lg font-semibold mb-2 block">
                    Lyrics
                  </Label>
                  <Textarea
                    id="lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Enter your lyrics here or generate them with AI..."
                    rows={8}
                    className="bg-card/50 backdrop-blur-xl border border-border/50 resize-none font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground mt-2">Write your own lyrics or use AI to generate them</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lyrics-genre">Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="lyrics-mood">Mood</Label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="lyrics-title">Track Title</Label>
                  <Input
                    id="lyrics-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Missing You"
                    className="bg-card/50 backdrop-blur-xl border border-border/50"
                  />
                </div>
              </TabsContent>

              {/* Advanced Mode */}
              <TabsContent value="advanced" className="space-y-6">
                <div>
                  <Label htmlFor="adv-prompt" className="text-lg font-semibold mb-2 block">
                    Describe Your Music
                  </Label>
                  <Textarea
                    id="adv-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A calm and relaxing piano track with soft melodies"
                    rows={4}
                    className="bg-card/50 backdrop-blur-xl border border-border/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div>
                    <Label htmlFor="custom-mode" className="font-semibold">
                      Custom Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">Enable advanced parameters</p>
                  </div>
                  <Switch id="custom-mode" checked={customMode} onCheckedChange={setCustomMode} />
                </div>

                {customMode && (
                  <div className="space-y-6 p-4 bg-muted/20 rounded-lg border border-border/50 animate-in slide-in-from-top-4 duration-300">
                    <div>
                      <Label htmlFor="negative-tags">Negative Tags</Label>
                      <Input
                        id="negative-tags"
                        value={negativeTags}
                        onChange={(e) => setNegativeTags(e.target.value)}
                        placeholder="e.g., Heavy Metal, Upbeat Drums"
                        className="bg-card/50 backdrop-blur-xl border border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Styles to avoid</p>
                    </div>

                    <div>
                      <Label htmlFor="vocal-gender">Vocal Gender</Label>
                      <Select value={vocalGender} onValueChange={(value: any) => setVocalGender(value)}>
                        <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="m">Male</SelectItem>
                          <SelectItem value="f">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Style Weight: {styleWeight.toFixed(2)}</Label>
                      <Slider
                        value={[styleWeight]}
                        onValueChange={(value) => setStyleWeight(value[0])}
                        min={0}
                        max={1}
                        step={0.05}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">How closely to follow the style</p>
                    </div>

                    <div>
                      <Label>Weirdness: {weirdnessConstraint.toFixed(2)}</Label>
                      <Slider
                        value={[weirdnessConstraint]}
                        onValueChange={(value) => setWeirdnessConstraint(value[0])}
                        min={0}
                        max={1}
                        step={0.05}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">How experimental the output should be</p>
                    </div>

                    <div>
                      <Label>Audio Weight: {audioWeight.toFixed(2)}</Label>
                      <Slider
                        value={[audioWeight]}
                        onValueChange={(value) => setAudioWeight(value[0])}
                        min={0}
                        max={1}
                        step={0.05}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Balance between audio quality and creativity</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="adv-genre">Genre</Label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="adv-mood">Mood</Label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                      <SelectTrigger className="bg-card/50 backdrop-blur-xl border border-border/50">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOODS.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="adv-title">Track Title</Label>
                    <Input
                      id="adv-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Peaceful Piano"
                      className="bg-card/50 backdrop-blur-xl border border-border/50"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 mt-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-destructive">Error</p>
                      <p className="text-sm text-destructive/90 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Display */}
              {progress && (
                <div className="bg-accent/10 border border-accent/50 rounded-lg p-4 mt-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <p className="text-sm text-accent">{progress}</p>
                  </div>
                  {progressPercent > 0 && <Progress value={progressPercent} className="h-2" />}
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!prompt.trim() && !lyrics.trim())}
                className="w-full mt-6"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    Generate Music
                  </>
                )}
              </Button>
            </Tabs>
          </Card>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            {/* Track Selection */}
            {generatedTracks.length > 1 && (
              <div className="flex gap-3 animate-in slide-in-from-top-4 duration-500">
                {generatedTracks.map((track, index) => (
                  <Button
                    key={index}
                    variant={selectedTrackIndex === index ? "default" : "outline"}
                    onClick={() => {
                      setSelectedTrackIndex(index)
                      if (audio) {
                        audio.pause()
                        setAudio(null)
                        setIsPlaying(false)
                      }
                    }}
                    className={`transition-all duration-300 ${selectedTrackIndex === index ? "scale-105" : "bg-transparent hover:scale-105"}`}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Version {index + 1}
                    {selectedTrackIndex === index && <Check className="h-4 w-4 ml-2" />}
                  </Button>
                ))}
              </div>
            )}

            {/* Track Preview */}
            <Card className="bg-card/50 backdrop-blur-xl border border-border/50 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 delay-100">
              <div className="relative aspect-video bg-gradient-to-br from-accent/20 via-accent/10 to-background">
                {selectedTrack.videoUrl ? (
                  <video src={selectedTrack.videoUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={selectedTrack.imageUrl || "/placeholder.svg"}
                      alt={selectedTrack.title}
                      className="w-full h-full object-cover opacity-50"
                    />
                    <Button
                      onClick={togglePlayPause}
                      size="lg"
                      className="absolute rounded-full h-20 w-20 bg-accent/90 hover:bg-accent transition-all duration-300 hover:scale-110"
                    >
                      {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTrack.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedTrack.prompt}</p>
                  {selectedTrack.style && (
                    <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mt-2">
                      <Music className="h-3 w-3 text-accent" />
                      <span className="text-xs font-medium text-accent">{selectedTrack.style}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {!selectedTrack.videoUrl && (
                    <Button
                      onClick={handleGenerateVideo}
                      disabled={isGeneratingVideo}
                      variant="outline"
                      className="bg-transparent transition-all duration-300 hover:scale-105"
                    >
                      {isGeneratingVideo ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Video...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Generate Music Video
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    onClick={handleSaveToLibrary}
                    disabled={isSaving}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save to Library
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedTrack.audioUrl, "_blank")}
                    className="bg-transparent transition-all duration-300 hover:scale-105"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="bg-transparent transition-all duration-300 hover:scale-105"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create Another
                  </Button>
                </div>

                {progress && (
                  <div className="bg-accent/10 border border-accent/50 rounded-lg p-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <p className="text-sm text-accent">{progress}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 animate-in slide-in-from-top-4 duration-300">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
