"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: { message: string } | null
  touched?: boolean
  helperText?: string
  icon?: React.ReactNode
  showSuccessCheck?: boolean
}

export const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, touched, helperText, icon, showSuccessCheck = true, className, ...props }, ref) => {
    const hasError = error && touched
    const isValid = touched && !error && showSuccessCheck && props.value

    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-sm font-medium text-white/90">{label}</label>}

        <div className="relative">
          <Input
            ref={ref}
            className={`${
              hasError
                ? "border-red-500 focus:ring-red-500"
                : isValid
                  ? "border-emerald-500 focus:ring-emerald-500"
                  : "border-white/20 focus:ring-red-500"
            } ${className}`}
            {...props}
          />

          {/* Success indicator */}
          {isValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          )}

          {/* Error indicator */}
          {hasError && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
          )}
        </div>

        {/* Error message */}
        {hasError && <p className="text-sm text-red-500 font-medium">{error.message}</p>}

        {/* Helper text */}
        {!hasError && helperText && <p className="text-xs text-white/50">{helperText}</p>}
      </div>
    )
  },
)

FormField.displayName = "FormField"
