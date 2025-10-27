import { Button } from "@/components/ui/button"
import { Briefcase, Heart, Zap, Globe, Users, ArrowRight } from "lucide-react"

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Blockchain Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Community Manager",
      department: "Marketing",
      location: "Remote",
      type: "Full-time",
    },
    {
      title: "Smart Contract Auditor",
      department: "Security",
      location: "Remote",
      type: "Contract",
    },
  ]

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Join the Revolution</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Help us build the future of music streaming. Work with a passionate team creating technology that empowers
            artists and fans worldwide.
          </p>
        </div>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Why USI?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift animate-slide-up">
              <div className="w-12 h-12 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Mission-Driven</h3>
              <p className="text-muted-foreground">
                We're building technology that directly impacts artists' lives and creates a fairer music industry.
              </p>
            </div>

            <div
              className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-12 h-12 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cutting-Edge Tech</h3>
              <p className="text-muted-foreground">
                Work with the latest blockchain technology, smart contracts, and innovative payment protocols.
              </p>
            </div>

            <div
              className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="w-12 h-12 rounded-lg bg-chart-3/20 border border-chart-3/30 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-chart-3" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Remote-First</h3>
              <p className="text-muted-foreground">
                Work from anywhere in the world. We believe in flexibility and trust our team to do great work.
              </p>
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Open Positions</h2>
          <div className="space-y-4">
            {openings.map((job, index) => (
              <div
                key={index}
                className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-6 hover-lift animate-slide-up flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {job.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {job.type}
                    </span>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 bg-transparent">
                  View Details
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Don't see the right role?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking for talented people. Send us your resume and tell us how you can contribute.
            </p>
            <Button size="lg" className="gap-2">
              Send General Application
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
