import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "./context"
import { useOnboardingStatus } from "../org/useOnboardingStatus"
import { usePartnerProfile } from "../partners/usePartnerProfile"

// Partner users are external vendors: they get the work queue and their own
// submissions, never org management. `/forms/:id/fill` stays reachable.
const PARTNER_BLOCKED_PREFIXES = ["/dashboard", "/templates", "/partners", "/forms", "/onboarding", "/org", "/profile"]
const PARTNER_FILL_PATTERN = /^\/forms\/[^/]+\/fill\/?$/

function partnerBlocked(pathname: string): boolean {
  if (PARTNER_FILL_PATTERN.test(pathname)) return false
  return PARTNER_BLOCKED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/** Blocks unauthenticated access — secure by default */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const { isLoading: orgLoading, isOnboarded, error: orgError } = useOnboardingStatus()
  const { isLoading: partnerLoading, isPartner } = usePartnerProfile()
  const isOnboardingRoute = location.pathname === "/onboarding"

  if (isLoading || partnerLoading) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>Checking session…</span>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Partner users have no organization, so the onboarding gate does not apply.
  if (isPartner) {
    if (partnerBlocked(location.pathname)) return <Navigate to="/assignments" replace />
    return <Outlet />
  }

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
  const { isLoading: partnerLoading, isPartner } = usePartnerProfile()

  if (isLoading || (isAuthenticated && partnerLoading)) {
    return (
      <div style={{ minHeight: "100svh", display: "grid", placeItems: "center", color: "var(--muted)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>Loading…</span>
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to={isPartner ? "/assignments" : "/dashboard"} replace />

  return <Outlet />
}
