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
