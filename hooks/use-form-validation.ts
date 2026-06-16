"use client"

import { useState, useCallback } from "react"

interface FieldError {
  message: string
  type?: "error" | "warning"
}

interface FieldErrors {
  [key: string]: FieldError
}

interface ValidationRule {
  validate: (value: any) => boolean | string
  message: string
}

interface FormValidationOptions {
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

export function useFormValidation(rules: Record<string, ValidationRule[]>, options: FormValidationOptions = {}) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Set<string>>(new Set())

  const validateField = useCallback(
    (name: string, value: any): FieldError | null => {
      const fieldRules = rules[name]
      if (!fieldRules) return null

      for (const rule of fieldRules) {
        const result = rule.validate(value)
        if (result !== true) {
          return {
            message: typeof result === "string" ? result : rule.message,
            type: "error",
          }
        }
      }

      return null
    },
    [rules],
  )

  const handleFieldChange = useCallback(
    (name: string, value: any) => {
      if (options.validateOnChange && touched.has(name)) {
        const error = validateField(name, value)
        setErrors((prev) => {
          const newErrors = { ...prev }
          if (error) {
            newErrors[name] = error
          } else {
            delete newErrors[name]
          }
          return newErrors
        })
      }
    },
    [validateField, touched, options.validateOnChange],
  )

  const handleFieldBlur = useCallback(
    (name: string) => {
      setTouched((prev) => new Set([...prev, name]))

      if (options.validateOnBlur) {
        const input = document.querySelector(`input[name="${name}"], textarea[name="${name}"]`) as HTMLInputElement
        const value = input?.value
        const error = validateField(name, value)
        setErrors((prev) => {
          const newErrors = { ...prev }
          if (error) {
            newErrors[name] = error
          } else {
            delete newErrors[name]
          }
          return newErrors
        })
      }
    },
    [validateField, options.validateOnBlur],
  )

  const validateForm = useCallback(
    (formData: Record<string, any>): boolean => {
      const newErrors: FieldErrors = {}

      for (const [name, value] of Object.entries(formData)) {
        const error = validateField(name, value)
        if (error) {
          newErrors[name] = error
        }
      }

      setErrors(newErrors)
      setTouched(new Set(Object.keys(formData)))
      return Object.keys(newErrors).length === 0
    },
    [validateField],
  )

  const clearError = useCallback((name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const getFieldError = useCallback(
    (name: string): FieldError | null => {
      return errors[name] || null
    },
    [errors],
  )

  const isFieldTouched = useCallback(
    (name: string): boolean => {
      return touched.has(name)
    },
    [touched],
  )

  const getFieldState = useCallback(
    (name: string) => ({
      error: getFieldError(name),
      touched: isFieldTouched(name),
      hasError: !!errors[name],
    }),
    [errors, touched, getFieldError, isFieldTouched],
  )

  return {
    errors,
    touched,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    validateForm,
    clearError,
    getFieldError,
    isFieldTouched,
    getFieldState,
    isValid: Object.keys(errors).length === 0,
  }
}
