import { useCallback, useEffect, useState } from "react"
import { ApiError } from "../../lib/api"
import { useAuth } from "../auth/context"
import { getMyPartner } from "./api"
import type { PartnerResponse } from "./types"

/**
 * Shared probe: a partner user has a partner profile (GET /api/partners/me 200),
 * an organization member does not (403). Cached across hook instances so the
 * route guard, the shell and the dashboard probe once per session.
 */
let globalPartner: PartnerResponse | null = null
let globalIsPartner: boolean | null = null
let globalError: string | null = null
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((fn) => fn())
}

/** Seed the cache (e.g. after login) without a round trip. */
export function setPartnerCache(partner: PartnerResponse | null) {
  globalPartner = partner
  globalIsPartner = partner ? true : false
  globalError = null
  notify()
}

/** Forget who the account is — call on sign out. */
export function resetPartnerCache() {
  globalPartner = null
  globalIsPartner = null
  globalError = null
  notify()
}

export function usePartnerProfile() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(() => globalIsPartner === null)
  const [isPartner, setIsPartner] = useState<boolean | null>(() => globalIsPartner)
  const [partner, setPartner] = useState<PartnerResponse | null>(() => globalPartner)
  const [error, setError] = useState<string | null>(() => globalError)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      resetPartnerCache()
      setIsLoading(false)
      setIsPartner(null)
      setPartner(null)
      setError(null)
      return
    }

    setIsLoading(true)
    try {
      const p = await getMyPartner()
      globalPartner = p
      globalIsPartner = true
      globalError = null
      setPartner(p)
      setIsPartner(true)
      setError(null)
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
        globalPartner = null
        globalIsPartner = false
        globalError = null
        setPartner(null)
        setIsPartner(false)
        setError(null)
      } else if (e instanceof ApiError && e.status === 401) {
        globalPartner = null
        globalIsPartner = null
        setPartner(null)
        setIsPartner(null)
        setError(null)
      } else {
        // Network/unknown: don't claim the account is a partner.
        globalPartner = null
        globalIsPartner = false
        globalError = e instanceof Error ? e.message : "Failed to identify account"
        setPartner(null)
        setIsPartner(false)
        setError(globalError)
      }
    } finally {
      setIsLoading(false)
      notify()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    if (globalIsPartner !== null && isAuthenticated) {
      setIsLoading(false)
      return
    }
    void load()
  }, [authLoading, isAuthenticated, load])

  useEffect(() => {
    const sync = () => {
      setIsPartner(globalIsPartner)
      setPartner(globalPartner)
      setError(globalError)
      setIsLoading(false)
    }
    listeners.add(sync)
    return () => { listeners.delete(sync) }
  }, [])

  return { isLoading: authLoading || isLoading, isPartner, partner, error, refresh: load }
}
