"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ListPlus, Plus, Wallet } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { CreatePlaylistModal } from "./create-playlist-modal"

interface AddToPlaylistModalProps {
  trackId: string
  trackTitle: string
}

export function AddToPlaylistModal({ trackId, trackTitle }: AddToPlaylistModalProps) {
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const { address } = useWallet()
  const { toast } = useToast()

  useEffect(() => {
    if (open && address) {
      loadPlaylists()
    }
  }, [open, address])

  async function loadPlaylists() {
    if (!address) return

    setLoading(true)
    try {
      const response = await fetch(`/api/playlists?address=${address}`)
      if (response.ok) {
        const data = await response.json()
        setPlaylists(data)
      }
    } catch (error) {
      console.error("Failed to load playlists:", error)
    } finally {
      setLoading(false)
    }
  }

  async function addToPlaylist(playlistId: string, playlistName: string) {
    setAddingTo(playlistId)

    try {
      const response = await fetch(`/api/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId }),
      })

      if (response.status === 409) {
        toast({
          title: "Already in playlist",
          description: `"${trackTitle}" is already in "${playlistName}"`,
        })
        return
      }

      if (!response.ok) {
        throw new Error("Failed to add track")
      }

      toast({
        title: "Added to playlist",
        description: `"${trackTitle}" added to "${playlistName}"`,
      })

      setOpen(false)
    } catch (error) {
      console.error("Failed to add to playlist:", error)
      toast({
        title: "Error",
        description: "Failed to add track to playlist",
        variant: "destructive",
      })
    } finally {
      setAddingTo(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:scale-110 transition-transform"
          title="Add to playlist"
        >
          <ListPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {!address ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">Connect your wallet to create and manage playlists</p>
              <Button
                onClick={() => {
                  setOpen(false)
                  // User can click the Connect Wallet button in header
                }}
                className="gap-2"
              >
                <Wallet className="h-4 w-4" />
                Close and Connect Wallet
              </Button>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading playlists...</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">You don't have any playlists yet</p>
              <CreatePlaylistModal onPlaylistCreated={loadPlaylists} />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addToPlaylist(playlist.id, playlist.name)}
                  disabled={addingTo === playlist.id}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors disabled:opacity-50"
                >
                  <div className="text-left">
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-xs text-muted-foreground">{playlist.playlist_tracks?.[0]?.count || 0} tracks</p>
                  </div>
                  {addingTo === playlist.id ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </button>
              ))}
              <CreatePlaylistModal
                onPlaylistCreated={loadPlaylists}
                trigger={
                  <Button variant="outline" className="w-full gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    Create New Playlist
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
