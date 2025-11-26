"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { UploadForm } from "@/components/upload-form"
import { Sparkles } from "lucide-react"

interface GeneratedTrackData {
  audioUrl?: string
  title?: string
  coverUrl?: string
  style?: string
  prompt?: string
  videoUrl?: string
}

export default function UploadPage() {
  const searchParams = useSearchParams()
  const [prefillData, setPrefillData] = useState<GeneratedTrackData | null>(null)
  const fromCreate = searchParams.get("from") === "create"

  useEffect(() => {
    if (fromCreate) {
      const stored = localStorage.getItem("generatedTrackForUpload")
      if (stored) {
        try {
          const data = JSON.parse(stored)
          setPrefillData(data)
          // Clear after loading to prevent stale data
          localStorage.removeItem("generatedTrackForUpload")
        } catch (e) {
          console.error("Failed to parse stored track data:", e)
        }
      }
    }
  }, [fromCreate])

  return (
    <div className="min-h-screen pb-32">
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Track</h1>
            <p className="text-muted-foreground">Upload your music, set pricing, and define royalty splits</p>

            {prefillData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-400">AI-Generated Track Ready</p>
                    <p className="text-sm text-muted-foreground">
                      Your track "{prefillData.title}" has been pre-filled. Complete the details below to list it.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <UploadForm prefillData={prefillData} />
        </div>
      </main>
    </div>
  )
}
