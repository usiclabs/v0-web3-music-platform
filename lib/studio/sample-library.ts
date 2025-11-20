export interface Sample {
  id: string
  name: string
  category: string
  url: string
  duration: number
  bpm?: number
  key?: string
  tags: string[]
}

// Free, royalty-free drum samples from various sources
export const SAMPLE_LIBRARY: Sample[] = [
  // Drum Kicks
  {
    id: "kick-1",
    name: "808 Kick",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/131/131657_2398403-lq.mp3",
    duration: 0.5,
    bpm: 120,
    tags: ["kick", "808", "bass", "hip-hop"],
  },
  {
    id: "kick-2",
    name: "Acoustic Kick",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/387/387186_7255534-lq.mp3",
    duration: 0.4,
    tags: ["kick", "acoustic", "drums"],
  },
  {
    id: "kick-3",
    name: "Electronic Kick",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/245/245645_4486188-lq.mp3",
    duration: 0.6,
    bpm: 128,
    tags: ["kick", "electronic", "edm"],
  },

  // Drum Snares
  {
    id: "snare-1",
    name: "Acoustic Snare",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/387/387189_7255534-lq.mp3",
    duration: 0.3,
    tags: ["snare", "acoustic", "drums"],
  },
  {
    id: "snare-2",
    name: "Clap Snare",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/166/166186_1473580-lq.mp3",
    duration: 0.2,
    tags: ["snare", "clap", "percussion"],
  },
  {
    id: "snare-3",
    name: "Electronic Snare",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/131/131660_2398403-lq.mp3",
    duration: 0.4,
    tags: ["snare", "electronic", "synthetic"],
  },

  // Hi-Hats
  {
    id: "hihat-1",
    name: "Closed Hi-Hat",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/387/387188_7255534-lq.mp3",
    duration: 0.1,
    tags: ["hihat", "closed", "percussion"],
  },
  {
    id: "hihat-2",
    name: "Open Hi-Hat",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/387/387191_7255534-lq.mp3",
    duration: 0.5,
    tags: ["hihat", "open", "percussion"],
  },

  // Bass
  {
    id: "bass-1",
    name: "Sub Bass C",
    category: "Bass",
    url: "https://cdn.freesound.org/previews/433/433637_907272-lq.mp3",
    duration: 2.0,
    key: "C",
    tags: ["bass", "sub", "synth"],
  },
  {
    id: "bass-2",
    name: "Wobble Bass",
    category: "Bass",
    url: "https://cdn.freesound.org/previews/344/344502_5121236-lq.mp3",
    duration: 1.5,
    bpm: 140,
    tags: ["bass", "wobble", "dubstep"],
  },
  {
    id: "bass-3",
    name: "Slap Bass",
    category: "Bass",
    url: "https://cdn.freesound.org/previews/209/209524_1015240-lq.mp3",
    duration: 1.0,
    tags: ["bass", "slap", "funk"],
  },

  // Synths
  {
    id: "synth-1",
    name: "Pad Atmosphere",
    category: "Synths",
    url: "https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3",
    duration: 3.0,
    key: "Am",
    tags: ["synth", "pad", "ambient"],
  },
  {
    id: "synth-2",
    name: "Pluck Lead",
    category: "Synths",
    url: "https://cdn.freesound.org/previews/380/380036_6224221-lq.mp3",
    duration: 1.5,
    bpm: 128,
    tags: ["synth", "pluck", "lead"],
  },
  {
    id: "synth-3",
    name: "Saw Wave",
    category: "Synths",
    url: "https://cdn.freesound.org/previews/344/344503_5121236-lq.mp3",
    duration: 2.0,
    key: "C",
    tags: ["synth", "saw", "wave"],
  },

  // FX
  {
    id: "fx-1",
    name: "Riser",
    category: "FX",
    url: "https://cdn.freesound.org/previews/415/415564_7255534-lq.mp3",
    duration: 2.5,
    tags: ["fx", "riser", "transition"],
  },
  {
    id: "fx-2",
    name: "Impact",
    category: "FX",
    url: "https://cdn.freesound.org/previews/442/442905_907272-lq.mp3",
    duration: 1.0,
    tags: ["fx", "impact", "hit"],
  },
  {
    id: "fx-3",
    name: "White Noise",
    category: "FX",
    url: "https://cdn.freesound.org/previews/331/331912_3162775-lq.mp3",
    duration: 2.0,
    tags: ["fx", "noise", "texture"],
  },

  // Loops
  {
    id: "loop-1",
    name: "Drum Loop 1",
    category: "Drums",
    url: "https://cdn.freesound.org/previews/414/414209_7255534-lq.mp3",
    duration: 4.0,
    bpm: 120,
    tags: ["loop", "drums", "beat"],
  },
  {
    id: "loop-2",
    name: "Guitar Loop",
    category: "Synths",
    url: "https://cdn.freesound.org/previews/377/377639_6802113-lq.mp3",
    duration: 8.0,
    bpm: 100,
    key: "Em",
    tags: ["loop", "guitar", "melody"],
  },
]

export function getSamplesByCategory(category: string): Sample[] {
  return SAMPLE_LIBRARY.filter((sample) => sample.category === category)
}

export function searchSamples(query: string): Sample[] {
  const lowerQuery = query.toLowerCase()
  return SAMPLE_LIBRARY.filter(
    (sample) =>
      sample.name.toLowerCase().includes(lowerQuery) ||
      sample.category.toLowerCase().includes(lowerQuery) ||
      sample.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  )
}

export const SAMPLE_CATEGORIES = [
  { name: "Drums", count: SAMPLE_LIBRARY.filter((s) => s.category === "Drums").length },
  { name: "Bass", count: SAMPLE_LIBRARY.filter((s) => s.category === "Bass").length },
  { name: "Synths", count: SAMPLE_LIBRARY.filter((s) => s.category === "Synths").length },
  { name: "FX", count: SAMPLE_LIBRARY.filter((s) => s.category === "FX").length },
]
