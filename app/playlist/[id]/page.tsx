"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TrackCard } from "@/components/track-card"
import { ArrowLeft, Music2, Trash2 } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function PlaylistPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useWallet()
  const { toast } = useToast()
  const [playlist, setPlaylist] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlaylist()
  }, [params.id])

  async function loadPlaylist() {
    try {
      const response = await fetch(`/api/playlists/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPlaylist(data)
      }
    } catch (error) {
      console.error("Failed to load playlist:", error)
    } finally {
      setLoading(false)
    }
  }

  async function deletePlaylist() {
    if (!confirm("Are you sure you want to delete this playlist?")) return

    try {
      const response = await fetch(`/api/playlists/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Playlist deleted",
          description: "Your playlist has been deleted",
        })
        router.push("/profile")
      }
    } catch (error) {
      console.error("Failed to delete playlist:", error)
      toast({
        title: "Error",
        description: "Failed to delete playlist",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-8 px-4">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Loading playlist...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="min-h-screen pb-32">
        <main className="container py-8 px-4">
          <div className="text-center py-12">
            <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
            <Link href="/profile">
              <Button variant="outline" className="mt-4 bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const tracks = playlist.playlist_tracks?.map((pt: any) => pt.tracks).filter(Boolean) || []
  const isOwner = address?.toLowerCase() === playlist.owner_address?.toLowerCase()

  return (
    <div className="min-h-screen pb-32">
      <main className="container py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/profile">
            <Button variant="ghost" className="mb-6 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Profile
            </Button>
          </Link>

          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">{playlist.name}</h1>
                {playlist.description && <p className="text-muted-foreground mb-4">{playlist.description}</p>}
                <p className="text-sm text-muted-foreground">
                  {tracks.length} {tracks.length === 1 ? "track" : "tracks"}
                </p>
              </div>
              {isOwner && (
                <Button variant="destructive" size="sm" onClick={deletePlaylist} className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>

          {tracks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tracks.map((track: any) => (
                <TrackCard key={track.id} track={track} queue={tracks} />
              ))}
            </div>
          ) : (
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-12 text-center">
              <Music2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground">Add tracks to this playlist to get started</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
