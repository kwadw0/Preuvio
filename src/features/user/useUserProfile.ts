import { useCallback, useEffect, useState } from "react"
import { useAuth } from "../auth/context"
import { ApiError } from "../../lib/api"
import { extractUser, fetchMyProfile } from "./api"
import { MOCK_USER } from "./types"
import type { UserProfileDto } from "./types"

type Status = {
  isLoading: boolean
  user: UserProfileDto | null
  isPlaceholder: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useUserProfile(): Status {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserProfileDto | null>(null)
  const [isPlaceholder, setIsPlaceholder] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setUser(null)
      setIsPlaceholder(false)
      setIsLoading(false)
      setError(null)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchMyProfile()
      const data = extractUser(res as never)
      if (data && data.email) {
        setUser(data)
        setIsPlaceholder(false)
      } else {
        // API empty — fall back to placeholder so UI stays full
        setUser(MOCK_USER)
        setIsPlaceholder(true)
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        setIsPlaceholder(false)
        setError(null)
      } else {
        // Endpoint not ready / network — show placeholder, keep error subtle for retry
        setUser(MOCK_USER)
        setIsPlaceholder(true)
        // don't surface as hard error; keep UI usable
        setError(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (authLoading) return
    load()
  }, [authLoading, load])

  return { isLoading: authLoading || isLoading, user, isPlaceholder, error, refresh: load }
}
