"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import type { TrackWithArtist } from "@/types/database"
import { requestChunk, verifyPayment } from "@/lib/x402/client"
import { X402_CONFIG } from "@/lib/web3/contracts"
import { useWallet } from "@/lib/web3/wallet-context"
import { useEIP3009 } from "@/lib/web3/use-eip3009"
import { submitAuthorization, getGasSubsidyInfo } from "@/lib/web3/eip3009-client"

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
  gasSubsidyAvailable: boolean
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
  const { signTransferAuthorization, isSigning, isSmartWallet, supportsGaslessPayments } = useEIP3009()
  const [gasSubsidyAvailable, setGasSubsidyAvailable] = useState(true)

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

        if (currentTrack && address) {
          logStreamActivity(currentTrack.id, address, newChunkIndex)
        }

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

  useEffect(() => {
    const checkSubsidy = async () => {
      if (address) {
        const subsidyInfo = await getGasSubsidyInfo()
        setGasSubsidyAvailable(subsidyInfo.available)
      }
    }
    checkSubsidy()
  }, [address])

  const isMobile = () => {
    if (typeof window === "undefined") return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  const payForChunk = async (chunkIndex: number, onProgress?: (step: string, txHash?: string) => void) => {
    if (!currentTrack || !address || !signTypedData) {
      setError("Please connect your wallet to make payments")
      throw new Error("Wallet not connected")
    }

    if (isSmartWallet && !supportsGaslessPayments) {
      console.log("[v0] ❌ Base App smart wallet detected - EIP-3009 not supported")
      const errorMsg = 
        "Your Base App smart wallet doesn't support EIP-3009 gasless payments.\n\n" +
        "EIP-3009's transferWithAuthorization only works with standard wallets (EOA), not smart contract wallets.\n\n" +
        "To continue:\n" +
        "1. Switch to a standard wallet like MetaMask, or\n" +
        "2. Wait for our upcoming smart wallet payment integration\n\n" +
        "Reference: https://eips.ethereum.org/EIPS/eip-3009"
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    try {
      setError(null)
      paymentJustSucceededRef.current = false
      console.log("[v0] Requesting payment for chunk", chunkIndex)

      const walletType = detectWalletType()
      console.log("[v0] Detected wallet type:", walletType)

      const mobile = isMobile()
      console.log("[v0] Mobile device detected:", mobile)

      const paymentInstructions = await requestChunk(currentTrack.id, chunkIndex)
      console.log("[v0] Payment instructions:", paymentInstructions)

      onProgress?.("signing")
      console.log("[v0] Creating payment authorization...")

      const valueInUSDC = Math.floor(Number.parseFloat(paymentInstructions.amount) * 1e6)

      const validityPeriod = mobile ? 14400 : 3600 // 4 hours for mobile, 1 hour for desktop

      let signedAuth
      const maxRetries = mobile ? 3 : 1
      let lastError: Error | null = null

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            const backoffMs = 2000 * (attempt - 1) // 2s, 4s backoff
            console.log(`[v0] Retry attempt ${attempt}/${maxRetries} after ${backoffMs}ms delay`)
            onProgress?.("signing", undefined)
            await new Promise((resolve) => setTimeout(resolve, backoffMs))
          }

          signedAuth = await signTransferAuthorization(
            paymentInstructions.recipient as `0x${string}`,
            BigInt(valueInUSDC),
            0n, // validAfter: now
            BigInt(Math.floor(Date.now() / 1000) + validityPeriod),
          )

          console.log(`[v0] Authorization signed successfully on attempt ${attempt}`)
          break // Success, exit retry loop
        } catch (signError) {
          lastError = signError as Error
          console.error(`[v0] Signature attempt ${attempt} failed:`, signError)
          
          if (attempt === maxRetries) {
            // All retries exhausted
            throw lastError
          }
        }
      }

      if (!signedAuth) {
        throw lastError || new Error("Failed to get signature after retries")
      }

      console.log("[v0] Authorization signed successfully")

      onProgress?.("verifying")
      console.log("[v0] Submitting payment...")

      const submitTimeout = mobile ? 60000 : 30000
      
      const submitPromise = submitAuthorization(signedAuth, {
        trackId: currentTrack.id,
        chunkIndex,
        userId: address,
        purpose: "x402_streaming",
        walletType,
        isMobile: mobile,
      })

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Payment submission timeout - please try again")), submitTimeout)
      })

      const result = await Promise.race([submitPromise, timeoutPromise])

      if (!result.success) {
        throw new Error(result.error || "Failed to submit payment")
      }

      if (result.usedFallback) {
        console.log("[v0] Payment successful via direct transfer (user paid gas)! Transaction:", result.txHash)
      } else {
        console.log("[v0] Gasless payment successful! Transaction:", result.txHash)
      }

      onProgress?.("settling")
      console.log("[v0] Verifying payment signature...")

      const paymentPayload = {
        scheme: paymentInstructions.scheme,
        network: paymentInstructions.network,
        authorization: {
          from: signedAuth.authorization.from,
          to: signedAuth.authorization.to,
          value: signedAuth.authorization.value.toString(),
          validAfter: Number(signedAuth.authorization.validAfter),
          validBefore: Number(signedAuth.authorization.validBefore),
          nonce: signedAuth.authorization.nonce,
          v: signedAuth.v,
          r: signedAuth.r,
          s: signedAuth.s,
        },
      }

      const verified = await verifyPayment(paymentPayload)
      if (!verified) {
        throw new Error("Payment verification failed")
      }

      console.log("[v0] Payment verified! Unlocking chunk", chunkIndex)

      try {
        await fetch("/api/x402/record-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId: currentTrack.id,
            userId: address,
            chunkIndex,
            txHash: result.txHash,
            amount: valueInUSDC,
          }),
        })
      } catch (err) {
        console.warn("[v0] Failed to record payment in database:", err)
        // Don't throw - recording failure shouldn't block playback
      }

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

      getGasSubsidyInfo()
        .then((subsidyInfo) => setGasSubsidyAvailable(subsidyInfo.available))
        .catch((err) => console.warn("[v0] Failed to check gas subsidy:", err))

      if (audioRef.current && currentTrack) {
        audioRef.current.play().catch((err) => {
          console.log("[v0] Autoplay after payment blocked:", err)
        })
        setIsPlaying(true)
      }
    } catch (err) {
      console.error("[v0] Payment error:", err)
      paymentJustSucceededRef.current = false
      
      let errorMessage = "Payment failed. Please try again."
      if (err instanceof Error) {
        if (err.message.includes("timeout") || err.message.includes("Timeout")) {
          errorMessage = mobile 
            ? "Payment timeout. On mobile, please ensure MetaMask is open and check for pending signature requests. You may need to switch to the MetaMask app manually."
            : "Payment timeout. Please check your wallet and try again."
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      throw err
    }
  }

  const playTrack = (track: TrackWithArtist, newQueue?: TrackWithArtist[]) => {
    if (!audioRef.current) return

    console.log("[v0] Audio player received track:", {
      id: track.id,
      title: track.title,
      audio_url: track.audio_url,
      audio_url_type: typeof track.audio_url,
      audio_url_length: track.audio_url?.length,
      audio_url_valid: track.audio_url && track.audio_url.startsWith("http"),
      token_gated_streaming: track.token_gated_streaming,
      required_token_balance: track.required_token_balance,
      coin_address: track.coin_address,
    })

    setError(null)
    setPaymentRequired(false)

    if (newQueue && newQueue.length > 0) {
      setQueue(newQueue)
      const trackIndex = newQueue.findIndex((t) => t.id === track.id)
      setCurrentTrackIndex(trackIndex >= 0 ? trackIndex : 0)
    } else if (queue.length > 0) {
      const trackIndex = queue.findIndex((t) => t.id === track.id)
      if (trackIndex >= 0) {
        setCurrentTrackIndex(trackIndex)
      }
    } else {
      setQueue([track])
      setCurrentTrackIndex(0)
    }

    if (currentTrack?.id !== track.id) {
      if (!track.audio_url || track.audio_url.trim() === "") {
        console.error("[v0] Invalid audio URL - empty or null")
        setError("This track has no audio file. Please upload an audio file for this track.")
        setIsPlaying(false)
        return
      }

      if (!track.audio_url.startsWith("http")) {
        console.error("[v0] Invalid audio URL - not a valid URL:", track.audio_url)
        setError("This track has an invalid audio URL. Please check the audio file URL.")
        setIsPlaying(false)
        return
      }

      console.log("[v0] Setting audio source to:", track.audio_url)

      audioRef.current.src = track.audio_url
      setCurrentTrack(track)
      setCurrentTime(0)
      setCurrentChunk(0)

      const isOwnTrack = address && track.artist_id && track.artist_id.toLowerCase() === address.toLowerCase()

      if (isOwnTrack) {
        const totalChunks = Math.ceil(track.duration / X402_CONFIG.CHUNK_DURATION)
        const allChunks = new Set(Array.from({ length: totalChunks }, (_, i) => i))
        setUnlockedChunks(allChunks)

        if (address) {
          logStreamActivity(track.id, address, 0)
        }

        audioRef.current.play().catch((err) => {
          console.log("[v0] Autoplay blocked:", err)
          setError("Press play to listen to your track")
        })
        setIsPlaying(true)
        return
      }

      if (track.token_gated_streaming && track.coin_address && address) {
        console.log("[v0] Checking token balance for token-gated streaming...")

        checkTokenBalance(track, address)
          .then((hasEnoughTokens) => {
            if (hasEnoughTokens) {
              console.log("[v0] User has enough tokens - unlocking all chunks for free!")
              const totalChunks = Math.ceil(track.duration / X402_CONFIG.CHUNK_DURATION)
              const allChunks = new Set(Array.from({ length: totalChunks }, (_, i) => i))
              setUnlockedChunks(allChunks)

              logStreamActivity(track.id, address, 0)
            } else {
              console.log("[v0] User doesn't have enough tokens - using X402 payment")
              setUnlockedChunks(new Set([0]))

              if (address) {
                logStreamActivity(track.id, address, 0)
              }
            }
          })
          .catch((err) => {
            console.error("[v0] Error checking token balance:", err)
            setUnlockedChunks(new Set([0]))

            if (address) {
              logStreamActivity(track.id, address, 0)
            }
          })
      } else {
        setUnlockedChunks(new Set([0]))

        if (address) {
          logStreamActivity(track.id, address, 0)
        }
      }

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
        gasSubsidyAvailable,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

// Helper function to check token balance
async function checkTokenBalance(track: TrackWithArtist, userAddress: string): Promise<boolean> {
  if (!track.coin_address || !track.required_token_balance) {
    return false
  }

  try {
    const response = await fetch(`/api/tokens/balance?address=${userAddress}&tokenAddress=${track.coin_address}`)
    if (!response.ok) {
      console.error("[v0] Failed to fetch token balance")
      return false
    }

    const { balance } = await response.json()
    const balanceNum = Number.parseFloat(balance)
    const requiredNum = Number.parseFloat(track.required_token_balance.toString())

    console.log("[v0] Token balance check:", {
      balance: balanceNum,
      required: requiredNum,
      hasEnough: balanceNum >= requiredNum,
    })

    return balanceNum >= requiredNum
  } catch (err) {
    console.error("[v0] Error checking token balance:", err)
    return false
  }
}

const detectWalletType = (): "coinbase" | "metamask" | "walletconnect" | "unknown" => {
  if (typeof window === "undefined") return "unknown"

  if (window.ethereum?.isCoinbaseWallet || window.coinbaseWalletExtension) {
    return "coinbase"
  }

  if (window.ethereum?.isMetaMask) {
    return "metamask"
  }

  if (window.ethereum?.isWalletConnect) {
    return "walletconnect"
  }

  return "unknown"
}

function splitSignature(signature: string, walletType?: string): { v: number; r: string; s: string } {
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature

  console.log("[v0] Processing signature of length:", sig.length)
  console.log("[v0] Wallet type:", walletType)
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
        throw new Error("Invalid r or s format in first 130 chars")
      }

      console.log("[v0] Successfully extracted from first 130 chars")
    } catch (e) {
      console.log("[v0] First 130 chars failed, trying last 130 chars")

      const offset = sig.length - 130
      r = `0x${sig.slice(offset, offset + 64)}`
      s = `0x${sig.slice(offset + 64, offset + 128)}`
      v = Number.parseInt(sig.slice(offset + 128, offset + 130), 16)

      console.log("[v0] Last 130 chars failed, trying to find signature in middle")

      let found = false
      for (let i = 0; i < sig.length - 130; i += 2) {
        const testR = `0x${sig.slice(i, i + 64)}`
        const testS = `0x${sig.slice(i + 64, i + 128)}`

        if (/^0x[0-9a-fA-F]{64}$/.test(testR) && /^0x[0-9a-fA-F]{64}$/.test(testS)) {
          r = testR
          s = testS
          v = Number.parseInt(sig.slice(i + 128, i + 130), 16)
          console.log("[v0] Found valid signature at offset:", i)
          found = true
          break
        }
      }

      if (!found) {
        throw new Error("Could not find valid signature components in extended format")
      }
    }
  } else {
    console.error("[v0] Signature too short:", sig.length, "chars")
    console.error("[v0] Full signature:", signature)
    throw new Error(
      `Invalid signature format: signature too short (${sig.length} chars, need at least 128). ` +
        `This may be a wallet compatibility issue. Please try using MetaMask, Trust Wallet, or Rainbow Wallet.`,
    )
  }

  if (v < 27) {
    console.log("[v0] Normalizing v from", v, "to", v + 27)
    v = v + 27
  }

  if (v !== 27 && v !== 28) {
    console.warn("[v0] Unusual v value:", v, "- attempting to normalize")
    v = v % 2 === 0 ? 28 : 27
    console.log("[v0] Normalized v to:", v)
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(r)) {
    throw new Error(`Invalid r component: ${r}`)
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(s)) {
    throw new Error(`Invalid s component: ${s}`)
  }
  if (v !== 27 && v !== 28) {
    throw new Error(`Invalid v component: ${v} (must be 27 or 28)`)
  }

  console.log("[v0] Successfully parsed signature:")
  console.log("[v0]   r:", r.slice(0, 10) + "...")
  console.log("[v0]   s:", s.slice(0, 10) + "...")
  console.log("[v0]   v:", v)

  return { v, r, s }
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider")
  }
  return context
}

async function logStreamActivity(trackId: string, listenerAddress: string, chunkIndex: number) {
  try {
    await fetch("/api/streams/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackId,
        listenerAddress: listenerAddress.toLowerCase(),
        chunkIndex,
        streamType: chunkIndex === 0 ? "preview" : "continued",
      }),
    })
  } catch (err) {
    console.warn("[v0] Failed to log stream activity:", err)
    // Don't throw - logging should not block playback
  }
}
