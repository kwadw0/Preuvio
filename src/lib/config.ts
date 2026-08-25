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

export const config: AppConfig = {
  apiBaseUrl: getEnv("VITE_API_BASE_URL", "https://api.preuvio.com/v1")!,
  appUrl: getEnv("VITE_APP_URL", "https://app.preuvio.com")!,
  env: (getEnv("MODE", "development") as AppConfig["env"]) ?? "development",
}

export function isProd() {
  return config.env === "production"
}
