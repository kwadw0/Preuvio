/** DTOs aligned with Swagger definitions: auth.SignupDto, auth.LoginDto, auth.TokenResponseDto */

export type SignupDto = {
  email: string
  first_name: string
  last_name: string
  password: string
  phone: string
}

export type LoginDto = {
  email: string
  password: string
}

export type TokenResponseDto = {
  access_token: string
  refresh_token: string
}

export type ApiSuccess<T> = {
  success: boolean
  message?: string
  data: T
}

export type ApiErrorPayload = {
  success?: boolean
  message?: string
  code?: string
}

export type AuthState = {
  isAuthenticated: boolean
  isLoading: boolean
}
