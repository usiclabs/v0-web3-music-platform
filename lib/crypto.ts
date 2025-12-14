import crypto from "crypto"

/**
 * Encryption utilities for storing sensitive data like private keys
 * Uses AES-256-CBC for encryption with a configurable key
 */

const getEncryptionKey = (): Buffer => {
  const key = process.env.WALLET_ENCRYPTION_KEY || "default-key-change-in-production-32b"
  // Ensure key is 32 bytes for AES-256
  const keyBuffer = Buffer.from(key.padEnd(32, "0").substring(0, 32), "utf8")
  return keyBuffer
}

/**
 * Encrypt data using AES-256-CBC
 */
export function encrypt(data: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv)

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Prepend IV to encrypted data (IV doesn't need to be secret)
    return iv.toString("hex") + ":" + encrypted
  } catch (error) {
    console.error("[Crypto] Encryption error:", error)
    throw error
  }
}

/**
 * Decrypt data using AES-256-CBC
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const [ivHex, encrypted] = encryptedData.split(":")

    if (!ivHex || !encrypted) {
      throw new Error("Invalid encrypted data format")
    }

    const iv = Buffer.from(ivHex, "hex")
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv)

    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("[Crypto] Decryption error:", error)
    throw error
  }
}
