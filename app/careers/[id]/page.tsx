"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign } from "lucide-react"
import Link from "next/link"

interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  type: string
  description?: string
  responsibilities?: string[]
  requirements?: string[]
  nice_to_have?: string[]
  salary_range?: string
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<JobPosting | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchJob()
    }
  }, [params.id])

  const fetchJob = async () => {
    try {
      const response = await fetch(`/api/careers/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data)
      } else {
        router.push("/careers")
      }
    } catch (error) {
      console.error("Error fetching job:", error)
      router.push("/careers")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    )
  }

  if (!job) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <Link
          href="/careers"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Careers
        </Link>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8">
          <h1 className="text-4xl font-bold mb-6">{job.title}</h1>

          <div className="flex flex-wrap gap-4 mb-8 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {job.department}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {job.location}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {job.type}
            </span>
            {job.salary_range && (
              <span className="flex items-center gap-2 text-primary">
                <DollarSign className="h-5 w-5" />
                {job.salary_range}
              </span>
            )}
          </div>

          {job.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">About the Role</h2>
              <p className="text-muted-foreground leading-relaxed">{job.description}</p>
            </div>
          )}

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Responsibilities</h2>
              <ul className="space-y-2">
                {job.responsibilities.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.requirements && job.requirements.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.nice_to_have && job.nice_to_have.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Nice to Have</h2>
              <ul className="space-y-2">
                {job.nice_to_have.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-muted-foreground/50 mt-1">○</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t border-border">
            <Button size="lg" className="flex-1" asChild>
              <a href={`mailto:careers@myusic.io?subject=Application for ${job.title}`}>Apply Now</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/careers">View All Positions</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
