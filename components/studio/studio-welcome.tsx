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
import { Music2, Plus, FolderOpen, Sparkles, Mic, Piano, Disc3, Cloud } from "lucide-react"
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-black via-zinc-950 to-black">
      <div className="absolute inset-0 overflow-hidden opacity-40">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-red-500/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-pink-500/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 md:w-72 md:h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-4 md:px-8 py-8 md:py-16">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col justify-center">
          <div className="text-center mb-8 md:mb-12">
            <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
              <Music2 className="h-10 w-10 md:h-16 md:w-16 text-red-500" />
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
                MyUSIC Studio
              </h1>
            </div>
            <p className="text-base md:text-xl text-zinc-400 max-w-2xl mx-auto px-4">
              Professional browser-based DAW with AI-powered tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <div className="group bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-red-500/20 transition-colors">
                <Mic className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Record Audio</h3>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed">Multi-track recording with pro tools</p>
            </div>

            <div className="group bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-red-500/20 transition-colors">
                <Piano className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">MIDI Editor</h3>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed">Piano roll with virtual instruments</p>
            </div>

            <div className="group bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 md:mb-6 group-hover:bg-red-500/20 transition-colors">
                <Disc3 className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-3">Mix & Master</h3>
              <p className="text-sm md:text-base text-zinc-400 leading-relaxed">Full FX racks and mastering tools</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 md:mb-12 max-w-2xl mx-auto w-full">
            <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold h-14 md:h-16 text-base md:text-lg rounded-xl shadow-lg shadow-red-500/25 active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-900 border-zinc-800 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Project</DialogTitle>
                  <DialogDescription className="text-zinc-400">
                    Set up your new music production project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName" className="text-white">
                      Project Name
                    </Label>
                    <Input
                      id="projectName"
                      placeholder="My Awesome Track"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bpm" className="text-white">
                      BPM (Tempo)
                    </Label>
                    <Input
                      id="bpm"
                      type="number"
                      min={40}
                      max={300}
                      value={bpm}
                      onChange={(e) => setBpm(Number(e.target.value))}
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                  </div>
                  <Button onClick={handleCreateProject} className="w-full bg-red-600 hover:bg-red-700">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-white h-14 md:h-16 text-base md:text-lg rounded-xl active:scale-95 transition-transform bg-transparent"
            >
              <FolderOpen className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              Load Project
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 text-white h-14 md:h-16 text-base md:text-lg rounded-xl active:scale-95 transition-transform bg-transparent"
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              Browse Templates
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto w-full">
            <div className="text-center p-4 md:p-6 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50">
              <div className="text-2xl md:text-4xl font-bold text-red-500 mb-2">∞</div>
              <div className="text-xs md:text-sm font-medium text-white mb-1">Unlimited</div>
              <div className="text-xs text-zinc-500">Tracks</div>
            </div>

            <div className="text-center p-4 md:p-6 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50">
              <div className="text-2xl md:text-4xl font-bold text-red-500 mb-2">HD</div>
              <div className="text-xs md:text-sm font-medium text-white mb-1">Full Quality</div>
              <div className="text-xs text-zinc-500">48kHz</div>
            </div>

            <div className="text-center p-4 md:p-6 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50">
              <Cloud className="w-8 h-8 md:w-10 md:h-10 mx-auto text-red-500 mb-2" />
              <div className="text-xs md:text-sm font-medium text-white mb-1">Cloud</div>
              <div className="text-xs text-zinc-500">Auto-Save</div>
            </div>

            <div className="text-center p-4 md:p-6 bg-zinc-900/30 backdrop-blur-sm rounded-xl border border-zinc-800/50">
              <div className="text-2xl md:text-4xl font-bold text-red-500 mb-2">AI</div>
              <div className="text-xs md:text-sm font-medium text-white mb-1">Powered</div>
              <div className="text-xs text-zinc-500">Tools</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
