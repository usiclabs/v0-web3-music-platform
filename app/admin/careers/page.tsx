"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, X } from "lucide-react"
import { useAccount } from "wagmi"

interface JobPosting {
  id?: string
  title: string
  department: string
  location: string
  type: string
  description: string
  responsibilities: string[]
  requirements: string[]
  nice_to_have: string[]
  salary_range: string
  is_active: boolean
}

const emptyJob: JobPosting = {
  title: "",
  department: "",
  location: "Remote",
  type: "Full-time",
  description: "",
  responsibilities: [""],
  requirements: [""],
  nice_to_have: [""],
  salary_range: "",
  is_active: true,
}

export default function AdminCareersPage() {
  const { address } = useAccount()
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAllJobs()
  }, [])

  const fetchAllJobs = async () => {
    try {
      const response = await fetch("/api/careers")
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingJob) return

    setLoading(true)
    try {
      const method = editingJob.id ? "PUT" : "POST"
      const url = editingJob.id ? `/api/careers/${editingJob.id}` : "/api/careers"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingJob, posted_by: address }),
      })

      if (response.ok) {
        await fetchAllJobs()
        setShowForm(false)
        setEditingJob(null)
      }
    } catch (error) {
      console.error("Error saving job:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job posting?")) return

    try {
      const response = await fetch(`/api/careers/${id}`, { method: "DELETE" })
      if (response.ok) {
        await fetchAllJobs()
      }
    } catch (error) {
      console.error("Error deleting job:", error)
    }
  }

  const addArrayItem = (field: keyof Pick<JobPosting, "responsibilities" | "requirements" | "nice_to_have">) => {
    if (!editingJob) return
    setEditingJob({
      ...editingJob,
      [field]: [...editingJob[field], ""],
    })
  }

  const updateArrayItem = (
    field: keyof Pick<JobPosting, "responsibilities" | "requirements" | "nice_to_have">,
    index: number,
    value: string,
  ) => {
    if (!editingJob) return
    const newArray = [...editingJob[field]]
    newArray[index] = value
    setEditingJob({ ...editingJob, [field]: newArray })
  }

  const removeArrayItem = (
    field: keyof Pick<JobPosting, "responsibilities" | "requirements" | "nice_to_have">,
    index: number,
  ) => {
    if (!editingJob) return
    const newArray = editingJob[field].filter((_, i) => i !== index)
    setEditingJob({ ...editingJob, [field]: newArray })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Job Postings</h1>
          <Button
            onClick={() => {
              setEditingJob(emptyJob)
              setShowForm(true)
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Job
          </Button>
        </div>

        {showForm && editingJob && (
          <div className="bg-card border border-border rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{editingJob.id ? "Edit Job" : "Create New Job"}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false)
                  setEditingJob(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={editingJob.department}
                    onChange={(e) => setEditingJob({ ...editingJob, department: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={editingJob.location}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Employment Type *</Label>
                  <Input
                    id="type"
                    value={editingJob.type}
                    onChange={(e) => setEditingJob({ ...editingJob, type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salary_range">Salary Range</Label>
                  <Input
                    id="salary_range"
                    placeholder="e.g., $80k - $120k"
                    value={editingJob.salary_range}
                    onChange={(e) => setEditingJob({ ...editingJob, salary_range: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={editingJob.is_active}
                    onCheckedChange={(checked) => setEditingJob({ ...editingJob, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active Posting</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Job Description *</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={editingJob.description}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  required
                />
              </div>

              {/* Responsibilities */}
              <div>
                <Label>Responsibilities</Label>
                {editingJob.responsibilities.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem("responsibilities", index, e.target.value)}
                      placeholder="Add a responsibility"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("responsibilities", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("responsibilities")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Responsibility
                </Button>
              </div>

              {/* Requirements */}
              <div>
                <Label>Requirements</Label>
                {editingJob.requirements.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem("requirements", index, e.target.value)}
                      placeholder="Add a requirement"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("requirements", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("requirements")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>
              </div>

              {/* Nice to Have */}
              <div>
                <Label>Nice to Have</Label>
                {editingJob.nice_to_have.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={item}
                      onChange={(e) => updateArrayItem("nice_to_have", index, e.target.value)}
                      placeholder="Add a nice-to-have"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeArrayItem("nice_to_have", index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => addArrayItem("nice_to_have")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Nice-to-Have
                </Button>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingJob.id ? "Update Job" : "Create Job"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingJob(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Job List */}
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-card border border-border rounded-xl p-6 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{job.department}</span>
                  <span>{job.location}</span>
                  <span>{job.type}</span>
                  <span className={job.is_active ? "text-green-500" : "text-red-500"}>
                    {job.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setEditingJob(job)
                    setShowForm(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => job.id && handleDelete(job.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
