/**
 * Typed API client - thin wrapper around fetch.
 * Secure defaults:
 * - Base URL from centralized config (normalize trailing slash)
 * - Automatic Bearer injection for authenticated calls
 * - Single-flight refresh on 401 + queued retry
 * - Structured ApiError with sanitized messages
 * - Timeout via AbortController, JSON/FormData handling
 */
import { config } from "./config"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "./token"

type ApiOptions = RequestInit & {
  authToken?: string
  params?: Record<string, string | number | boolean | undefined>
  /** Set true to let the client retry once after refresh */
  withAuth?: boolean
  /** Per-request timeout in ms */
  timeoutMs?: number
}

export class ApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload?: unknown) {
    super(message)
    this.status = status
    this.payload = payload
    this.name = "ApiError"
  }
}

function buildUrl(path: string, params?: ApiOptions["params"]) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  // Empty apiBaseUrl means same-origin (Vite proxy) — keep relative URL
  if (!config.apiBaseUrl && !path.startsWith("http")) {
    const url = new URL(normalizedPath, typeof window !== "undefined" ? window.location.origin : "http://localhost")
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
      })
    }
    // Return relative path for browser fetch (avoids CORS)
    return `${url.pathname}${url.search}`
  }
  const url = new URL(path.startsWith("http") ? path : `${config.apiBaseUrl}${normalizedPath}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
    })
  }
  return url.toString()
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const m = (payload as { message?: unknown }).message
    if (typeof m === "string" && m.trim()) return m
  }
  if (typeof payload === "string" && payload.trim()) return payload.trim().slice(0, 300)
  return fallback
}

// ---------- refresh queue (single-flight) ----------
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      if (!res.ok) {
        clearTokens()
        return null
      }
      const body = (await res.json()) as {
        data?: { access_token?: string; refresh_token?: string }
        access_token?: string
        refresh_token?: string
      }
      const data = body.data ?? body
      if (data?.access_token) {
        setTokens(data.access_token, data.refresh_token ?? refreshToken)
        return data.access_token
      }
      clearTokens()
      return null
    } catch {
      clearTokens()
      return null
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

export async function api<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { authToken, params, headers, withAuth, timeoutMs = 15000, ...rest } = opts

  // withAuth implies inject current access token if no explicit authToken
  const token = authToken ?? (withAuth ? getAccessToken() : undefined)
  const url = buildUrl(path, params)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers as Record<string, string>),
      },
    })

    // Handle 401 refresh once for auth calls
    if (res.status === 401 && withAuth && !authToken) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        // retry once with new token, bypass refresh loop
        return api<T>(path, { ...opts, authToken: newToken, withAuth: false })
      }
      throw new ApiError("Session expired. Please sign in again.", 401, { code: "UNAUTHORIZED" })
    }

    if (!res.ok) {
      let payload: unknown
      try {
        payload = await res.json()
      } catch {
        try {
          payload = await res.text()
        } catch {
          payload = null
        }
      }
      const msg = extractErrorMessage(payload, `Request failed (${res.status})`)
      throw new ApiError(msg, res.status, payload)
    }

    if (res.status === 204) return undefined as T
    const text = await res.text()
    if (!text) return undefined as T
    return JSON.parse(text) as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("Request timed out. Please try again.", 408)
    }
    throw new ApiError(err instanceof Error ? err.message : "Network error. Please check your connection.", 0)
  } finally {
    clearTimeout(timeout)
  }
}

// Convenience for authenticated calls — injects token + enables refresh
export function apiAuth<T>(path: string, opts: Omit<ApiOptions, "withAuth"> = {}): Promise<T> {
  return api<T>(path, { ...opts, withAuth: true })
}

// Example domain types (aligned with landing copy)
export type PartnerStatus = "pending" | "submitted" | "approved" | "expired"
export type ComplianceDocument = {
  id: string
  name: string
  status: PartnerStatus
  updatedAt: string
}
