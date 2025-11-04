"use client"

import { UploadForm } from "@/components/upload-form"

export default function UploadPage() {
  return (
    <div className="min-h-screen pb-32">
      <main className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Upload Track</h1>
            <p className="text-muted-foreground">Upload your music, set pricing, and define royalty splits</p>
          </div>

          <UploadForm />
        </div>
      </main>
    </div>
  )
}
