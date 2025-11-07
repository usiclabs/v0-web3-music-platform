"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/lib/web3/wallet-context"
import { WalletConnectPrompt } from "@/components/wallet-connect-prompt"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Music,
  Wallet,
  Download,
  Trash2,
  Save,
  Loader2,
  Upload,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { address, isConnected, disconnect } = useWallet()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Profile settings
  const [artistName, setArtistName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  // Privacy settings
  const [profilePublic, setProfilePublic] = useState(true)
  const [showActivity, setShowActivity] = useState(true)
  const [showListeningHistory, setShowListeningHistory] = useState(true)

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [followNotifications, setFollowNotifications] = useState(true)
  const [likeNotifications, setLikeNotifications] = useState(true)
  const [commentNotifications, setCommentNotifications] = useState(true)

  // Audio settings
  const [audioQuality, setAudioQuality] = useState("high")
  const [autoplay, setAutoplay] = useState(true)
  const [crossfade, setCrossfade] = useState(false)

  // Display settings
  const [theme, setTheme] = useState("dark")
  const [compactMode, setCompactMode] = useState(false)

  const [activeTab, setActiveTab] = useState("profile")

  useEffect(() => {
    loadSettings()
  }, [address])

  const loadSettings = async () => {
    if (!address) {
      setLoading(false)
      return
    }

    try {
      const supabase = createBrowserClient()
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", address.toLowerCase())
        .single()

      if (profileData) {
        setProfile(profileData)
        setArtistName(profileData.artist_name || "")
        setBio(profileData.bio || "")
        setAvatarUrl(profileData.avatar_url || "")
      }

      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem(`settings_${address}`)
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences)
        setProfilePublic(prefs.profilePublic ?? true)
        setShowActivity(prefs.showActivity ?? true)
        setShowListeningHistory(prefs.showListeningHistory ?? true)
        setEmailNotifications(prefs.emailNotifications ?? true)
        setFollowNotifications(prefs.followNotifications ?? true)
        setLikeNotifications(prefs.likeNotifications ?? true)
        setCommentNotifications(prefs.commentNotifications ?? true)
        setAudioQuality(prefs.audioQuality || "high")
        setAutoplay(prefs.autoplay ?? true)
        setCrossfade(prefs.crossfade ?? false)
        setTheme(prefs.theme || "dark")
        setCompactMode(prefs.compactMode ?? false)
      }
    } catch (error) {
      console.error("[v0] Failed to load settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfileSettings = async () => {
    if (!address) return

    setSaving(true)
    try {
      const supabase = createBrowserClient()

      let finalAvatarUrl = avatarUrl

      if (avatarFile) {
        const timestamp = Date.now()
        const filename = `${timestamp}-${avatarFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const filePath = `avatars/${filename}`

        const signedUrlResponse = await fetch("/api/storage/signed-upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: "audio",
            filePath,
            contentType: avatarFile.type,
          }),
        })

        const signedUrlData = await signedUrlResponse.json()
        if (!signedUrlResponse.ok) throw new Error(signedUrlData.error)

        const { signedUrl, path } = signedUrlData

        const uploadResponse = await fetch(signedUrl, {
          method: "PUT",
          body: avatarFile,
          headers: { "Content-Type": avatarFile.type },
        })

        if (!uploadResponse.ok) throw new Error("Failed to upload avatar")

        const {
          data: { publicUrl },
        } = supabase.storage.from("audio").getPublicUrl(path)

        finalAvatarUrl = publicUrl
      }

      const { error } = await supabase.from("profiles").upsert(
        {
          wallet_address: address.toLowerCase(),
          artist_name: artistName || null,
          bio: bio || null,
          avatar_url: finalAvatarUrl || null,
        },
        { onConflict: "wallet_address" },
      )

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("[v0] Failed to save profile:", error)
    } finally {
      setSaving(false)
    }
  }

  const savePreferences = () => {
    if (!address) return

    const preferences = {
      profilePublic,
      showActivity,
      showListeningHistory,
      emailNotifications,
      followNotifications,
      likeNotifications,
      commentNotifications,
      audioQuality,
      autoplay,
      crossfade,
      theme,
      compactMode,
    }

    localStorage.setItem(`settings_${address}`, JSON.stringify(preferences))
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    router.push("/")
  }

  const exportData = async () => {
    if (!address) return

    try {
      const supabase = createBrowserClient()

      // Fetch all user data
      const [profile, tracks, likes, follows, playlists, streams] = await Promise.all([
        supabase.from("profiles").select("*").eq("wallet_address", address.toLowerCase()).single(),
        supabase.from("tracks").select("*").eq("artist_id", address.toLowerCase()),
        supabase.from("likes").select("*").eq("user_address", address.toLowerCase()),
        supabase.from("follows").select("*").eq("follower_address", address.toLowerCase()),
        supabase.from("playlists").select("*").eq("owner_address", address.toLowerCase()),
        supabase.from("streams").select("*").eq("listener_address", address.toLowerCase()),
      ])

      const exportData = {
        profile: profile.data,
        tracks: tracks.data,
        likes: likes.data,
        follows: follows.data,
        playlists: playlists.data,
        streams: streams.data,
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `usic-data-${address.slice(0, 8)}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Failed to export data:", error)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-8 sm:py-12 px-4 sm:px-6">
          <WalletConnectPrompt
            title="Connect Your Wallet"
            description="Please connect your wallet to access settings"
            icon={<Settings className="h-10 w-10 md:h-12 md:w-12 text-primary" />}
          />
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-8 sm:py-12 px-4 sm:px-6">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading settings...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="container py-6 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your account preferences and privacy settings
            </p>
          </div>

          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mb-6 sm:mb-8 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />

              <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <TabsList className="inline-flex w-auto sm:grid sm:w-full sm:max-w-4xl sm:grid-cols-6 h-auto sm:h-10 p-1 gap-1">
                  <TabsTrigger
                    value="profile"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2 transition-all duration-300"
                  >
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Profile</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="privacy"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2 transition-all duration-300"
                  >
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Privacy</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2 transition-all duration-300"
                  >
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Notifications</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="audio"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2 transition-all duration-300"
                  >
                    <Music className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Audio</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="display"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2 transition-all duration-300"
                  >
                    <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Display</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="account"
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap px-4 sm:px-4 py-2 transition-all duration-300"
                  >
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Account</span>
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Profile Settings */}
            <TabsContent
              value="profile"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ willChange: activeTab === "profile" ? "opacity, transform" : "auto" }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Picture</h2>
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-4 border-primary/30">
                    <AvatarImage src={avatarFile ? URL.createObjectURL(avatarFile) : avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                      {artistName?.[0]?.toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Label htmlFor="avatar" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                        <Upload className="h-4 w-4" />
                        <span>Upload new avatar</span>
                      </div>
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*,.gif"
                      onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    {avatarFile && <p className="text-sm text-muted-foreground mt-2">{avatarFile.name}</p>}
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="artistName">Artist Name</Label>
                    <Input
                      id="artistName"
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      placeholder="Enter your artist name"
                      className="bg-card/50 backdrop-blur-xl border border-border/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      rows={5}
                      className="bg-card/50 backdrop-blur-xl border border-border/50 resize-none"
                    />
                    <p className="text-sm text-muted-foreground mt-2">{bio.length}/500 characters</p>
                  </div>
                </div>
              </Card>

              <Button onClick={saveProfileSettings} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent
              value="privacy"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ willChange: activeTab === "privacy" ? "opacity, transform" : "auto" }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Profile Visibility</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Public Profile</Label>
                      <p className="text-sm text-muted-foreground">Allow others to view your profile</p>
                    </div>
                    <Switch checked={profilePublic} onCheckedChange={setProfilePublic} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Activity</Label>
                      <p className="text-sm text-muted-foreground">Display your recent activity on your profile</p>
                    </div>
                    <Switch checked={showActivity} onCheckedChange={setShowActivity} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Listening History</Label>
                      <p className="text-sm text-muted-foreground">Allow others to see what you've been listening to</p>
                    </div>
                    <Switch checked={showListeningHistory} onCheckedChange={setShowListeningHistory} />
                  </div>
                </div>
              </Card>

              <Button onClick={savePreferences} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Privacy Settings
              </Button>
            </TabsContent>

            {/* Notification Settings */}
            <TabsContent
              value="notifications"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ willChange: activeTab === "notifications" ? "opacity, transform" : "auto" }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Followers</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone follows you</p>
                    </div>
                    <Switch checked={followNotifications} onCheckedChange={setFollowNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Likes</Label>
                      <p className="text-sm text-muted-foreground">Get notified when someone likes your track</p>
                    </div>
                    <Switch checked={likeNotifications} onCheckedChange={setLikeNotifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Comments</Label>
                      <p className="text-sm text-muted-foreground">Get notified about new comments</p>
                    </div>
                    <Switch checked={commentNotifications} onCheckedChange={setCommentNotifications} />
                  </div>
                </div>
              </Card>

              <Button onClick={savePreferences} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </TabsContent>

            {/* Audio Settings */}
            <TabsContent
              value="audio"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ willChange: activeTab === "audio" ? "opacity, transform" : "auto" }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Playback Settings</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Audio Quality</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {["low", "medium", "high"].map((quality) => (
                        <Button
                          key={quality}
                          variant={audioQuality === quality ? "default" : "outline"}
                          onClick={() => setAudioQuality(quality)}
                          className="capitalize"
                        >
                          {quality}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {audioQuality === "high" && "320kbps - Best quality"}
                      {audioQuality === "medium" && "192kbps - Balanced"}
                      {audioQuality === "low" && "128kbps - Save data"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Autoplay</Label>
                      <p className="text-sm text-muted-foreground">Automatically play similar tracks</p>
                    </div>
                    <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Crossfade</Label>
                      <p className="text-sm text-muted-foreground">Smooth transitions between tracks</p>
                    </div>
                    <Switch checked={crossfade} onCheckedChange={setCrossfade} />
                  </div>
                </div>
              </Card>

              <Button onClick={savePreferences} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Audio Settings
              </Button>
            </TabsContent>

            {/* Display Settings */}
            <TabsContent
              value="display"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ willChange: activeTab === "display" ? "opacity, transform" : "auto" }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {["dark", "light"].map((t) => (
                        <Button
                          key={t}
                          variant={theme === t ? "default" : "outline"}
                          onClick={() => setTheme(t)}
                          className="capitalize"
                        >
                          {t}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Choose your preferred color scheme</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Show more content on screen</p>
                    </div>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>
                </div>
              </Card>

              <Button onClick={savePreferences} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Display Settings
              </Button>
            </TabsContent>

            {/* Account Settings */}
            <TabsContent
              value="account"
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ willChange: activeTab === "account" ? "opacity, transform" : "auto" }}
            >
              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Wallet Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label>Connected Wallet</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={address}
                        disabled
                        className="bg-card/50 backdrop-blur-xl border border-border/50 font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={copyAddress}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 bg-transparent" onClick={handleDisconnect}>
                      <Wallet className="h-4 w-4 mr-2" />
                      Disconnect Wallet
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href={`https://basescan.org/address/${address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on BaseScan
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/50 backdrop-blur-xl border border-border/50 p-6">
                <h2 className="text-xl font-semibold mb-6">Data Management</h2>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full bg-transparent" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Your Data
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Download a copy of your profile, tracks, and activity data
                  </p>
                </div>
              </Card>

              <Card className="bg-destructive/10 backdrop-blur-xl border border-destructive/50 p-6">
                <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
