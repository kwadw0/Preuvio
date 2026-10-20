import { api } from "../../lib/api"
import type { ApiSuccess, LoginDto, SignupDto, TokenResponseDto } from "./types"

/**
 * Auth endpoints — single responsibility, no token side-effects here.
 * Caller (context) decides how to persist tokens.
 */

export function signup(payload: SignupDto): Promise<ApiSuccess<TokenResponseDto>> {
  return api<ApiSuccess<TokenResponseDto>>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function login(payload: LoginDto): Promise<ApiSuccess<TokenResponseDto>> {
  return api<ApiSuccess<TokenResponseDto>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function refresh(refreshToken: string): Promise<ApiSuccess<TokenResponseDto>> {
  return api<ApiSuccess<TokenResponseDto>>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
}

export function verifyEmail(token: string): Promise<ApiSuccess<unknown>> {
  return api<ApiSuccess<unknown>>("/api/auth/verify-email", {
    method: "GET",
    params: { token },
  })
}

export function forgotPassword(email: string): Promise<ApiSuccess<unknown>> {
  return api<ApiSuccess<unknown>>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  })
}

export function resetPassword(token: string, new_password: string): Promise<ApiSuccess<unknown>> {
  return api<ApiSuccess<unknown>>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password }),
  })
}

export type AcceptInviteDto = {
  token: string
  first_name: string
  last_name: string
  password: string
  phone: string
}

export function acceptInvite(dto: AcceptInviteDto): Promise<ApiSuccess<TokenResponseDto>> {
  return api<ApiSuccess<TokenResponseDto>>("/api/partners/invite/accept", {
    method: "POST",
    body: JSON.stringify(dto),
  })
}
