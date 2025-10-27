"use client"

import { EditTrackForm } from "@/components/edit-track-form"
import { useParams } from "next/navigation"

export default function EditTrackPage() {
  const params = useParams()
  const trackId = params.id as string

  return (
    <div className="min-h-screen pb-32 bg-black">
      <main className="container py-12 px-4 sm:px-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Edit Track</h1>
          <p className="text-muted-foreground">Update your track details and royalty splits</p>
        </div>

        <EditTrackForm trackId={trackId} />
      </main>
    </div>
  )
}
