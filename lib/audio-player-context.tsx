"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import type { TrackWithArtist } from "@/types/database"
import { requestChunk, verifyPayment, settlePayment, type X402PaymentPayload } from "@/lib/x402/client"
import { X402_CONFIG, USDC_ADDRESS } from "@/lib/web3/contracts"
import { useWallet } from "@/lib/web3/wallet-context"

interface AudioPlayerContextType {
  currentTrack: TrackWithArtist | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  error: string | null
  paymentRequired: boolean
  currentChunk: number
  unlockedChunks: Set<number>
  showPaymentModal: boolean
  queue: TrackWithArtist[]
  currentTrackIndex: number
  playTrack: (track: TrackWithArtist, queue?: TrackWithArtist[]) => void
  pause: () => void
  resume: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  payForChunk: (chunkIndex: number, onProgress?: (step: string, txHash?: string) => void) => Promise<void>
  closePaymentModal: () => void
  skipTrack: () => void
  playNext: () => void
  playPrevious: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<TrackWithArtist | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.7)
  const [error, setError] = useState<string | null>(null)
  const [paymentRequired, setPaymentRequired] = useState(false)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [unlockedChunks, setUnlockedChunks] = useState<Set<number>>(new Set([0])) // Initialize with first chunk unlocked for free preview
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const paymentJustSucceededRef = useRef(false)
  const { address, signTypedData } = useWallet()

  const [queue, setQueue] = useState<TrackWithArtist[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume
    }

    const audio = audioRef.current

    const handleTimeUpdate = () => {
      const newTime = audio.currentTime
      setCurrentTime(newTime)

      const newChunkIndex = Math.floor(newTime / X402_CONFIG.CHUNK_DURATION)
      if (newChunkIndex !== currentChunk) {
        setCurrentChunk(newChunkIndex)

        if (!unlockedChunks.has(newChunkIndex)) {
          audio.pause()
          setIsPlaying(false)
          setPaymentRequired(true)
          setError(`Payment required for chunk ${newChunkIndex + 1}. Please pay to continue listening.`)
          setShowPaymentModal(true)
        }
      }
    }

    const handleDurationChange = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)
    const handleError = () => {
      console.log("[v0] Audio loading error:", audio.error)
      setError("Failed to load audio. The audio file may not exist or is in an unsupported format.")
      setIsPlaying(false)
    }
    const handleLoadStart = () => {
      setError(null)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("durationchange", handleDurationChange)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("error", handleError)
    audio.addEventListener("loadstart", handleLoadStart)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("durationchange", handleDurationChange)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("error", handleError)
      audio.removeEventListener("loadstart", handleLoadStart)
    }
  }, [volume, currentChunk, unlockedChunks])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
      console.log("[v0] Volume updated to:", volume)
    }
  }, [volume])

  const isMobile = () => {
    if (typeof window === "undefined") return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const payForChunk = async (chunkIndex: number, onProgress?: (step: string, txHash?: string) => void) => {
    if (!currentTrack || !address || !signTypedData) {
      setError("Please connect your wallet to make payments")
      throw new Error("Wallet not connected")
    }

    try {
      setError(null)
      paymentJustSucceededRef.current = false
      console.log("[v0] Requesting payment for chunk", chunkIndex)

      const mobile = isMobile()
      const maxVerifyAttempts = mobile ? 8 : 3
      const maxSettleAttempts = mobile ? 8 : 3
      const baseDelay = mobile ? 3000 : 1000

      console.log("[v0] Mobile device detected:", mobile)
      console.log(
        "[v0] Using retry strategy - verify attempts:",
        maxVerifyAttempts,
        "settle attempts:",
        maxSettleAttempts,
      )

      const paymentInstructions = await requestChunk(currentTrack.id, chunkIndex)
      console.log("[v0] Payment instructions:", paymentInstructions)

      const nonce = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
      const validAfter = Math.floor(Date.now() / 1000)
      const validBefore = validAfter + (mobile ? 14400 : 3600) // 4 hours for mobile, 1 hour for desktop
      const valueInUSDC = Math.floor(Number.parseFloat(paymentInstructions.amount) * 1e6)

      const domain = {
        name: "USD Coin",
        version: "2",
        chainId: 8453,
        verifyingContract: USDC_ADDRESS[8453] as `0x${string}`,
      }

      const types = {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      }

      const message = {
        from: address,
        to: paymentInstructions.recipient,
        value: BigInt(valueInUSDC),
        validAfter: BigInt(validAfter),
        validBefore: BigInt(validBefore),
        nonce: nonce as `0x${string}`,
      }

      console.log("[v0] Message to sign:", {
        from: message.from,
        to: message.to,
        value: message.value.toString(),
        validAfter: message.validAfter.toString(),
        validBefore: message.validBefore.toString(),
        nonce: message.nonce,
      })

      onProgress?.("signing")
      console.log("[v0] Requesting signature from wallet...")

      if (mobile) {
        console.log(
          "[v0] Mobile wallet detected - signature request may take longer. Please be patient and approve the request in your wallet app.",
        )
      }

      const signature = await signTypedData(domain, types, message)

      console.log("[v0] Signature received:", signature)

      const { v, r, s } = splitSignature(signature)

      const paymentPayload: X402PaymentPayload = {
        scheme: paymentInstructions.scheme,
        network: paymentInstructions.network,
        authorization: {
          from: address,
          to: paymentInstructions.recipient,
          value: valueInUSDC.toString(),
          validAfter,
          validBefore,
          nonce,
          v,
          r,
          s,
        },
      }

      console.log("[v0] Payment payload to send:", JSON.stringify(paymentPayload.authorization, null, 2))

      onProgress?.("verifying")
      console.log("[v0] Verifying payment signature...")

      let verified = false
      let verifyAttempts = 0

      while (!verified && verifyAttempts < maxVerifyAttempts) {
        try {
          verified = await verifyPayment(paymentPayload)
          if (!verified) {
            verifyAttempts++
            if (verifyAttempts < maxVerifyAttempts) {
              const delay = baseDelay * Math.pow(1.5, verifyAttempts - 1)
              console.log(`[v0] Verification attempt ${verifyAttempts} failed, retrying in ${delay}ms...`)
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }
        } catch (verifyError) {
          verifyAttempts++
          console.error(`[v0] Verification attempt ${verifyAttempts} error:`, verifyError)
          if (verifyAttempts >= maxVerifyAttempts) {
            throw new Error(
              mobile
                ? "Payment verification failed. Mobile networks can be slow - please check your connection and try again. Your signature is valid for 4 hours."
                : "Payment verification failed after multiple attempts",
            )
          }
          const delay = baseDelay * Math.pow(1.5, verifyAttempts - 1)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      if (!verified) {
        throw new Error("Payment verification failed")
      }

      onProgress?.("settling")
      console.log("[v0] Settling payment...")

      let result
      let settleAttempts = 0

      while (!result && settleAttempts < maxSettleAttempts) {
        try {
          result = await settlePayment(paymentPayload, currentTrack.id, address, chunkIndex)
          if (!result.success) {
            settleAttempts++
            if (settleAttempts < maxSettleAttempts) {
              const delay = baseDelay * 2 * Math.pow(1.5, settleAttempts - 1)
              console.log(`[v0] Settlement attempt ${settleAttempts} failed, retrying in ${delay}ms...`)
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }
        } catch (settleError) {
          settleAttempts++
          console.error(`[v0] Settlement attempt ${settleAttempts} error:`, settleError)

          const errorMessage = settleError instanceof Error ? settleError.message : ""
          const isNetworkError =
            errorMessage.includes("fetch") || errorMessage.includes("network") || errorMessage.includes("timeout")

          if (
            errorMessage.includes("Insufficient USDC balance") ||
            errorMessage.includes("transfer amount exceeds balance")
          ) {
            throw new Error(
              "Insufficient USDC balance. Please add USDC to your wallet to play this track. You can buy USDC on Base using Coinbase or Uniswap.",
            )
          }

          if (settleAttempts >= maxSettleAttempts) {
            if (mobile && isNetworkError) {
              throw new Error(
                "Payment settlement timed out on mobile network. Your payment signature is valid for 4 hours - please try again when you have a better connection.",
              )
            }
            throw new Error(
              "Payment settlement failed after multiple attempts. Your payment may still be processing - please wait a moment and check your transaction history.",
            )
          }

          const delay = baseDelay * 2 * Math.pow(1.5, settleAttempts - 1)
          console.log(`[v0] Retrying settlement in ${delay}ms...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }

      if (result?.success) {
        console.log("[v0] Payment successful! Unlocking chunk", chunkIndex)
        paymentJustSucceededRef.current = true
        setUnlockedChunks((prev) => new Set([...prev, chunkIndex]))

        if (currentTrack.unlock_type === "full_song") {
          const totalChunks = Math.ceil(currentTrack.duration / X402_CONFIG.CHUNK_DURATION)
          const allChunks = new Set(Array.from({ length: totalChunks }, (_, i) => i))
          setUnlockedChunks(allChunks)
          console.log("[v0] Full song unlocked - all", totalChunks, "chunks available")
        }

        setPaymentRequired(false)
        setError(null)
        setShowPaymentModal(false)

        onProgress?.("complete", result.txHash)

        if (audioRef.current && currentTrack) {
          audioRef.current.play().catch((err) => {
            console.log("[v0] Autoplay after payment blocked:", err)
          })
          setIsPlaying(true)
        }
      }
    } catch (err) {
      console.error("[v0] Payment error:", err)
      paymentJustSucceededRef.current = false
      const errorMessage = err instanceof Error ? err.message : "Payment failed. Please try again."
      setError(errorMessage)
      throw err
    }
  }

  const playTrack = (track: TrackWithArtist, newQueue?: TrackWithArtist[]) => {
    if (!audioRef.current) return

    setError(null)
    setPaymentRequired(false)

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue)
      const trackIndex = newQueue.findIndex((t) => t.id === track.id)
      setCurrentTrackIndex(trackIndex >= 0 ? trackIndex : 0)
    } else if (queue.length > 0) {
      // If queue already exists, find track in existing queue
      const trackIndex = queue.findIndex((t) => t.id === track.id)
      if (trackIndex >= 0) {
        setCurrentTrackIndex(trackIndex)
      }
    } else {
      // No queue provided, create single-track queue
      setQueue([track])
      setCurrentTrackIndex(0)
    }

    if (currentTrack?.id !== track.id) {
      audioRef.current.src = track.audio_url
      setCurrentTrack(track)
      setCurrentTime(0)
      setCurrentChunk(0)

      const isOwnTrack = address && track.artist_id.toLowerCase() === address.toLowerCase()

      if (isOwnTrack) {
        const totalChunks = Math.ceil(track.duration / X402_CONFIG.CHUNK_DURATION)
        const allChunks = new Set(Array.from({ length: totalChunks }, (_, i) => i))
        setUnlockedChunks(allChunks)

        audioRef.current.play().catch((err) => {
          console.log("[v0] Autoplay blocked:", err)
          setError("Press play to listen to your track")
        })
        setIsPlaying(true)
        return
      }

      setUnlockedChunks(new Set([0]))

      audioRef.current.play().catch((err) => {
        console.log("[v0] Autoplay blocked:", err)
        setError("Press play to start the free preview")
      })
      setIsPlaying(true)
      return
    }

    if (!unlockedChunks.has(currentChunk)) {
      setPaymentRequired(true)
      setShowPaymentModal(true)
      return
    }

    audioRef.current.play().catch((err) => {
      console.log("[v0] Play error:", err)
      setError("Failed to play audio. Please try again.")
      setIsPlaying(false)
    })
    setIsPlaying(true)
  }

  const pause = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }

  const resume = () => {
    if (!audioRef.current) return

    if (!unlockedChunks.has(currentChunk)) {
      console.log("[v0] Cannot resume - chunk not unlocked")
      setPaymentRequired(true)
      setShowPaymentModal(true)
      setError(`Payment required for chunk ${currentChunk + 1}`)
      return
    }

    audioRef.current.play().catch((err) => {
      console.log("[v0] Resume error:", err)
      setError("Failed to resume audio. Please try again.")
      setIsPlaying(false)
    })
    setIsPlaying(true)
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
  }

  const closePaymentModal = () => {
    setShowPaymentModal(false)

    if (paymentJustSucceededRef.current) {
      setPaymentRequired(false)
      setError(null)
      console.log("[v0] Payment modal closed after successful payment - continuing playback")
      return
    }

    if (!unlockedChunks.has(currentChunk)) {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsPlaying(false)
      setError("Payment required to continue listening")
      console.log("[v0] Payment modal closed without payment - playback paused")
    } else {
      setPaymentRequired(false)
      setError(null)
      console.log("[v0] Payment modal closed - chunk already unlocked")
    }
  }

  const skipTrack = () => {
    console.log("[v0] Skipping track")
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setShowPaymentModal(false)
    setPaymentRequired(false)
    setError(null)

    if (queue.length > 0 && currentTrackIndex < queue.length - 1) {
      console.log("[v0] Auto-playing next track in queue")
      playNext()
    } else {
      console.log("[v0] No more tracks in queue, stopping playback")
      setCurrentTrack(null)
      setCurrentTime(0)
      setCurrentChunk(0)
      setUnlockedChunks(new Set([0]))
    }
  }

  const playNext = () => {
    console.log("[v0] Playing next track in queue")
    if (queue.length === 0) {
      console.log("[v0] No queue available")
      skipTrack()
      return
    }

    const nextIndex = currentTrackIndex + 1
    if (nextIndex >= queue.length) {
      console.log("[v0] Reached end of queue")
      skipTrack()
      return
    }

    const nextTrack = queue[nextIndex]
    console.log("[v0] Playing next track:", nextTrack.title)
    playTrack(nextTrack)
  }

  const playPrevious = () => {
    console.log("[v0] Playing previous track in queue")
    if (queue.length === 0 || currentTrackIndex <= 0) {
      console.log("[v0] No previous track available")
      return
    }

    const prevTrack = queue[currentTrackIndex - 1]
    console.log("[v0] Playing previous track:", prevTrack.title)
    playTrack(prevTrack)
  }

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        error,
        paymentRequired,
        currentChunk,
        unlockedChunks,
        showPaymentModal,
        queue,
        currentTrackIndex,
        playTrack,
        pause,
        resume,
        seek,
        setVolume,
        payForChunk,
        closePaymentModal,
        skipTrack,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

function splitSignature(signature: string): { v: number; r: string; s: string } {
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature

  console.log("[v0] Processing signature of length:", sig.length)
  console.log("[v0] Raw signature:", signature)

  let r: string
  let s: string
  let v: number

  if (sig.length === 130) {
    r = `0x${sig.slice(0, 64)}`
    s = `0x${sig.slice(64, 128)}`
    v = Number.parseInt(sig.slice(128, 130), 16)
    console.log("[v0] Standard signature format (130 chars)")
  } else if (sig.length === 128) {
    r = `0x${sig.slice(0, 64)}`
    s = `0x${sig.slice(64, 128)}`
    const sValue = BigInt(s)
    const secp256k1N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141")
    v = sValue > secp256k1N / 2n ? 28 : 27
    console.log("[v0] Compact signature format (128 chars), inferred v:", v)
  } else if (sig.length > 130) {
    console.log("[v0] Extended signature format detected:", sig.length, "chars")

    try {
      r = `0x${sig.slice(0, 64)}`
      s = `0x${sig.slice(64, 128)}`
      v = Number.parseInt(sig.slice(128, 130), 16)

      if (!/^0x[0-9a-fA-F]{64}$/.test(r) || !/^0x[0-9a-fA-F]{64}$/.test(s)) {
        throw new Error("Invalid r or s format")
      }

      console.log("[v0] Extracted signature from first 130 chars of extended format")
    } catch (e) {
      console.log("[v0] First 130 chars failed, trying last 130 chars")
      const offset = sig.length - 130
      r = `0x${sig.slice(offset, offset + 64)}`
      s = `0x${sig.slice(offset + 64, offset + 128)}`
      v = Number.parseInt(sig.slice(offset + 128, offset + 130), 16)

      if (!/^0x[0-9a-fA-F]{64}$/.test(r) || !/^0x[0-9a-fA-F]{64}$/.test(s)) {
        console.log("[v0] Last 130 chars failed, trying middle section")
        const prefixLength = Math.floor((sig.length - 130) / 2)
        r = `0x${sig.slice(prefixLength, prefixLength + 64)}`
        s = `0x${sig.slice(prefixLength + 64, prefixLength + 128)}`
        v = Number.parseInt(sig.slice(prefixLength + 128, prefixLength + 130), 16)
      }
    }
  } else {
    console.error("[v0] Signature too short:", sig.length, "chars")
    console.error("[v0] Full signature:", signature)
    throw new Error(`Invalid signature format: signature too short (${sig.length} chars, need at least 128)`)
  }

  if (v < 27) {
    console.log("[v0] Normalizing v from", v, "to", v + 27)
    v = v + 27
  }

  if (v !== 27 && v !== 28) {
    console.warn("[v0] Unusual v value:", v, "- attempting to normalize")
    v = v % 2 === 0 ? 28 : 27
  }

  console.log("[v0] Successfully parsed signature - r:", r.slice(0, 10) + "...", "s:", s.slice(0, 10) + "...", "v:", v)

  return { v, r, s }
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider")
  }
  return context
}
