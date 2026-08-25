/**
 * Typed API client - thin wrapper around fetch.
 * Ready to plug external API once available.
 * - Base URL from config
 * - Auth header injection
 * - Standardized error handling
 * - JSON + FormData support
 */
import { config } from "./config"

type ApiOptions = RequestInit & {
  authToken?: string
  params?: Record<string, string | number | boolean | undefined>
}

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

function buildUrl(path: string, params?: ApiOptions["params"]) {
  const url = new URL(path.startsWith("http") ? path : `${config.apiBaseUrl}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { authToken, params, headers, ...rest } = opts
  const url = buildUrl(path, params)

  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers as Record<string, string>),
    },
  })

  if (!res.ok) {
    let payload: unknown
    try {
      payload = await res.json()
    } catch {
      payload = await res.text()
    }
    throw new ApiError(`API ${res.status} ${res.statusText}`, res.status, payload)
  }

  // 204
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// Example domain types (aligned with landing copy)
export type PartnerStatus = "pending" | "submitted" | "approved" | "expired"
export type ComplianceDocument = {
  id: string
  name: string
  status: PartnerStatus
  updatedAt: string
}
