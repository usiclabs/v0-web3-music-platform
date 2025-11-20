"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Download, Settings, Share2, Undo, Redo } from "lucide-react"
import { useStudio } from "@/lib/studio/studio-context"

export function StudioHeader() {
  const { project, saveProject } = useStudio()

  return (
    <div className="border-b border-border/40 bg-card/95 backdrop-blur-xl p-3">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            MyUSIC Studio
          </h1>
          <Input
            value={project?.name || "Untitled Project"}
            onChange={(e) => {
              // TODO: Implement project name update in context
              console.log("Project name changed:", e.target.value)
            }}
            className="w-64 h-8 font-medium"
            placeholder="Project name"
          />
        </div>

        <div className="flex items-center gap-2">
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
      </div>
    </div>
  )
}
