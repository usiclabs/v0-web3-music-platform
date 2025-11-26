"use server"

import { put } from "@vercel/blob"

export async function uploadToBlob(fileName: string, fileData: string, contentType: string) {
  try {
    // Convert base64 data URL to buffer
    const base64Data = fileData.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    const blob = await put(fileName, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN, // Server-side only, no NEXT_PUBLIC_ prefix
      contentType,
    })

    return { url: blob.url, error: null }
  } catch (error) {
    console.error("Blob upload error:", error)
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
