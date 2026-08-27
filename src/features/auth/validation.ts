/**
 * Client-side validation mirroring server DTO constraints.
 * Keeps validation DRY — single source for form components.
 * Never trust client alone; server still enforces (400/409).
 */

export type SignupErrors = Partial<Record<"first_name" | "last_name" | "email" | "password" | "phone" | "form", string>>
export type LoginErrors = Partial<Record<"email" | "password" | "form", string>>

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateSignup(fields: {
  first_name: string
  last_name: string
  email: string
  password: string
  phone: string
}): SignupErrors {
  const errors: SignupErrors = {}

  if (!fields.first_name.trim()) errors.first_name = "First name is required"
  else if (fields.first_name.trim().length < 2) errors.first_name = "At least 2 characters"

  if (!fields.last_name.trim()) errors.last_name = "Last name is required"
  else if (fields.last_name.trim().length < 2) errors.last_name = "At least 2 characters"

  if (!fields.email.trim()) errors.email = "Email is required"
  else if (!emailRegex.test(fields.email.trim())) errors.email = "Enter a valid email"

  if (!fields.password) errors.password = "Password is required"
  else if (fields.password.length < 6) errors.password = "At least 6 characters"
  else {
    // Match passwordRules in UI but keep server min 6 as ground truth
    const missing: string[] = []
    if (fields.password.length < 8) missing.push("8+ characters")
    if (!/[A-Z]/.test(fields.password)) missing.push("uppercase")
    if (!/[a-z]/.test(fields.password)) missing.push("lowercase")
    if (!/[0-9]/.test(fields.password)) missing.push("number")
    if (missing.length > 2) errors.password = `Weak password: needs ${missing.join(", ")}`
  }

  if (!fields.phone.trim()) errors.phone = "Phone is required"
  else if (fields.phone.trim().length < 6) errors.phone = "Enter a valid phone number"

  return errors
}

export function validateLogin(fields: { email: string; password: string }): LoginErrors {
  const errors: LoginErrors = {}
  if (!fields.email.trim()) errors.email = "Email is required"
  else if (!emailRegex.test(fields.email.trim())) errors.email = "Enter a valid email"
  if (!fields.password) errors.password = "Password is required"
  return errors
}
