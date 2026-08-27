import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { ApiError } from "../../lib/api"
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from "../../lib/token"
import * as authApi from "./api"
import type { LoginDto, SignupDto } from "./types"

type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginDto) => Promise<void>
  signup: (payload: SignupDto) => Promise<void>
  logout: () => void
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!getAccessToken())
  const [isLoading, setIsLoading] = useState(false)

  // On mount, if we have a refresh token but no access token, try to refresh once
  useEffect(() => {
    const access = getAccessToken()
    const refresh = getRefreshToken()
    if (!access && refresh) {
      setIsLoading(true)
      authApi
        .refresh(refresh)
        .then((res) => {
          if (res?.data?.access_token) {
            setTokens(res.data.access_token, res.data.refresh_token)
            setIsAuthenticated(true)
          } else {
            clearTokens()
            setIsAuthenticated(false)
          }
        })
        .catch(() => {
          clearTokens()
          setIsAuthenticated(false)
        })
        .finally(() => setIsLoading(false))
    }
  }, [])

  const login = useCallback(async (payload: LoginDto) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(payload)
      const tokens = res.data
      if (!tokens?.access_token) throw new ApiError("Invalid server response", 500)
      setTokens(tokens.access_token, tokens.refresh_token)
      setIsAuthenticated(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signup = useCallback(async (payload: SignupDto) => {
    setIsLoading(true)
    try {
      const res = await authApi.signup(payload)
      const tokens = res.data
      if (!tokens?.access_token) throw new ApiError("Invalid server response", 500)
      setTokens(tokens.access_token, tokens.refresh_token)
      setIsAuthenticated(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setIsAuthenticated(false)
  }, [])

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const refresh = getRefreshToken()
    if (!refresh) return false
    try {
      const res = await authApi.refresh(refresh)
      if (res?.data?.access_token) {
        setTokens(res.data.access_token, res.data.refresh_token)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch {
      clearTokens()
      setIsAuthenticated(false)
      return false
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated, isLoading, login, signup, logout, refreshSession }),
    [isAuthenticated, isLoading, login, signup, logout, refreshSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
