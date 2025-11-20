"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Download, Settings, Share2, Undo, Redo } from "lucide-react"
import { useStudio } from "@/lib/studio/studio-context"

export function StudioHeader() {
  const { project, saveProject } = useStudio()

  return (
    <div className="border-b border-border/40 bg-card/95 backdrop-blur-xl p-2 sm:p-3">
      <div className="container flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent whitespace-nowrap">
            MyUSIC Studio
          </h1>
          <Input
            value={project?.name || "Untitled Project"}
            onChange={(e) => {
              console.log("Project name changed:", e.target.value)
            }}
            className="w-32 sm:w-64 h-7 sm:h-8 font-medium text-sm"
            placeholder="Project name"
          />
        </div>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Redo className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" onClick={saveProject}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Publish
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex md:hidden items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={saveProject}>
            <Save className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
