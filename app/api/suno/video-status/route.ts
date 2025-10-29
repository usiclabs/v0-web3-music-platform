import { type NextRequest, NextResponse } from "next/server"

const SUNO_API_KEY = process.env.SUNO_API_KEY
const SUNO_API_BASE = "https://api.sunoapi.org/api/v1"

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

    const response = await fetch(`${SUNO_API_BASE}/mp4/record-info?taskId=${taskId}`, {
      headers: {
        Authorization: `Bearer ${SUNO_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      return NextResponse.json({ error: "Failed to check video status" }, { status: response.status })
    }

    const data = await response.json()

    if (data.code !== 200) {
      return NextResponse.json({ status: "failed", error: data.msg }, { status: 200 })
    }

    const taskData = data.data

    if (taskData && taskData.successFlag === "SUCCESS" && taskData.response?.videoUrl) {
      return NextResponse.json({
        status: "complete",
        videoUrl: taskData.response.videoUrl,
      })
    }

    if (taskData && taskData.errorCode) {
      return NextResponse.json({
        status: "failed",
        error: taskData.errorMessage || "Video generation failed",
      })
    }

    return NextResponse.json({ status: "processing" })
  } catch (error) {
    console.error("Video status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
