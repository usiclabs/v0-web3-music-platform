export interface Agent {
  id: string
  name: string
  specialty: string
  description: string
  category: "creation" | "production" | "marketing" | "analytics" | "management" | "all"
  ovr: number
  power: number
  speed: number
  earn: number
  icon: string
  successRate: number
  users: number
  active: boolean
  skills: string[]
}

export const AGENTS: Agent[] = [
  {
    id: "echo",
    name: "ECHO",
    specialty: "MUSIC PRODUCER",
    description: "Creates beats, melodies, and full tracks from any idea.",
    category: "creation",
    ovr: 84,
    power: 88,
    speed: 80,
    earn: 82,
    icon: "Radio",
    successRate: 96.3,
    users: 18.2,
    active: true,
    skills: ["Beat Generation", "Melody Composition", "Track Assembly"],
  },
  {
    id: "lyricus",
    name: "LYRICUS",
    specialty: "LYRICS WRITER",
    description: "Writes compelling lyrics tailored to your style.",
    category: "creation",
    ovr: 78,
    power: 72,
    speed: 85,
    earn: 76,
    icon: "PenTool",
    successRate: 94.8,
    users: 12.5,
    active: true,
    skills: ["Lyric Generation", "Style Matching", "Rhyme Optimization"],
  },
  {
    id: "mixerai",
    name: "MIXERAI",
    specialty: "MIXING ENGINEER",
    description: "Mixes your track to industry standard perfection.",
    category: "production",
    ovr: 92,
    power: 90,
    speed: 92,
    earn: 94,
    icon: "Sliders",
    successRate: 98.7,
    users: 24.8,
    active: true,
    skills: ["Audio Mixing", "Mastering", "EQ Optimization"],
  },
  {
    id: "promota",
    name: "PROMOTA",
    specialty: "MARKETING AGENT",
    description: "Builds your audience and grows your reach.",
    category: "marketing",
    ovr: 81,
    power: 85,
    speed: 88,
    earn: 79,
    icon: "TrendingUp",
    successRate: 97.2,
    users: 15.4,
    active: true,
    skills: ["Social Amplification", "Audience Growth", "Reach Optimization"],
  },
  {
    id: "analyx",
    name: "ANALYX",
    specialty: "DATA ANALYST",
    description: "Turns data into insights that drive your growth.",
    category: "analytics",
    ovr: 76,
    power: 78,
    speed: 72,
    earn: 75,
    icon: "BarChart3",
    successRate: 95.1,
    users: 14.2,
    active: true,
    skills: ["Data Analysis", "Trend Prediction", "Performance Tracking"],
  },
  {
    id: "distribo",
    name: "DISTRIBO",
    specialty: "DISTRIBUTION AGENT",
    description: "Ships your music across platforms automatically.",
    category: "management",
    ovr: 88,
    power: 86,
    speed: 90,
    earn: 89,
    icon: "Send",
    successRate: 99.1,
    users: 21.3,
    active: true,
    skills: ["Platform Integration", "Distribution Automation", "Delivery Tracking"],
  },
]

export const CATEGORIES = [
  { id: "all", label: "ALL AGENTS" },
  { id: "creation", label: "CREATION" },
  { id: "production", label: "PRODUCTION" },
  { id: "marketing", label: "MARKETING" },
  { id: "analytics", label: "ANALYTICS" },
  { id: "management", label: "MANAGEMENT" },
]
