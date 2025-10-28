"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { useWallet } from "@/lib/web3/wallet-context"
import { useToast } from "@/hooks/use-toast"

interface CreatePlaylistModalProps {
  onPlaylistCreated?: () => void
  trigger?: React.ReactNode
}

export function CreatePlaylistModal({ onPlaylistCreated, trigger }: CreatePlaylistModalProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const { address } = useWallet()
  const { toast } = useToast()

  async function handleCreate() {
    if (!address || !name.trim()) return

    setIsCreating(true)

    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          ownerAddress: address,
          isPublic: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create playlist")
      }

      toast({
        title: "Playlist created",
        description: `"${name}" has been created successfully`,
      })

      setName("")
      setDescription("")
      setOpen(false)
      onPlaylistCreated?.()
    } catch (error) {
      console.error("Failed to create playlist:", error)
      toast({
        title: "Error",
        description: "Failed to create playlist. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Playlist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Playlist</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Playlist Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe your playlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
