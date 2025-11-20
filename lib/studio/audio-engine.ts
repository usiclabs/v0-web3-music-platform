import * as Tone from "tone"

export class StudioAudioEngine {
  private static instance: StudioAudioEngine
  public transport: typeof Tone.Transport
  public master: Tone.Channel
  private tracks: Map<string, Tone.Channel>
  private audioBuffers: Map<string, Tone.ToneAudioBuffer>
  private players: Map<string, Tone.Player>
  private isInitialized = false

  private constructor() {
    this.transport = Tone.Transport
    this.master = new Tone.Channel({ volume: 0 }).toDestination()
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

    try {
      await Tone.start()
      console.log("[v0] Studio Audio Engine initialized")
      this.isInitialized = true
    } catch (error) {
      console.error("[v0] Failed to initialize audio engine:", error)
      throw error
    }
  }

  // Transport controls
  public play() {
    if (!this.isInitialized) {
      throw new Error("Audio engine not initialized")
    }
    this.transport.start()
  }

  public pause() {
    this.transport.pause()
  }

  public stop() {
    this.transport.stop()
    this.transport.position = 0
  }

  public seek(time: number) {
    this.transport.seconds = time
  }

  public get currentTime(): number {
    return this.transport.seconds
  }

  public setBPM(bpm: number) {
    this.transport.bpm.value = bpm
  }

  public setLoop(start: number, end: number) {
    this.transport.loop = true
    this.transport.loopStart = start
    this.transport.loopEnd = end
  }

  public clearLoop() {
    this.transport.loop = false
  }

  // Track management
  public createTrack(trackId: string, volume = 0.7, pan = 0): Tone.Channel {
    const channel = new Tone.Channel({ volume: Tone.gainToDb(volume), pan }).connect(this.master)
    this.tracks.set(trackId, channel)
    return channel
  }

  public getTrack(trackId: string): Tone.Channel | undefined {
    return this.tracks.get(trackId)
  }

  public deleteTrack(trackId: string) {
    const track = this.tracks.get(trackId)
    if (track) {
      track.dispose()
      this.tracks.delete(trackId)
    }
  }

  public setTrackVolume(trackId: string, volume: number) {
    const track = this.tracks.get(trackId)
    if (track) {
      track.volume.value = Tone.gainToDb(volume)
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
  public async loadAudioBuffer(url: string, bufferId: string): Promise<Tone.ToneAudioBuffer> {
    try {
      const buffer = new Tone.ToneAudioBuffer(url)
      await buffer.load()
      this.audioBuffers.set(bufferId, buffer)
      return buffer
    } catch (error) {
      console.error(`[v0] Failed to load audio buffer ${bufferId}:`, error)
      throw error
    }
  }

  public createPlayer(
    regionId: string,
    trackId: string,
    audioUrl: string,
    startTime: number,
    offset: number,
    duration: number,
  ): Tone.Player {
    const track = this.getTrack(trackId)
    if (!track) {
      throw new Error(`Track ${trackId} not found`)
    }

    const player = new Tone.Player(audioUrl).connect(track)
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
  public async startRecording(trackId: string): Promise<MediaRecorder> {
    const track = this.tracks.get(trackId)
    if (!track) {
      throw new Error(`Track ${trackId} not found`)
    }

    const dest = Tone.context.createMediaStreamDestination()
    track.connect(dest as any)

    const recorder = new MediaRecorder(dest.stream)
    return recorder
  }

  // Export/Render
  public async renderToBuffer(duration: number): Promise<AudioBuffer> {
    const offline = new Tone.Offline(async () => {
      this.transport.start()
    }, duration)

    return offline
  }

  // Cleanup
  public dispose() {
    this.transport.stop()
    this.transport.cancel()

    this.players.forEach((player) => player.dispose())
    this.players.clear()

    this.tracks.forEach((track) => track.dispose())
    this.tracks.clear()

    this.audioBuffers.clear()
    this.master.dispose()
  }
}

export const audioEngine = StudioAudioEngine.getInstance()
