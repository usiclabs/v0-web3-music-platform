"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStudio } from "@/lib/studio/studio-context"
import { Music2, Plus, FolderOpen, Sparkles, Mic, Piano, Disc3 } from "lucide-react"
import { useState } from "react"

export function StudioWelcome() {
  const { createProject } = useStudio()
  const [projectName, setProjectName] = useState("")
  const [bpm, setBpm] = useState(120)
  const [showNewProject, setShowNewProject] = useState(false)

  const handleCreateProject = async () => {
    if (projectName.trim()) {
      await createProject(projectName, bpm)
      setShowNewProject(false)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl w-full px-8 text-center space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Music2 className="h-16 w-16 text-primary" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              MyUSIC Studio
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional browser-based DAW for creating, mixing, and mastering music. Build full tracks with multi-track
            audio, MIDI, effects, and instantly publish to MyUSIC.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40 space-y-2">
            <Mic className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold">Record Audio</h3>
            <p className="text-xs text-muted-foreground">Multi-track recording with pro tools</p>
          </div>
          <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40 space-y-2">
            <Piano className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold">MIDI Editor</h3>
            <p className="text-xs text-muted-foreground">Piano roll with virtual instruments</p>
          </div>
          <div className="p-4 rounded-lg bg-card/50 backdrop-blur-sm border border-border/40 space-y-2">
            <Disc3 className="h-8 w-8 text-primary mx-auto" />
            <h3 className="font-semibold">Mix & Master</h3>
            <p className="text-xs text-muted-foreground">Full FX racks and mastering tools</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Set up your new music production project</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    placeholder="My Awesome Track"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM (Tempo)</Label>
                  <Input
                    id="bpm"
                    type="number"
                    min={40}
                    max={300}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                  />
                </div>
                <Button onClick={handleCreateProject} className="w-full">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button size="lg" variant="outline" className="gap-2 bg-transparent">
            <FolderOpen className="h-5 w-5" />
            Load Project
          </Button>

          <Button size="lg" variant="outline" className="gap-2 bg-transparent">
            <Sparkles className="h-5 w-5" />
            Browse Templates
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-8">
          <div>
            <div className="text-2xl font-bold text-foreground">Unlimited</div>
            <div>Tracks</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-2xl font-bold text-foreground">Full HD</div>
            <div>Audio Quality</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <div className="text-2xl font-bold text-foreground">Cloud</div>
            <div>Auto-Save</div>
          </div>
        </div>
      </div>
    </div>
  )
}
