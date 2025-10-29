import { NextResponse } from "next/server"

export async function GET() {
  const hasKey = !!process.env.SUNO_API_KEY

  return NextResponse.json({ configured: hasKey })
}
