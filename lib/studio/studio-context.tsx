"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { StudioProject, StudioTrack, StudioRegion, TransportState, EditorState } from "@/types/studio"
import { audioEngine } from "./audio-engine"

interface StudioContextValue {
  project: StudioProject | null
  tracks: StudioTrack[]
  regions: StudioRegion[]
  transport: TransportState
  editor: EditorState
  loadProject: (projectId: string) => Promise<void>
  createProject: (name: string, bpm?: number) => Promise<void>
  saveProject: () => Promise<void>
  addTrack: (type: StudioTrack["track_type"]) => Promise<void>
  deleteTrack: (trackId: string) => Promise<void>
  addRegion: (trackId: string, audioUrl: string, startTime: number) => Promise<void>
  deleteRegion: (regionId: string) => void
  play: () => void
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setBPM: (bpm: number) => void
  setLoop: (start: number, end: number) => void
  clearLoop: () => void
  setTrackVolume: (trackId: string, volume: number) => void
  setTrackPan: (trackId: string, pan: number) => void
  toggleMute: (trackId: string) => void
  toggleSolo: (trackId: string) => void
  setZoom: (zoom: number) => void
  setViewMode: (mode: EditorState["viewMode"]) => void
}

const StudioContext = createContext<StudioContextValue | null>(null)

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<StudioProject | null>(null)
  const [tracks, setTracks] = useState<StudioTrack[]>([])
  const [regions, setRegions] = useState<StudioRegion[]>([])
  const [transport, setTransport] = useState<TransportState>({
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    bpm: 120,
    timeSignature: "4/4",
    loop: null,
  })
  const [editor, setEditor] = useState<EditorState>({
    zoom: 1,
    snapToGrid: true,
    gridDivision: 16,
    viewMode: "timeline",
    selectedNotes: [],
  })

  const animationFrameRef = useRef<number>()
  const engineInitialized = useRef(false)

  // Initialize audio engine
  useEffect(() => {
    if (!engineInitialized.current) {
      audioEngine.initialize().catch(console.error)
      engineInitialized.current = true
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Update current time while playing
  useEffect(() => {
    if (transport.isPlaying) {
      const updateTime = () => {
        setTransport((prev) => ({
          ...prev,
          currentTime: audioEngine.currentTime,
        }))
        animationFrameRef.current = requestAnimationFrame(updateTime)
      }
      animationFrameRef.current = requestAnimationFrame(updateTime)
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [transport.isPlaying])

  const loadProject = useCallback(async (projectId: string) => {
    console.log("[v0] Loading project:", projectId)
    // TODO: Fetch from database and load audio engine
  }, [])

  const createProject = useCallback(async (name: string, bpm = 120) => {
    console.log("[v0] Creating project:", name, "BPM:", bpm)
    const newProject: StudioProject = {
      id: crypto.randomUUID(),
      name,
      creator_address: "",
      bpm,
      time_signature: "4/4",
      duration_seconds: 0,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    console.log("[v0] New project created:", newProject)
    setProject(newProject)
    audioEngine.setBPM(bpm)
    console.log("[v0] Project state set, should now show DAW interface")
  }, [])

  const saveProject = useCallback(async () => {
    console.log("[v0] Saving project")
    // TODO: Save to database
  }, [])

  const addTrack = useCallback(
    async (type: StudioTrack["track_type"]) => {
      const newTrack: StudioTrack = {
        id: crypto.randomUUID(),
        project_id: project?.id || "",
        name: `${type} ${tracks.length + 1}`,
        track_type: type,
        color: "#ef4444",
        position: tracks.length,
        volume: 0.7,
        pan: 0,
        is_muted: false,
        is_soloed: false,
        is_armed: false,
        created_at: new Date().toISOString(),
      }

      audioEngine.createTrack(newTrack.id, newTrack.volume, newTrack.pan)
      setTracks((prev) => [...prev, newTrack])
    },
    [project, tracks],
  )

  const deleteTrack = useCallback(async (trackId: string) => {
    audioEngine.deleteTrack(trackId)
    setTracks((prev) => prev.filter((t) => t.id !== trackId))
    setRegions((prev) => prev.filter((r) => r.track_id !== trackId))
  }, [])

  const addRegion = useCallback(async (trackId: string, audioUrl: string, startTime: number) => {
    const newRegion: StudioRegion = {
      id: crypto.randomUUID(),
      track_id: trackId,
      region_type: "audio",
      name: "Audio Clip",
      start_time: startTime,
      duration: 10,
      offset: 0,
      audio_url: audioUrl,
      color: "#3b82f6",
      created_at: new Date().toISOString(),
    }

    audioEngine.createPlayer(newRegion.id, trackId, audioUrl, startTime, 0, 10)
    setRegions((prev) => [...prev, newRegion])
  }, [])

  const deleteRegion = useCallback((regionId: string) => {
    audioEngine.deletePlayer(regionId)
    setRegions((prev) => prev.filter((r) => r.id !== regionId))
  }, [])

  const play = useCallback(() => {
    audioEngine.play()
    setTransport((prev) => ({ ...prev, isPlaying: true }))
  }, [])

  const pause = useCallback(() => {
    audioEngine.pause()
    setTransport((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const stop = useCallback(() => {
    audioEngine.stop()
    setTransport((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }))
  }, [])

  const seek = useCallback((time: number) => {
    audioEngine.seek(time)
    setTransport((prev) => ({ ...prev, currentTime: time }))
  }, [])

  const setBPM = useCallback((bpm: number) => {
    audioEngine.setBPM(bpm)
    setTransport((prev) => ({ ...prev, bpm }))
  }, [])

  const setLoop = useCallback((start: number, end: number) => {
    audioEngine.setLoop(start, end)
    setTransport((prev) => ({ ...prev, loop: { start, end } }))
  }, [])

  const clearLoop = useCallback(() => {
    audioEngine.clearLoop()
    setTransport((prev) => ({ ...prev, loop: null }))
  }, [])

  const setTrackVolume = useCallback((trackId: string, volume: number) => {
    audioEngine.setTrackVolume(trackId, volume)
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, volume } : t)))
  }, [])

  const setTrackPan = useCallback((trackId: string, pan: number) => {
    audioEngine.setTrackPan(trackId, pan)
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, pan } : t)))
  }, [])

  const toggleMute = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          audioEngine.muteTrack(trackId, !t.is_muted)
          return { ...t, is_muted: !t.is_muted }
        }
        return t
      }),
    )
  }, [])

  const toggleSolo = useCallback((trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          audioEngine.soloTrack(trackId, !t.is_soloed)
          return { ...t, is_soloed: !t.is_soloed }
        }
        return t
      }),
    )
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setEditor((prev) => ({ ...prev, zoom }))
  }, [])

  const setViewMode = useCallback((mode: EditorState["viewMode"]) => {
    setEditor((prev) => ({ ...prev, viewMode: mode }))
  }, [])

  const value: StudioContextValue = useMemo(
    () => ({
      project,
      tracks,
      regions,
      transport,
      editor,
      loadProject,
      createProject,
      saveProject,
      addTrack,
      deleteTrack,
      addRegion,
      deleteRegion,
      play,
      pause,
      stop,
      seek,
      setBPM,
      setLoop,
      clearLoop,
      setTrackVolume,
      setTrackPan,
      toggleMute,
      toggleSolo,
      setZoom,
      setViewMode,
    }),
    [
      project,
      tracks,
      regions,
      transport,
      editor,
      loadProject,
      createProject,
      saveProject,
      addTrack,
      deleteTrack,
      addRegion,
      deleteRegion,
      play,
      pause,
      stop,
      seek,
      setBPM,
      setLoop,
      clearLoop,
      setTrackVolume,
      setTrackPan,
      toggleMute,
      toggleSolo,
      setZoom,
      setViewMode,
    ],
  )

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>
}

export function useStudio() {
  const context = useContext(StudioContext)
  if (!context) {
    throw new Error("useStudio must be used within StudioProvider")
  }
  return context
}
