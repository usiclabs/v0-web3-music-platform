import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Music } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Music className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-8">Page not found</p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}
