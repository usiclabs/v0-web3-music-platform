/**
 * Livepeer Server-Side Configuration
 *
 * Livepeer v4+ React components work without client initialization.
 * Only server-side operations need the API key.
 */

// Server-side configuration (used in API routes only)
export const LIVEPEER_API_KEY = process.env.LIVEPEER_API_KEY || ""
export const LIVEPEER_API_URL = "https://livepeer.studio/api"

/**
 * Create a stream on Livepeer (SERVER-SIDE ONLY)
 * Uses the PRIVATE API key with full permissions
 */
export async function createLivepeerStream(name: string) {
  if (!LIVEPEER_API_KEY) {
    throw new Error("LIVEPEER_API_KEY is not configured")
  }

  const response = await fetch(`${LIVEPEER_API_URL}/stream`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LIVEPEER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      profiles: [
        {
          name: "720p",
          bitrate: 2000000,
          fps: 30,
          width: 1280,
          height: 720,
        },
        {
          name: "480p",
          bitrate: 1000000,
          fps: 30,
          width: 854,
          height: 480,
        },
        {
          name: "360p",
          bitrate: 500000,
          fps: 30,
          width: 640,
          height: 360,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to create Livepeer stream")
  }

  return response.json()
}

/**
 * Get stream info from Livepeer (SERVER-SIDE ONLY)
 */
export async function getLivepeerStream(streamId: string) {
  if (!LIVEPEER_API_KEY) {
    throw new Error("LIVEPEER_API_KEY is not configured")
  }

  const response = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
    headers: {
      Authorization: `Bearer ${LIVEPEER_API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get Livepeer stream")
  }

  return response.json()
}
