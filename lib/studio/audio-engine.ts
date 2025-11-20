let Tone: typeof import("tone") | null = null

async function getTone() {
  if (!Tone && typeof window !== "undefined") {
    Tone = await import("tone")
  }
  return Tone
}

export class StudioAudioEngine {
  private static instance: StudioAudioEngine
  public transport: any
  public master: any
  private tracks: Map<string, any>
  private audioBuffers: Map<string, any>
  private players: Map<string, any>
  private isInitialized = false

  private constructor() {
    this.tracks = new Map()
    this.audioBuffers = new Map()
    this.players = new Map()
  }

  public static getInstance(): StudioAudioEngine {
    if (!StudioAudioEngine.instance) {
      StudioAudioEngine.instance = new StudioAudioEngine()
    }
    return StudioAudioEngine.instance
  }

  public async initialize() {
    if (this.isInitialized) return
    if (typeof window === "undefined") return // Skip on server

    try {
      const tone = await getTone()
      if (!tone) return

      this.transport = tone.Transport
      this.master = new tone.Channel({ volume: 0 }).toDestination()

      await tone.start()
      console.log("[v0] Studio Audio Engine initialized")
      this.isInitialized = true
    } catch (error) {
      console.error("[v0] Failed to initialize audio engine:", error)
      throw error
    }
  }

  // Transport controls
  public async play() {
    if (!this.isInitialized) {
      throw new Error("Audio engine not initialized")
    }
    this.transport.start()
  }

  public pause() {
    if (this.transport) this.transport.pause()
  }

  public stop() {
    if (this.transport) {
      this.transport.stop()
      this.transport.position = 0
    }
  }

  public seek(time: number) {
    if (this.transport) this.transport.seconds = time
  }

  public get currentTime(): number {
    return this.transport?.seconds || 0
  }

  public setBPM(bpm: number) {
    if (this.transport) this.transport.bpm.value = bpm
  }

  public setLoop(start: number, end: number) {
    if (this.transport) {
      this.transport.loop = true
      this.transport.loopStart = start
      this.transport.loopEnd = end
    }
  }

  public clearLoop() {
    if (this.transport) this.transport.loop = false
  }

  // Track management
  public async createTrack(trackId: string, volume = 0.7, pan = 0): Promise<any> {
    const tone = await getTone()
    if (!tone) return null

    const channel = new tone.Channel({ volume: tone.gainToDb(volume), pan }).connect(this.master)
    this.tracks.set(trackId, channel)
    return channel
  }

  public getTrack(trackId: string): any | undefined {
    return this.tracks.get(trackId)
  }

  public deleteTrack(trackId: string) {
    const track = this.tracks.get(trackId)
    if (track) {
      track.dispose()
      this.tracks.delete(trackId)
    }
  }

  public async setTrackVolume(trackId: string, volume: number) {
    const tone = await getTone()
    if (!tone) return

    const track = this.tracks.get(trackId)
    if (track) {
      track.volume.value = tone.gainToDb(volume)
    }
  }

  public setTrackPan(trackId: string, pan: number) {
    const track = this.tracks.get(trackId)
    if (track) {
      track.pan.value = pan
    }
  }

  public muteTrack(trackId: string, muted: boolean) {
    const track = this.tracks.get(trackId)
    if (track) {
      track.mute = muted
    }
  }

  public soloTrack(trackId: string, soloed: boolean) {
    const track = this.tracks.get(trackId)
    if (track) {
      track.solo = soloed
    }
  }

  // Audio playback
  public async loadAudioBuffer(url: string, bufferId: string): Promise<any> {
    const tone = await getTone()
    if (!tone) return null

    try {
      const buffer = new tone.ToneAudioBuffer(url)
      await buffer.load()
      this.audioBuffers.set(bufferId, buffer)
      return buffer
    } catch (error) {
      console.error(`[v0] Failed to load audio buffer ${bufferId}:`, error)
      throw error
    }
  }

  public async createPlayer(
    regionId: string,
    trackId: string,
    audioUrl: string,
    startTime: number,
    offset: number,
    duration: number,
  ): Promise<any> {
    const tone = await getTone()
    if (!tone) return null

    const track = this.getTrack(trackId)
    if (!track) {
      throw new Error(`Track ${trackId} not found`)
    }

    const player = new tone.Player(audioUrl).connect(track)
    player.sync().start(startTime, offset, duration)
    this.players.set(regionId, player)

    return player
  }

  public deletePlayer(regionId: string) {
    const player = this.players.get(regionId)
    if (player) {
      player.unsync()
      player.dispose()
      this.players.delete(regionId)
    }
  }

  // Recording
  public async startRecording(trackId: string): Promise<MediaRecorder | null> {
    const tone = await getTone()
    if (!tone || typeof window === "undefined") return null

    const track = this.tracks.get(trackId)
    if (!track) {
      throw new Error(`Track ${trackId} not found`)
    }

    const dest = tone.context.createMediaStreamDestination()
    track.connect(dest as any)

    const recorder = new MediaRecorder(dest.stream)
    return recorder
  }

  // Export/Render
  public async renderToBuffer(duration: number): Promise<AudioBuffer | null> {
    const tone = await getTone()
    if (!tone) return null

    const offline = new tone.Offline(async () => {
      this.transport.start()
    }, duration)

    return offline
  }

  // Cleanup
  public dispose() {
    if (this.transport) {
      this.transport.stop()
      this.transport.cancel()
    }

    this.players.forEach((player) => player.dispose())
    this.players.clear()

    this.tracks.forEach((track) => track.dispose())
    this.tracks.clear()

    this.audioBuffers.clear()
    if (this.master) this.master.dispose()
  }
}

export function getAudioEngine(): StudioAudioEngine {
  return StudioAudioEngine.getInstance()
}
