"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function UploadRedirect() {
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Redirecting from /upload to /dashboard/upload")
    router.replace("/dashboard/upload")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-muted-foreground">Redirecting to upload page...</p>
      </div>
    </div>
  )
}
