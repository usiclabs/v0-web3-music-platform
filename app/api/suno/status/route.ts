import { type NextRequest, NextResponse } from "next/server"

const SUNO_API_KEY = process.env.SUNO_API_KEY
const SUNO_API_BASE = "https://api.sunoapi.org/api/v1"

function getErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    CREATE_TASK_FAILED: "Failed to create generation task. Please try again.",
    GENERATE_AUDIO_FAILED:
      "Audio generation failed. This could be due to content restrictions or API limits. Try a different prompt or style.",
    CALLBACK_EXCEPTION: "Generation completed but callback failed. Please check the status manually.",
    SENSITIVE_WORD_ERROR: "Your prompt contains restricted content. Please modify your description and try again.",
  }

  return errorMessages[errorCode] || `Generation failed with error: ${errorCode}`
}

export async function GET(request: NextRequest) {
  try {
    if (!SUNO_API_KEY) {
      return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    console.log("[v0] Checking status for taskId:", taskId)

    const response = await fetch(`${SUNO_API_BASE}/generate/record-info?taskId=${taskId}`, {
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Suno API error:", errorText)
      return NextResponse.json({ error: "Failed to check status" }, { status: response.status })
    }

    const data = await response.json()

    console.log("[v0] Suno API response:", JSON.stringify(data, null, 2))

    if (data.code !== 200) {
      console.log("[v0] API returned non-200 code:", data.code, data.msg)
      return NextResponse.json({ status: "failed", error: data.msg }, { status: 200 })
    }

    // The response could be structured as:
    // 1. { code: 200, data: { status: "SUCCESS", data: [...] } }
    // 2. { code: 200, data: { status: "SUCCESS", tracks: [...] } }
    // 3. { code: 200, data: [...] } (direct array)
    const taskData = data.data
    let tracks = null
    let status = null

    // Check if data.data is an object with status field
    if (taskData && typeof taskData === "object" && !Array.isArray(taskData)) {
      status = taskData.status
      tracks = taskData.data || taskData.tracks || taskData.response?.sunoData || null
      console.log("[v0] Parsed status:", status)
      console.log("[v0] Found tracks:", tracks ? tracks.length : 0)
    } else if (Array.isArray(taskData)) {
      // If data.data is directly an array of tracks
      tracks = taskData
      status = tracks.length > 0 ? "SUCCESS" : "PENDING"
      console.log("[v0] Direct array response with", tracks.length, "tracks")
    }

    console.log("[v0] Final status:", status)
    console.log("[v0] Final tracks:", tracks ? JSON.stringify(tracks, null, 2) : "none")

    if (status === "SUCCESS" && tracks && tracks.length > 0) {
      console.log("[v0] Generation complete! Found", tracks.length, "tracks")

      const formattedTracks = tracks.map((track: any) => ({
        taskId,
        audioId: track.id,
        title: track.title || "Untitled",
        audioUrl: track.audio_url || track.audioUrl,
        imageUrl: track.image_url || track.imageUrl || track.image_large_url,
        videoUrl: track.video_url || track.videoUrl,
        duration: track.duration || 180,
        prompt: track.gpt_description_prompt || track.prompt || "",
        style: track.tags || track.style || "",
        lyrics: track.lyric || track.lyrics || "",
      }))

      return NextResponse.json({
        status: "complete",
        tracks: formattedTracks,
        data: formattedTracks[0], // Keep for backward compatibility
      })
    }

    // Check for error states
    if (
      status === "CREATE_TASK_FAILED" ||
      status === "GENERATE_AUDIO_FAILED" ||
      status === "CALLBACK_EXCEPTION" ||
      status === "SENSITIVE_WORD_ERROR"
    ) {
      console.log("[v0] Generation failed with status:", status)
      return NextResponse.json({
        status: "failed",
        error: getErrorMessage(status),
        errorCode: status,
      })
    }

    // Still processing (PENDING, TEXT_SUCCESS, FIRST_SUCCESS)
    console.log("[v0] Still processing, current status:", status || "unknown")
    return NextResponse.json({ status: "processing" })
  } catch (error) {
    console.error("[v0] Status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
