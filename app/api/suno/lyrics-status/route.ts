import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const apiKey = process.env.SUNO_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Suno API key not configured" }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const response = await fetch(`https://api.sunoapi.org/api/v1/generate/lyrics/record-info?taskId=${taskId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      return NextResponse.json({ error: "Failed to check lyrics status" }, { status: response.status })
    }

    const data = await response.json()
    const taskData = data.data

    if (taskData && taskData.status === "SUCCESS" && taskData.data) {
      return NextResponse.json({
        status: "complete",
        lyrics: taskData.data.text || taskData.data.lyrics,
      })
    } else if (taskData && taskData.status && taskData.status.includes("FAILED")) {
      return NextResponse.json({
        status: "failed",
        error: "Lyrics generation failed. Please try again with a different prompt.",
      })
    }

    return NextResponse.json({ status: "processing" })
  } catch (error) {
    console.error("Lyrics status check error:", error)
    return NextResponse.json({ error: "Failed to check lyrics status" }, { status: 500 })
  }
}
