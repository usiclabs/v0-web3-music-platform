"use client"

import type React from "react"

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
import {
  Sparkles,
  Music,
  Video,
  Loader2,
  Play,
  Pause,
  Save,
  Wand2,
  AlertCircle,
  Settings,
  Download,
  RefreshCw,
  Check,
  Lock,
  TrendingUp,
  Mic2,
  Radio,
  Headphones,
  Waves,
  AudioWaveform,
  Upload,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/lib/web3/wallet-context"
import confetti from "canvas-confetti"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { checkTokenGate } from "@/lib/web3/token-gate"
import { LavaLampBackground } from "@/components/lava-lamp-background"
import { AnimatedCounter } from "@/components/animated-counter"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ToolSelector, type MusicTool } from "@/components/create/tool-selector"
import { AudioUpload } from "@/components/create/audio-upload"
import { X402GenerationModal } from "@/components/x402-generation-modal"

function PremiumInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
  type?: string
  icon?: React.ElementType
  hint?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className="relative group">
      <div
        className={cn(
          "relative rounded-xl transition-all duration-500",
          isFocused && "ring-2 ring-accent/50 shadow-[0_0_30px_rgba(229,62,62,0.15)]",
        )}
      >
        {/* Animated border gradient */}
        <div
          className={cn(
            "absolute -inset-[1px] rounded-xl bg-gradient-to-r from-accent/50 via-primary/50 to-accent/50 opacity-0 transition-opacity duration-500 blur-sm",
            isFocused && "opacity-100",
          )}
        />

        <div className="relative">
          {/* Floating label */}
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 transition-all duration-300 pointer-events-none z-10",
              isFocused || hasValue
                ? "top-2 text-xs font-semibold text-accent"
                : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
            )}
          >
            {label}
          </label>

          <div className="relative flex items-center">
            {Icon && (
              <Icon
                className={cn(
                  "absolute left-4 h-5 w-5 transition-colors duration-300",
                  isFocused ? "text-accent" : "text-muted-foreground",
                )}
              />
            )}
            <Input
              id={id}
              type={type}
              value={value}
              onChange={onChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? placeholder : ""}
              className={cn(
                "h-14 bg-card/80 backdrop-blur-xl border-border/50 rounded-xl transition-all duration-300",
                "focus:bg-card focus-visible:ring-0 focus-visible:ring-offset-0",
                Icon ? "pl-12" : "pl-4",
                (isFocused || hasValue) && "pt-5 pb-1",
              )}
            />
          </div>
        </div>
      </div>
      {hint && (
        <p
          className={cn(
            "text-xs text-muted-foreground mt-2 ml-1 transition-all duration-300",
            isFocused && "text-accent/80",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  )
}

function PremiumTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  maxLength,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder: string
  rows?: number
  maxLength?: number
  hint?: string
}) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value.length > 0

  return (
    <div className="relative group">
      <div
        className={cn(
          "relative rounded-xl transition-all duration-500",
          isFocused && "ring-2 ring-accent/50 shadow-[0_0_30px_rgba(229,62,62,0.15)]",
        )}
      >
        {/* Animated border gradient */}
        <div
          className={cn(
            "absolute -inset-[1px] rounded-xl bg-gradient-to-r from-accent/50 via-primary/50 to-accent/50 opacity-0 transition-opacity duration-500 blur-sm",
            isFocused && "opacity-100",
          )}
        />

        <div className="relative">
          {/* Floating label */}
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 transition-all duration-300 pointer-events-none z-10",
              isFocused || hasValue ? "top-3 text-xs font-semibold text-accent" : "top-4 text-sm text-muted-foreground",
            )}
          >
            {label}
          </label>

          <Textarea
            id={id}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFocused ? placeholder : ""}
            rows={rows}
            maxLength={maxLength}
            className={cn(
              "bg-card/80 backdrop-blur-xl border-border/50 rounded-xl resize-none transition-all duration-300",
              "focus:bg-card focus-visible:ring-0 focus-visible:ring-offset-0",
              "pt-8 px-4",
            )}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 px-1">
        {hint && (
          <p className={cn("text-xs text-muted-foreground transition-all duration-300", isFocused && "text-accent/80")}>
            {hint}
          </p>
        )}
        {maxLength && (
          <p
            className={cn(
              "text-xs transition-colors duration-300",
              value.length > maxLength * 0.9 ? "text-amber-500" : "text-muted-foreground",
            )}
          >
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
}

function PremiumSelect({
  id,
  label,
  value,
  onValueChange,
  placeholder,
  options,
  icon: Icon,
}: {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
  placeholder: string
  options: string[]
  icon?: React.ElementType
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative group">
      <Label htmlFor={id} className="text-sm font-medium mb-2 block text-foreground/80">
        {label}
      </Label>
      <div
        className={cn(
          "relative rounded-xl transition-all duration-500",
          isOpen && "ring-2 ring-accent/50 shadow-[0_0_30px_rgba(229,62,62,0.15)]",
        )}
      >
        {/* Animated border gradient */}
        <div
          className={cn(
            "absolute -inset-[1px] rounded-xl bg-gradient-to-r from-accent/50 via-primary/50 to-accent/50 opacity-0 transition-opacity duration-500 blur-sm",
            isOpen && "opacity-100",
          )}
        />

        <Select value={value} onValueChange={onValueChange} onOpenChange={setIsOpen}>
          <SelectTrigger
            id={id}
            className={cn(
              "h-12 bg-card/80 backdrop-blur-xl border-border/50 rounded-xl transition-all duration-300",
              "focus:ring-0 focus:ring-offset-0",
              Icon && "pl-12",
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "absolute left-4 h-5 w-5 transition-colors duration-300",
                  isOpen ? "text-accent" : "text-muted-foreground",
                )}
              />
            )}
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-card/95 backdrop-blur-2xl border-border/50 rounded-xl">
            {options.map((option) => (
              <SelectItem
                key={option}
                value={option}
                className="rounded-lg focus:bg-accent/20 focus:text-accent cursor-pointer transition-colors"
              >
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

function PillSelector({
  label,
  options,
  selected,
  onSelect,
  icon: Icon,
}: {
  label: string
  options: string[]
  selected: string
  onSelect: (value: string) => void
  icon?: React.ElementType
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-accent" />}
        <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.slice(0, 12).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(option === selected ? "" : option)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
              "border hover:scale-105 active:scale-95",
              selected === option
                ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/25"
                : "bg-card/50 border-border/50 hover:border-accent/50 hover:bg-accent/10",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function PremiumSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  hint?: string
}) {
  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground/80">{label}</Label>
        <span className="text-sm font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md">{value.toFixed(2)}</span>
      </div>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <Slider
          value={[value]}
          onValueChange={([v]) => onChange(v)}
          min={min}
          max={max}
          step={step}
          className="relative"
        />
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// The ModelSelector function definition can be removed entirely

function PremiumSwitch({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  icon: Icon,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon?: React.ElementType
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
        checked
          ? "bg-accent/10 border-accent/30 shadow-[0_0_20px_rgba(229,62,62,0.1)]"
          : "bg-card/50 border-border/50 hover:border-accent/20",
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "p-2 rounded-lg transition-colors duration-300",
              checked ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <Label htmlFor={id} className="font-semibold cursor-pointer">
            {label}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-accent" />
    </div>
  )
}

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

type AIModel = "V5"

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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  const [selectedTool, setSelectedTool] = useState<MusicTool>("generate")
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null)
  const [isUploadingAudio, setIsUploadingAudio] = useState(false)
  const [existingAudioId, setExistingAudioId] = useState("")
  const [continueAt, setContinueAt] = useState(60)

  // Form state
  const [prompt, setPrompt] = useState("")
  const [title, setTitle] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("")
  const [selectedMood, setSelectedMood] = useState("")
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([])
  const [lyrics, setLyrics] = useState("")
  const [instrumental, setInstrumental] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const model: AIModel = "V5"
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
        const response = await fetch("/api/platform/stats")
        const data = await response.json()
        setPlatformStats(data)
      } catch (error) {
        console.error("[v0] Error fetching platform stats:", error)
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

  const handlePaymentComplete = () => {
    setPaymentCompleted(true)
    setShowPaymentModal(false)
    // Automatically start generation after payment
    executeGeneration()
  }

  const executeGeneration = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    // Validation based on selected tool
    if (selectedTool === "generate") {
      if (!prompt.trim() && !lyrics.trim()) {
        setError("Please enter a description or lyrics for your music")
        return
      }
    } else if (["upload-cover", "upload-extend", "add-vocals", "add-instrumental"].includes(selectedTool)) {
      if (!uploadedAudioUrl) {
        setError("Please upload an audio file first")
        return
      }
    } else if (["extend", "cover"].includes(selectedTool)) {
      if (!existingAudioId.trim()) {
        setError("Please enter the Audio ID of an existing track")
        return
      }
    }

    setIsGenerating(true)
    setError(null)
    setProgress(`Processing with ${getToolName(selectedTool)}...`)
    setProgressPercent(0)

    try {
      const styleString = buildStyleString()
      let endpoint = "/api/suno/generate"
      let requestBody: any = {}

      // Build request based on selected tool
      switch (selectedTool) {
        case "generate":
          endpoint = "/api/suno/generate"
          requestBody = {
            prompt: lyrics.trim() || prompt,
            title: title || undefined,
            style: styleString || undefined,
            instrumental,
            model,
            customMode,
            negativeTags: customMode ? negativeTags : undefined,
            vocalGender: customMode && vocalGender !== "any" ? vocalGender : undefined,
            styleWeight: customMode ? styleWeight : undefined,
            weirdnessConstraint: customMode ? weirdnessConstraint : undefined,
            audioWeight: customMode ? audioWeight : undefined,
          }
          break

        case "extend":
          endpoint = "/api/suno/extend"
          requestBody = {
            audioId: existingAudioId,
            prompt: prompt || undefined,
            style: styleString || undefined,
            title: title || undefined,
            continueAt,
            model,
            defaultParamFlag: !!prompt,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender !== "any" ? vocalGender : undefined,
            styleWeight,
            weirdnessConstraint,
            audioWeight,
          }
          break

        case "upload-cover":
          endpoint = "/api/suno/upload-cover"
          requestBody = {
            uploadUrl: uploadedAudioUrl,
            prompt: lyrics.trim() || prompt,
            style: styleString || undefined,
            title: title || undefined,
            customMode: true,
            instrumental,
            model,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender !== "any" ? vocalGender : undefined,
            styleWeight,
            weirdnessConstraint,
            audioWeight,
          }
          break

        case "upload-extend":
          endpoint = "/api/suno/upload-extend"
          requestBody = {
            uploadUrl: uploadedAudioUrl,
            prompt: lyrics.trim() || prompt,
            style: styleString || undefined,
            title: title || undefined,
            customMode: true,
            instrumental,
            model,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender !== "any" ? vocalGender : undefined,
            styleWeight,
            weirdnessConstraint,
            audioWeight,
          }
          break

        case "add-vocals":
          endpoint = "/api/suno/add-vocals"
          requestBody = {
            uploadUrl: uploadedAudioUrl,
            prompt: lyrics.trim() || prompt,
            style: styleString || undefined,
            title: title || undefined,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender !== "any" ? vocalGender : undefined,
            styleWeight,
            weirdnessConstraint,
            audioWeight,
            model,
          }
          break

        case "add-instrumental":
          endpoint = "/api/suno/add-instrumental"
          requestBody = {
            uploadUrl: uploadedAudioUrl,
            prompt: prompt || "Create a complementary instrumental",
            style: styleString || "Pop",
            title: title || "Untitled Instrumental",
            negativeTags: negativeTags || "",
            styleWeight,
            weirdnessConstraint,
            audioWeight,
            model,
          }
          break

        case "cover":
          endpoint = "/api/suno/cover"
          requestBody = {
            audioId: existingAudioId,
            prompt: lyrics.trim() || prompt,
            style: styleString || undefined,
            title: title || undefined,
            instrumental,
            model,
            negativeTags: negativeTags || undefined,
            vocalGender: vocalGender !== "any" ? vocalGender : undefined,
            styleWeight,
            weirdnessConstraint,
            audioWeight,
          }
          break
      }

      console.log("[v0] Processing with params:", { endpoint, requestBody })

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process request")
      }

      const { taskId } = await response.json()
      console.log("[v0] Task started, task ID:", taskId)
      setProgress("AI is working on your track... This may take 1-2 minutes")
      setProgressPercent(20)

      // Poll for status - continue with existing polling logic
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
          setError("Processing timed out after 5 minutes. Please try again.")
          setPaymentCompleted(false) // Reset payment state
          return
        }

        try {
          const statusResponse = await fetch(`/api/suno/status?taskId=${taskId}`)

          if (!statusResponse.ok) {
            throw new Error("Failed to check status")
          }

          const statusData = await statusResponse.json()
          console.log("[v0] Status update:", statusData.status)

          if (statusData.status === "complete" && statusData.data) {
            clearInterval(pollInterval)
            setProgressPercent(100)
            setProgress("Track generated successfully!")

            const tracks = Array.isArray(statusData.data) ? statusData.data : [statusData.data]
            const formattedTracks: GeneratedTrack[] = tracks.map((track: any) => ({
              taskId: taskId,
              audioId: track.id || track.audio_id,
              title: track.title || title || "Untitled",
              audioUrl: track.audio_url,
              imageUrl: track.image_url || "/abstract-soundscape.png",
              videoUrl: track.video_url,
              duration: track.duration || 0,
              prompt: track.prompt || prompt,
              style: track.style || buildStyleString(),
              lyrics: track.lyrics,
            }))

            setGeneratedTracks(formattedTracks)
            setSelectedTrackIndex(0)

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            })

            setIsGenerating(false)
            setProgress("")
            setPaymentCompleted(false) // Reset for next generation
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval)
            setIsGenerating(false)
            setProgress("")
            setProgressPercent(0)
            setError(statusData.error || "Generation failed. Please try again.")
            setPaymentCompleted(false) // Reset payment state
          } else if (statusData.status === "running" || statusData.status === "pending") {
            setProgress(statusData.status === "running" ? "AI is composing your track..." : "Waiting in queue...")
          }
        } catch (err) {
          console.error("[v0] Error checking status:", err)
        }
      }, 5000)
    } catch (err) {
      console.error("[v0] Generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate music")
      setIsGenerating(false)
      setProgress("")
      setProgressPercent(0)
      setPaymentCompleted(false) // Reset payment state
    }
  }

  const handleGenerate = async () => {
    if (!address) {
      setError("Please connect your wallet first")
      return
    }

    // Validation based on selected tool
    if (selectedTool === "generate") {
      if (!prompt.trim() && !lyrics.trim()) {
        setError("Please enter a description or lyrics for your music")
        return
      }
    } else if (["upload-cover", "upload-extend", "add-vocals", "add-instrumental"].includes(selectedTool)) {
      if (!uploadedAudioUrl) {
        setError("Please upload an audio file first")
        return
      }
    } else if (["extend", "cover"].includes(selectedTool)) {
      if (!existingAudioId.trim()) {
        setError("Please enter the Audio ID of an existing track")
        return
      }
    }

    // Show payment modal instead of generating directly
    setShowPaymentModal(true)
  }

  const getToolName = (tool: MusicTool) => {
    const names: Record<MusicTool, string> = {
      generate: "Music Generation",
      extend: "Music Extension",
      "upload-cover": "Audio Cover",
      "upload-extend": "Audio Extension",
      "add-vocals": "Vocal Generation",
      "add-instrumental": "Instrumental Generation",
      cover: "Music Cover",
    }
    return names[tool]
  }

  const getToolDescription = (tool: MusicTool) => {
    const descriptions: Record<MusicTool, string> = {
      generate: "Create high-quality music from text descriptions using advanced AI",
      extend: "Extend existing music tracks with AI-powered continuation",
      "upload-cover": "Transform your audio with new styles and arrangements",
      "upload-extend": "Upload your audio files and extend them with AI",
      "add-vocals": "Generate vocal tracks for instrumental music",
      "add-instrumental": "Create instrumental accompaniment for vocal tracks",
      cover: "Reinterpret existing music in different styles",
    }
    return descriptions[tool]
  }

  const requiresUpload = ["upload-cover", "upload-extend", "add-vocals", "add-instrumental"].includes(selectedTool)
  const requiresAudioId = ["extend", "cover"].includes(selectedTool)

  const togglePlayPause = () => {
    if (!audio) {
      const newAudio = new Audio(selectedTrack.audioUrl)
      newAudio.play()
      setAudio(newAudio)
      setIsPlaying(true)
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleGenerateVideo = async () => {
    if (!selectedTrack) return

    setIsGeneratingVideo(true)
    setError(null)
    setProgress("Generating music video...")

    try {
      const response = await fetch("/api/suno/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioId: selectedTrack.audioId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate video")
      }

      const { taskId } = await response.json()

      let attempts = 0
      const maxAttempts = 30
      const pollInterval = setInterval(async () => {
        attempts++
        if (attempts > maxAttempts) {
          clearInterval(pollInterval)
          throw new Error("Video generation timed out")
        }

        try {
          const statusResponse = await fetch(`/api/suno/video-status?taskId=${taskId}`)
          const statusData = await statusResponse.json()

          if (statusData.status === "complete" && statusData.videoUrl) {
            clearInterval(pollInterval)
            setGeneratedTracks(
              generatedTracks.map((track, index) =>
                index === selectedTrackIndex ? { ...track, videoUrl: statusData.videoUrl } : track,
              ),
            )
            setProgress("Video generated successfully!")
            setIsGeneratingVideo(false)
            setTimeout(() => setProgress(""), 2000)
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval)
            throw new Error(statusData.error || "Video generation failed")
          }
        } catch (err) {
          clearInterval(pollInterval)
          throw err
        }
      }, 3000)
    } catch (err) {
      console.error("Video generation error:", err)
      setError(err instanceof Error ? err.message : "Failed to generate video")
      setIsGeneratingVideo(false)
      setProgress("")
    }
  }

  const handleSaveToLibrary = async () => {
    if (!selectedTrack) return

    setIsSaving(true)
    setError(null)
    setProgress("Saving track to library...")

    try {
      const response = await fetch("/api/platform/save-track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTrack.taskId,
          audioId: selectedTrack.audioId,
          title: selectedTrack.title,
          audioUrl: selectedTrack.audioUrl,
          imageUrl: selectedTrack.imageUrl,
          videoUrl: selectedTrack.videoUrl,
          duration: selectedTrack.duration,
          prompt: selectedTrack.prompt,
          style: selectedTrack.style,
          lyrics: selectedTrack.lyrics,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save track")
      }

      setProgress("Track saved successfully!")
      setIsSaving(false)
      setTimeout(() => setProgress(""), 2000)

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#68D391", "#48BB78", "#90EE90", "#A8E6CF"],
      })
    } catch (err) {
      console.error("Save track error:", err)
      setError(err instanceof Error ? err.message : "Failed to save track")
      setIsSaving(false)
      setProgress("")
    }
  }

  const handleListOnPlatform = () => {
    if (!selectedTrack) return

    // Store the generated track data in localStorage for the upload page
    const trackData = {
      audioUrl: selectedTrack.audioUrl,
      title: selectedTrack.title,
      coverUrl: selectedTrack.imageUrl,
      style: selectedTrack.style,
      prompt: selectedTrack.prompt,
      videoUrl: selectedTrack.videoUrl,
      isAiGenerated: true,
    }
    localStorage.setItem("generatedTrackForUpload", JSON.stringify(trackData))

    // Navigate to upload page
    router.push("/dashboard/upload?from=create")
  }

  const handleReset = () => {
    setGeneratedTracks([])
    setSelectedTrackIndex(0)
    setPrompt("")
    setTitle("")
    setSelectedGenre("")
    setSelectedMood("")
    setSelectedInstruments([])
    setLyrics("")
    setInstrumental(false)
    setCustomMode(false)
    setNegativeTags("")
    setVocalGender("any")
    setStyleWeight(0.65)
    setWeirdnessConstraint(0.65)
    setAudioWeight(0.65)
    setUploadedAudioUrl(null)
    setExistingAudioId("")
    setContinueAt(60)
    if (audio) {
      audio.pause()
      setAudio(null)
    }
    setIsPlaying(false)
    setProgress("")
    setError(null)
    setPaymentCompleted(false) // Reset payment state on reset
  }

  // --- Render Logic ---

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
        <div
          className="absolute inset-0 opacity-30 transition-all duration-300 pointer-events-none"
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
                AI Music Studio • Up to 8 Minutes • Commercial Rights
              </span>
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold leading-[0.95] animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-balance">
              Create music{" "}
              <span className="bg-gradient-to-r from-accent via-primary to-accent animate-gradient bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(229,62,62,0.3)]">
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
                <Card
                  key={i}
                  className="bg-card/20 backdrop-blur-xl border border-border/50 p-6 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300 hover:scale-105"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
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
                <div
                  key={i}
                  className="text-center group cursor-default bg-card/20 backdrop-blur-xl rounded-2xl p-6 border border-border/50 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/10 transition-all duration-300"
                >
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
          <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
            Premium Feature
          </h2>
          <p className="text-muted-foreground mb-2 leading-relaxed">AI music creation requires holding at least</p>
          <p className="text-2xl font-bold text-accent mb-6">5,000,000,000 $USI</p>
          <p className="text-sm text-muted-foreground mb-8">in your connected wallet to access this studio</p>
          <div className="flex flex-col gap-3">
            <Button asChild size="lg" className="w-full hover:scale-105 transition-all shadow-lg hover:shadow-xl">
              <a href="/swap" className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Get $USI Tokens
              </a>
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              size="lg"
              className="w-full bg-transparent hover:scale-105 transition-all"
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/8 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl relative z-10">
        <div className="text-center mb-12 animate-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-3 bg-card/50 backdrop-blur-2xl border border-accent/20 rounded-full px-6 py-3 mb-6 shadow-xl shadow-accent/5">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-accent animate-pulse" />
              <div className="absolute inset-0 bg-accent/50 blur-lg animate-ping" />
            </div>
            <span className="text-sm font-medium">AI Studio</span>
            <span className="w-px h-4 bg-border" />
            <span className="text-sm font-bold text-accent">Pro</span>
            {credits !== null && (
              <>
                <span className="w-px h-4 bg-border" />
                <span className="text-sm text-muted-foreground">{credits} credits</span>
              </>
            )}
          </div>

          {/* Animated waveform decoration */}
          <div className="flex items-center justify-center gap-1 mb-6">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-accent/30 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: `${800 + Math.random() * 400}ms`,
                }}
              />
            ))}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
              Create Music
            </span>
            <span className="block mt-2 text-accent">with AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Describe your vision and watch AI compose original music and videos
          </p>
        </div>

        {/* API Key Warning */}
        {apiKeyConfigured === false && (
          <Alert className="mb-8 border-amber-500/50 bg-amber-500/10 backdrop-blur-xl rounded-xl animate-in slide-in-from-bottom-4 duration-700">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <AlertTitle className="text-amber-500 font-bold">API Key Required</AlertTitle>
            <AlertDescription className="text-amber-500/90 space-y-3">
              <p>To use AI music generation, please configure your API key in settings.</p>
              <Button
                variant="outline"
                size="sm"
                className="bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20 text-amber-500"
                asChild
              >
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure API Key
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {generatedTracks.length === 0 && (
          <div className="mb-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-accent/20">
                <Wand2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-lg font-bold">AI Music Tools</h2>
                <p className="text-sm text-muted-foreground">Select a tool to get started</p>
              </div>
            </div>

            <ToolSelector selectedTool={selectedTool} onSelectTool={setSelectedTool} />

            <div className="mt-4 p-4 rounded-xl bg-card/30 border border-border/30">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{getToolName(selectedTool)}:</span>{" "}
                {getToolDescription(selectedTool)}
              </p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {generatedTracks.length === 0 ? (
          <Card className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-700 delay-100 shadow-2xl">
            {/* Card header glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="p-8">
              {(requiresUpload || requiresAudioId) && (
                <div className="mb-8 space-y-6">
                  {requiresUpload && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Upload className="h-4 w-4 text-accent" />
                        <Label className="text-sm font-medium">Upload Audio File</Label>
                      </div>
                      <AudioUpload
                        onUpload={setUploadedAudioUrl}
                        uploadedUrl={uploadedAudioUrl}
                        isUploading={isUploadingAudio}
                        setIsUploading={setIsUploadingAudio}
                      />
                    </div>
                  )}

                  {requiresAudioId && (
                    <PremiumInput
                      id="audioId"
                      label="Existing Audio ID"
                      value={existingAudioId}
                      onChange={(e) => setExistingAudioId(e.target.value)}
                      placeholder="e.g., e231****-****-****-****-****8cadc7dc"
                      icon={Music}
                      hint="Enter the Audio ID of a track you've previously generated"
                    />
                  )}

                  {selectedTool === "extend" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Continue At (seconds)</Label>
                        <span className="text-sm font-mono text-accent bg-accent/10 px-2 py-0.5 rounded-md">
                          {continueAt}s
                        </span>
                      </div>
                      <Slider
                        value={[continueAt]}
                        onValueChange={([v]) => setContinueAt(v)}
                        min={0}
                        max={300}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">The timestamp where the extension should begin</p>
                    </div>
                  )}
                </div>
              )}

              <Tabs defaultValue="simple" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-card/50 backdrop-blur-lg mb-6">
                  <TabsTrigger
                    value="simple"
                    className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                  >
                    Simple
                  </TabsTrigger>
                  <TabsTrigger
                    value="lyrics"
                    className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                  >
                    Lyrics
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="rounded-lg data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
                  >
                    Advanced
                  </TabsTrigger>
                </TabsList>

                {/* Simple Mode */}
                <TabsContent value="simple" className="space-y-8">
                  <PremiumTextarea
                    id="prompt"
                    label="Describe Your Music"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A calm piano track with soft melodies, perfect for meditation..."
                    rows={4}
                    maxLength={500}
                    hint="Be specific about genre, mood, instruments, and style"
                  />

                  <PillSelector
                    label="Genre"
                    options={GENRES}
                    selected={selectedGenre}
                    onSelect={setSelectedGenre}
                    icon={Music}
                  />

                  <PillSelector
                    label="Mood"
                    options={MOODS}
                    selected={selectedMood}
                    onSelect={setSelectedMood}
                    icon={Waves}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumSelect
                      id="instruments"
                      label="Primary Instrument"
                      value={selectedInstruments[0] || ""}
                      onValueChange={(value) => setSelectedInstruments([value])}
                      placeholder="Select instrument"
                      options={INSTRUMENTS}
                      icon={AudioWaveform}
                    />

                    <PremiumInput
                      id="title"
                      label="Track Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Peaceful Piano Meditation"
                      icon={Music}
                      hint="Optional - AI will generate one if empty"
                    />
                  </div>

                  <PremiumSwitch
                    id="instrumental"
                    label="Instrumental Only"
                    description="Generate music without vocals"
                    checked={instrumental}
                    onCheckedChange={setInstrumental}
                    icon={Mic2}
                  />

                  {/* Removed ModelSelector from Simple mode UI */}
                </TabsContent>

                {/* Lyrics Mode */}
                <TabsContent value="lyrics" className="space-y-8">
                  <PremiumTextarea
                    id="lyrics-prompt"
                    label="Describe Your Lyrics Theme"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A love song about missing someone, emotional and heartfelt..."
                    rows={3}
                    hint="Describe the theme and AI will generate matching lyrics"
                  />

                  <Button
                    onClick={handleGenerateLyrics}
                    disabled={isGeneratingLyrics || !prompt.trim()}
                    variant="outline"
                    className="bg-card/50 border-accent/30 hover:bg-accent/10 hover:border-accent transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    {isGeneratingLyrics ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Lyrics...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Lyrics with AI
                      </>
                    )}
                  </Button>

                  <PremiumTextarea
                    id="lyrics"
                    label="Lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Enter your lyrics here or generate them with AI..."
                    rows={8}
                    hint="Write your own or use AI-generated lyrics"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PremiumSelect
                      id="lyrics-genre"
                      label="Genre"
                      value={selectedGenre}
                      onValueChange={setSelectedGenre}
                      placeholder="Select genre"
                      options={GENRES}
                    />
                    <PremiumSelect
                      id="lyrics-mood"
                      label="Mood"
                      value={selectedMood}
                      onValueChange={setSelectedMood}
                      placeholder="Select mood"
                      options={MOODS}
                    />
                  </div>

                  <PremiumInput
                    id="lyrics-title"
                    label="Track Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Missing You"
                    icon={Music}
                  />
                </TabsContent>

                {/* Advanced Mode */}
                <TabsContent value="advanced" className="space-y-8">
                  <PremiumTextarea
                    id="adv-prompt"
                    label="Describe Your Music"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A calm and relaxing piano track with soft melodies"
                    rows={4}
                  />

                  <PremiumSwitch
                    id="custom-mode"
                    label="Custom Mode"
                    description="Enable advanced generation parameters"
                    checked={customMode}
                    onCheckedChange={setCustomMode}
                    icon={Settings}
                  />

                  {customMode && (
                    <div className="space-y-6 p-6 bg-card/30 rounded-xl border border-accent/20 animate-in slide-in-from-top-4 duration-300">
                      <PremiumInput
                        id="negative-tags"
                        label="Negative Tags"
                        value={negativeTags}
                        onChange={(e) => setNegativeTags(e.target.value)}
                        placeholder="e.g., Heavy Metal, Upbeat Drums"
                        hint="Styles to avoid in generation"
                      />

                      <PremiumSelect
                        id="vocal-gender"
                        label="Vocal Gender"
                        value={vocalGender}
                        onValueChange={(value: any) => setVocalGender(value)}
                        placeholder="Select gender"
                        options={["any", "m", "f"]}
                      />

                      <PremiumSlider
                        label="Style Weight"
                        value={styleWeight}
                        onChange={setStyleWeight}
                        hint="How closely to follow the style"
                      />

                      <PremiumSlider
                        label="Weirdness"
                        value={weirdnessConstraint}
                        onChange={setWeirdnessConstraint}
                        hint="How experimental the output should be"
                      />

                      <PremiumSlider
                        label="Audio Weight"
                        value={audioWeight}
                        onChange={setAudioWeight}
                        hint="Balance between audio quality and creativity"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <PremiumSelect
                      id="adv-genre"
                      label="Genre"
                      value={selectedGenre}
                      onValueChange={setSelectedGenre}
                      placeholder="Select genre"
                      options={GENRES}
                    />
                    <PremiumSelect
                      id="adv-mood"
                      label="Mood"
                      value={selectedMood}
                      onValueChange={setSelectedMood}
                      placeholder="Select mood"
                      options={MOODS}
                    />
                    <PremiumInput
                      id="adv-title"
                      label="Track Title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Peaceful Piano"
                    />
                  </div>

                  {/* Removed ModelSelector from Advanced mode UI */}
                </TabsContent>

                {/* Error Display */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-xl p-4 mt-8 animate-in slide-in-from-top-4 duration-300">
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
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mt-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" />
                        <div className="absolute inset-0 bg-accent/50 blur-lg animate-pulse" />
                      </div>
                      <p className="text-sm font-medium text-accent">{progress}</p>
                    </div>
                    {progressPercent > 0 && (
                      <div className="relative">
                        <Progress value={progressPercent} className="h-2" />
                        <div
                          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-accent to-primary rounded-full blur-sm"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!prompt.trim() && !lyrics.trim())}
                  className={cn(
                    "w-full mt-8 h-14 text-lg font-bold rounded-xl transition-all duration-500",
                    "bg-gradient-to-r from-accent via-primary to-accent bg-[length:200%_auto]",
                    "hover:bg-right hover:shadow-2xl hover:shadow-accent/30 hover:scale-[1.02]",
                    "active:scale-[0.98]",
                    "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none",
                  )}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Creating Your Music...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Generate Music
                      <Sparkles className="h-4 w-4 ml-2 animate-pulse" />
                    </>
                  )}
                </Button>
              </Tabs>
            </div>
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
                    className={cn(
                      "transition-all duration-300",
                      selectedTrackIndex === index
                        ? "scale-105 shadow-lg shadow-accent/25"
                        : "bg-transparent hover:scale-105",
                    )}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Version {index + 1}
                    {selectedTrackIndex === index && <Check className="h-4 w-4 ml-2" />}
                  </Button>
                ))}
              </div>
            )}

            {/* Track Preview Card */}
            <Card className="bg-card/30 backdrop-blur-2xl border border-border/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="relative aspect-video bg-gradient-to-br from-accent/20 via-accent/5 to-background">
                {selectedTrack.videoUrl ? (
                  <video src={selectedTrack.videoUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={selectedTrack.imageUrl || "/placeholder.svg"}
                      alt={selectedTrack.title}
                      className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <Button
                      onClick={togglePlayPause}
                      size="lg"
                      className={cn(
                        "absolute rounded-full h-24 w-24 transition-all duration-500",
                        "bg-accent/90 hover:bg-accent hover:scale-110 hover:shadow-2xl hover:shadow-accent/50",
                        isPlaying && "animate-pulse",
                      )}
                    >
                      {isPlaying ? <Pause className="h-10 w-10" /> : <Play className="h-10 w-10 ml-1" />}
                    </Button>
                  </div>
                )}
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-3">{selectedTrack.title}</h2>
                  <p className="text-muted-foreground">{selectedTrack.prompt}</p>
                  {selectedTrack.style && (
                    <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mt-4">
                      <Music className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium text-accent">{selectedTrack.style}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {!selectedTrack.videoUrl && (
                    <Button
                      onClick={handleGenerateVideo}
                      disabled={isGeneratingVideo}
                      variant="outline"
                      className="bg-card/50 border-accent/30 hover:bg-accent/10 hover:border-accent transition-all duration-300 hover:scale-105 active:scale-95"
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
                    className="bg-accent hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/25 active:scale-95"
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
                    className="bg-transparent hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="bg-transparent hover:scale-105 active:scale-95 transition-all duration-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Create Another
                  </Button>

                  {/* Add button to list on platform */}
                  <Button
                    onClick={handleListOnPlatform}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    List on Platform
                  </Button>
                </div>

                {progress && (
                  <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                      <p className="text-sm text-accent">{progress}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/50 rounded-xl p-4 animate-in slide-in-from-top-4 duration-300">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* x402 Payment Modal */}
      <X402GenerationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  )
}
