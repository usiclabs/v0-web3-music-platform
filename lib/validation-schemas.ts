// Common validation rules and schemas
import type { ValidationRule } from "@/hooks/use-form-validation"

export const ValidationRules = {
  // Email validation
  email: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return "Email is required"
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value) || "Please enter a valid email address"
    },
    message: "Invalid email format",
  }),

  // Required field
  required: (fieldName: string = "This field"): ValidationRule => ({
    validate: (value: any) => {
      if (value === undefined || value === null || value === "") return true
      return `${fieldName} is required`
    },
    message: "This field is required",
  }),

  // Minimum length
  minLength: (length: number): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return value.length >= length || `Must be at least ${length} characters`
    },
    message: `Minimum ${length} characters required`,
  }),

  // Maximum length
  maxLength: (length: number): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return value.length <= length || `Must not exceed ${length} characters`
    },
    message: `Maximum ${length} characters allowed`,
  }),

  // Number validation
  number: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return !isNaN(Number(value)) || "Please enter a valid number"
    },
    message: "Invalid number",
  }),

  // Minimum value
  minValue: (min: number): ValidationRule => ({
    validate: (value: string | number) => {
      if (!value) return true
      return Number(value) >= min || `Must be at least ${min}`
    },
    message: `Minimum value is ${min}`,
  }),

  // Maximum value
  maxValue: (max: number): ValidationRule => ({
    validate: (value: string | number) => {
      if (!value) return true
      return Number(value) <= max || `Must not exceed ${max}`
    },
    message: `Maximum value is ${max}`,
  }),

  // Ethereum address validation
  ethereumAddress: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      const addressRegex = /^0x[a-fA-F0-9]{40}$/
      return addressRegex.test(value) || "Please enter a valid Ethereum address"
    },
    message: "Invalid Ethereum address",
  }),

  // Username validation (alphanumeric + underscore/hyphen)
  username: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
      return (
        usernameRegex.test(value) || "Username must be 3-20 characters (letters, numbers, _, -)"
      )
    },
    message: "Invalid username format",
  }),

  // Matching fields (for password confirmation, etc.)
  match: (otherValue: string, fieldName: string = "fields"): ValidationRule => ({
    validate: (value: string) => {
      return value === otherValue || `${fieldName} do not match`
    },
    message: "Fields do not match",
  }),

  // URL validation
  url: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      try {
        new URL(value)
        return true
      } catch {
        return "Please enter a valid URL"
      }
    },
    message: "Invalid URL",
  }),

  // Alphanumeric only
  alphanumeric: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true
      return /^[a-zA-Z0-9]+$/.test(value) || "Only letters and numbers are allowed"
    },
    message: "Only letters and numbers allowed",
  }),
}

// Common validation schemas for common forms
export const ValidationSchemas = {
  // Artist profile schema
  artistProfile: {
    artist_name: [
      ValidationRules.required("Artist name"),
      ValidationRules.minLength(2),
      ValidationRules.maxLength(100),
    ],
    bio: [ValidationRules.maxLength(500)],
    wallet_address: [
      ValidationRules.required("Wallet address"),
      ValidationRules.ethereumAddress(),
    ],
  },

  // Track upload schema
  trackUpload: {
    title: [
      ValidationRules.required("Track title"),
      ValidationRules.minLength(1),
      ValidationRules.maxLength(200),
    ],
    artist: [
      ValidationRules.required("Artist name"),
      ValidationRules.minLength(1),
      ValidationRules.maxLength(100),
    ],
    genre: [ValidationRules.required("Genre")],
    file: [ValidationRules.required("Audio file")],
  },

  // Marketplace listing schema
  marketplaceListing: {
    title: [
      ValidationRules.required("Title"),
      ValidationRules.minLength(3),
      ValidationRules.maxLength(100),
    ],
    price: [
      ValidationRules.required("Price"),
      ValidationRules.number(),
      ValidationRules.minValue(0.01),
      ValidationRules.maxValue(1000000),
    ],
    description: [
      ValidationRules.required("Description"),
      ValidationRules.minLength(10),
      ValidationRules.maxLength(5000),
    ],
  },

  // Collaboration request schema
  collaborationRequest: {
    artistAddress: [
      ValidationRules.required("Artist address"),
      ValidationRules.ethereumAddress(),
    ],
    message: [
      ValidationRules.required("Message"),
      ValidationRules.minLength(10),
      ValidationRules.maxLength(1000),
    ],
  },
}
