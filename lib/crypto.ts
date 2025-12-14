import crypto from "crypto"

const ENCRYPTION_ALGORITHM = "aes-256-cbc"
const WALLET_ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-dev-key-32-char-minimum!"

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(WALLET_ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
    iv,
  )

  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])

  return iv.toString("hex") + ":" + encrypted.toString("hex")
}

export function decrypt(text: string): string {
  const parts = text.split(":")
  const iv = Buffer.from(parts[0], "hex")
  const encryptedText = Buffer.from(parts[1], "hex")

  const decipher = crypto.createDecipheriv(
    ENCRYPTION_ALGORITHM,
    Buffer.from(WALLET_ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)),
    iv,
  )

  let decrypted = decipher.update(encryptedText)
  decrypted = Buffer.concat([decrypted, decipher.final()])

  return decrypted.toString()
}
