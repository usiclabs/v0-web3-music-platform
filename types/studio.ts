export interface StudioProject {
  id: string
  name: string
  description?: string
  creator_address: string
  bpm: number
  time_signature: string
  key_signature?: string
  duration_seconds: number
  cover_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface StudioTrack {
  id: string
  project_id: string
  name: string
  track_type: "audio" | "midi" | "bus" | "master"
  color: string
  position: number
  volume: number
  pan: number
  is_muted: boolean
  is_soloed: boolean
  is_armed: boolean
  created_at: string
}

export interface StudioRegion {
  id: string
  track_id: string
  region_type: "audio" | "midi"
  name: string
  start_time: number
  duration: number
  offset: number
  audio_url?: string
  midi_data?: MidiData
  color: string
  created_at: string
}

export interface MidiNote {
  id: string
  region_id: string
  note_number: number
  velocity: number
  start_time: number
  duration: number
  created_at: string
}

export interface StudioAutomation {
  id: string
  track_id: string
  parameter_name: string
  points: AutomationPoint[]
  created_at: string
}

export interface AutomationPoint {
  time: number
  value: number
  curve?: "linear" | "exponential" | "step"
}

export interface StudioEffect {
  id: string
  track_id: string
  effect_type: string
  position: number
  is_enabled: boolean
  parameters: Record<string, number>
  created_at: string
}

export interface StudioSample {
  id: string
  name: string
  category: string
  tags: string[]
  audio_url: string
  duration: number
  bpm?: number
  key_signature?: string
  uploader_address?: string
  is_public: boolean
  download_count: number
  created_at: string
}

export interface StudioProjectVersion {
  id: string
  project_id: string
  version_number: number
  version_name?: string
  snapshot_data: ProjectSnapshot
  created_by: string
  created_at: string
}

export interface ProjectSnapshot {
  tracks: StudioTrack[]
  regions: StudioRegion[]
  automation: StudioAutomation[]
  effects: StudioEffect[]
  bpm: number
  time_signature: string
}

export interface StudioCollaborator {
  id: string
  project_id: string
  collaborator_address: string
  permission: "view" | "edit" | "admin"
  invited_by: string
  created_at: string
}

export interface StudioExport {
  id: string
  project_id: string
  exported_track_id?: string
  export_format: string
  audio_url: string
  duration: number
  file_size_bytes?: number
  exported_by: string
  created_at: string
}

export interface MidiData {
  notes: {
    note: number
    velocity: number
    time: number
    duration: number
  }[]
}

// Client-side state types
export interface TransportState {
  isPlaying: boolean
  isRecording: boolean
  currentTime: number
  bpm: number
  timeSignature: string
  loop: { start: number; end: number } | null
}

export interface EditorState {
  selectedTrackId?: string
  selectedRegionId?: string
  selectedNotes: string[]
  zoom: number
  snapToGrid: boolean
  gridDivision: number
  viewMode: "timeline" | "piano-roll" | "mixer"
}
