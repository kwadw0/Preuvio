/**
 * Token storage — isolated module for secure handling.
 * - Access token: kept in memory + localStorage for persistence across reloads.
 *   Ideally httpOnly cookie in production; this is the best client-side fallback.
 * - Refresh token: localStorage only (required for /api/auth/refresh).
 * - All writes go through setTokens/clearTokens to keep state consistent.
 * - Keys are prefixed to avoid collisions.
 */

const ACCESS_KEY = "preuvio_access_token"
const REFRESH_KEY = "preuvio_refresh_token"

let memoryAccessToken: string | null = null

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export function getAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken
  if (!isBrowser()) return null
  const v = localStorage.getItem(ACCESS_KEY)
  if (v) memoryAccessToken = v
  return v
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string | null): void {
  memoryAccessToken = accessToken
  if (!isBrowser()) return
  localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens(): void {
  memoryAccessToken = null
  if (!isBrowser()) return
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  // legacy key from mock implementation
  localStorage.removeItem("token")
}

export function hasTokens(): boolean {
  return !!getAccessToken()
}
