import { useEffect, useState, useCallback } from "react"
import { useAuth } from "../auth/context"
import { ApiError } from "../../lib/api"
import { extractOrg, fetchMyOrganization } from "./api"
import type { OrganizationResponseDto } from "./types"

type Status = {
  isLoading: boolean
  isOnboarded: boolean | null
  org: OrganizationResponseDto | null
  error: string | null
  refresh: () => Promise<void>
}

// Shared cache across hook instances (ProtectedRoute + OrgPage + OnboardingPage)
let globalOrg: OrganizationResponseDto | null = null
let globalOnboarded: boolean | null = null
let globalError: string | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

export function setOnboardedCache(org: OrganizationResponseDto | null) {
  globalOrg = org
  globalOnboarded = !!org?.id
  globalError = null
  notify()
}

export function useOnboardingStatus(): Status {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(() => (globalOnboarded !== null ? false : true))
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(() => globalOnboarded)
  const [org, setOrg] = useState<OrganizationResponseDto | null>(() => globalOrg)
  const [error, setError] = useState<string | null>(() => globalError)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      globalOnboarded = null
      globalOrg = null
      globalError = null
      setIsOnboarded(null)
      setOrg(null)
      setIsLoading(false)
      setError(null)
      notify()
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchMyOrganization()
      const data = extractOrg(res as never)
      if (data && (data as OrganizationResponseDto).id) {
        globalOrg = data as OrganizationResponseDto
        globalOnboarded = true
        globalError = null
        setOrg(globalOrg)
        setIsOnboarded(true)
      } else {
        globalOrg = null
        globalOnboarded = false
        globalError = null
        setOrg(null)
        setIsOnboarded(false)
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 400)) {
        globalOnboarded = false
        globalOrg = null
        globalError = null
        setIsOnboarded(false)
        setOrg(null)
      } else if (err instanceof ApiError && err.status === 401) {
        globalOnboarded = null
        globalOrg = null
        globalError = null
        setIsOnboarded(null)
        setOrg(null)
      } else {
        const msg = err instanceof Error ? err.message : "Failed to load organization"
        globalError = msg
        globalOnboarded = false
        globalOrg = null
        setError(msg)
        setIsOnboarded(false)
        setOrg(null)
      }
    } finally {
      setIsLoading(false)
      notify()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    // if we already have cached result for this auth session, don't refetch immediately
    if (globalOnboarded !== null && isAuthenticated) {
      setIsLoading(false)
      return
    }
    load()
  }, [authLoading, load, isAuthenticated])

  // Subscribe to global cache updates (e.g., after successful POST)
  useEffect(() => {
    const sync = () => {
      setIsOnboarded(globalOnboarded)
      setOrg(globalOrg)
      setError(globalError)
      setIsLoading(false)
    }
    listeners.add(sync)
    return () => { listeners.delete(sync) }
  }, [])

  return { isLoading: authLoading || isLoading, isOnboarded, org, error, refresh: load }
}
