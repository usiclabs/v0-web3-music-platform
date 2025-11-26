"use client"

import { cn } from "@/lib/utils"
import { Music, FastForward, Upload, Plus, Mic2, Guitar, RefreshCcw } from "lucide-react"

export type MusicTool =
  | "generate"
  | "extend"
  | "upload-cover"
  | "upload-extend"
  | "add-vocals"
  | "add-instrumental"
  | "cover"

interface ToolSelectorProps {
  selectedTool: MusicTool
  onSelectTool: (tool: MusicTool) => void
}

const tools = [
  {
    id: "generate" as MusicTool,
    name: "Generate",
    description: "Create music from text",
    icon: Music,
    color: "from-red-500 to-orange-500",
  },
  {
    id: "extend" as MusicTool,
    name: "Extend",
    description: "Continue existing tracks",
    icon: FastForward,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "upload-cover" as MusicTool,
    name: "Cover Audio",
    description: "Transform with new style",
    icon: Upload,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "upload-extend" as MusicTool,
    name: "Extend Upload",
    description: "Extend your audio files",
    icon: Plus,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "add-vocals" as MusicTool,
    name: "Add Vocals",
    description: "Generate vocals",
    icon: Mic2,
    color: "from-yellow-500 to-amber-500",
  },
  {
    id: "add-instrumental" as MusicTool,
    name: "Add Instrumental",
    description: "Create accompaniment",
    icon: Guitar,
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: "cover" as MusicTool,
    name: "Cover Music",
    description: "Reinterpret in new style",
    icon: RefreshCcw,
    color: "from-teal-500 to-cyan-500",
  },
]

export function ToolSelector({ selectedTool, onSelectTool }: ToolSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {tools.map((tool) => {
        const isSelected = selectedTool === tool.id
        const Icon = tool.icon

        return (
          <button
            key={tool.id}
            type="button"
            onClick={() => onSelectTool(tool.id)}
            className={cn(
              "group relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300",
              "hover:scale-105 active:scale-95",
              isSelected
                ? "border-accent bg-accent/10 shadow-xl shadow-accent/20"
                : "border-border/50 bg-card/30 hover:border-accent/50 hover:bg-card/50",
            )}
          >
            {/* Glow effect */}
            <div
              className={cn(
                "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 blur-xl -z-10",
                `bg-gradient-to-br ${tool.color}`,
                isSelected && "opacity-20",
              )}
            />

            {/* Icon container */}
            <div
              className={cn(
                "relative p-3 rounded-xl mb-2 transition-all duration-300",
                isSelected ? `bg-gradient-to-br ${tool.color} shadow-lg` : "bg-card/50 group-hover:bg-card",
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6 transition-all duration-300",
                  isSelected ? "text-white" : "text-muted-foreground group-hover:text-foreground",
                )}
              />
            </div>

            {/* Text */}
            <span
              className={cn(
                "text-sm font-semibold text-center transition-colors duration-300",
                isSelected ? "text-accent" : "text-foreground/80",
              )}
            >
              {tool.name}
            </span>
            <span className="text-[10px] text-muted-foreground text-center leading-tight mt-1 hidden sm:block">
              {tool.description}
            </span>

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
