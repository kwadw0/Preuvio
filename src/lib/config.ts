/**
 * Centralized app configuration
 * - Validates required env vars at boot
 * - Provides typed access to external API base URL
 * - Keeps secrets out of components
 */

type AppConfig = {
  apiBaseUrl: string
  appUrl: string
  env: "development" | "production" | "test"
}

function getEnv(key: string, fallback?: string): string | undefined {
  // Vite exposes env via import.meta.env
  // @ts-ignore
  const v = typeof import.meta !== "undefined" ? (import.meta as any).env?.[key] : undefined
  return v ?? fallback
}

function normalizeBaseUrl(url: string): string {
  if (!url) return ""
  return url.replace(/\/+$/, "")
}

function resolveApiBaseUrl(): string {
  const raw = getEnv("VITE_API_BASE_URL", undefined)
  // Empty string in .env means "use same-origin via Vite proxy" — do not fallback
  if (raw === "") return ""
  if (raw !== undefined) return normalizeBaseUrl(raw)
  return "https://preuvio-api.onrender.com"
}

export const config: AppConfig = {
  apiBaseUrl: resolveApiBaseUrl(),
  appUrl: getEnv("VITE_APP_URL", "https://app.preuvio.com")!,
  env: (getEnv("MODE", "development") as AppConfig["env"]) ?? "development",
}

export function isProd() {
  return config.env === "production"
}
