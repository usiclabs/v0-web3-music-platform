import { createAdminClient } from "./admin"

const BUCKET_CONFIG = {
  audio: {
    allowedMimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"],
    fileSizeLimit: 50 * 1024 * 1024, // 50MB
  },
  videos: {
    allowedMimeTypes: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska", "video/webm"],
    fileSizeLimit: 500 * 1024 * 1024, // 500MB
  },
  covers: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  thumbnails: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
  },
  avatars: {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
  },
}

/**
 * Ensures a storage bucket exists, creating it if necessary
 */
export async function ensureBucket(bucketName: keyof typeof BUCKET_CONFIG) {
  const supabase = createAdminClient()

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error(`[v0] Error listing buckets:`, listError)
      return false
    }

    const bucketExists = buckets?.some((b) => b.name === bucketName)

    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
      })

      if (error) {
        if (error.message?.includes("already exists")) {
          return true
        }
        console.error(`[v0] Error creating bucket ${bucketName}:`, error.message)
        return false
      }

      console.log(`[v0] Successfully created bucket: ${bucketName}`)
    }

    return true
  } catch (error) {
    console.error(`[v0] Error ensuring bucket ${bucketName}:`, error)
    return false
  }
}

/**
 * Ensures all required storage buckets exist
 */
export async function ensureAllBuckets() {
  const buckets: Array<keyof typeof BUCKET_CONFIG> = ["audio", "videos", "covers", "thumbnails", "avatars"]
  const results = await Promise.all(buckets.map((bucket) => ensureBucket(bucket)))
  return results.every((result) => result === true)
}

export { BUCKET_CONFIG }
