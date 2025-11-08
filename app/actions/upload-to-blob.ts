"use server"

import { put } from "@vercel/blob"

export async function uploadToBlob(
  filename: string,
  fileData: string, // base64 encoded file data
): Promise<{ url: string; error?: string }> {
  try {
    // Convert base64 to buffer
    const base64Data = fileData.split(",")[1]
    const buffer = Buffer.from(base64Data, "base64")

    // Upload to Vercel Blob using server-side token
    const blob = await put(filename, buffer, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return { url: blob.url }
  } catch (error) {
    console.error("[Upload to Blob] Error:", error)
    return { url: "", error: "Failed to upload file" }
  }
}
