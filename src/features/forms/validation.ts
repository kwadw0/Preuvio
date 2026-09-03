import type { RendererField } from "./types"
import { getOptions, getValidation } from "./types"

export type FieldErrors = Record<string, string>

function isEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === "string") return v.trim() === ""
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === "boolean") return !v
  return false
}

export function validateField(field: RendererField, value: unknown): string | null {
  const key = field.key
  const ft = field.field_type
  const required = field.is_required

  if (required && isEmpty(value)) return `${field.label} is required`

  if (isEmpty(value)) return null

  switch (ft) {
    case "email": {
      const s = String(value)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "Enter a valid email"
      break
    }
    case "number": {
      if (isNaN(Number(value))) return "Enter a valid number"
      break
    }
    case "phone": {
      const s = String(value).replace(/\s/g, "")
      if (!/^\+?[0-9\-()]{7,20}$/.test(s)) return "Enter a valid phone"
      break
    }
    case "date": {
      const d = new Date(String(value))
      if (isNaN(d.getTime())) return "Enter a valid date"
      break
    }
    case "select":
    case "radio": {
      const opts = getOptions(field)
      if (Array.isArray(opts) && opts.length) {
        const allowed = opts.map((o: unknown) => (typeof o === "string" ? o : (o as { value?: string }).value ?? String(o)))
        if (!allowed.includes(String(value))) return "Select a valid option"
      }
      break
    }
    case "multiselect":
    case "checkbox": {
      if (Array.isArray(value) && value.length === 0 && required) return `${field.label} is required`
      break
    }
    default:
      break
  }

  const v = getValidation(field) as Record<string, unknown> | null
  if (v) {
    if (typeof v.minLength === "number" && String(value).length < (v.minLength as number)) {
      return `At least ${v.minLength} characters`
    }
    if (typeof v.maxLength === "number" && String(value).length > (v.maxLength as number)) {
      return `At most ${v.maxLength} characters`
    }
    if (typeof v.min === "number" && Number(value) < (v.min as number)) return `Minimum ${v.min}`
    if (typeof v.max === "number" && Number(value) > (v.max as number)) return `Maximum ${v.max}`
    if (typeof v.pattern === "string" && v.pattern) {
      try {
        const re = new RegExp(v.pattern)
        if (!re.test(String(value))) return (v.patternMessage as string) || "Invalid format"
      } catch {
        /* ignore */
      }
    }
  }

  // keep key unused warning off
  void key
  return null
}

export function validateAll(fields: RendererField[], values: Record<string, unknown>): FieldErrors {
  const errs: FieldErrors = {}
  for (const f of fields) {
    const msg = validateField(f, values[f.key])
    if (msg) errs[f.key] = msg
  }
  return errs
}

export function evalVisibility(field: RendererField, values: Record<string, unknown>): boolean {
  const v = getValidation(field) as Record<string, unknown> | null
  const cond = (v?.visibleIf as { key: string; op: string; value?: unknown } | undefined)
  if (!cond || !cond.key) return true
  const src = values[cond.key]
  const op = cond.op
  const target = cond.value
  switch (op) {
    case "eq":
      return String(src) === String(target)
    case "neq":
      return String(src) !== String(target)
    case "contains":
      return String(src).includes(String(target))
    case "gt":
      return Number(src) > Number(target)
    case "lt":
      return Number(src) < Number(target)
    case "empty":
      return isEmpty(src)
    case "not_empty":
      return !isEmpty(src)
    default:
      return true
  }
}
