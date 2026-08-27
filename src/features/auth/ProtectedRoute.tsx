import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "./context"
import { useOnboardingStatus } from "../org/useOnboardingStatus"

/** Blocks unauthenticated access — secure by default */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const { isLoading: orgLoading, isOnboarded, error: orgError } = useOnboardingStatus()
  const isOnboardingRoute = location.pathname === "/onboarding"

  if (isLoading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>Checking session…</span>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (orgLoading || isOnboarded === null) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>Checking workspace…</span>
      </div>
    )
  }

  // Not onboarded → force onboarding, except when already there
  if (isOnboarded === false && !orgError && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />
  }

  // Already onboarded → don't stay on onboarding
  if (isOnboarded === true && isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

/** Redirects authenticated users away from auth pages */
export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>Loading…</span>
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
